const PDFDocument = require('pdfkit');
const querystring = require('querystring');

module.exports = async (req, res) => {
    // Vercel serverless function handler
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, data } = req.body;
        
        if (!data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        // Parse the serialized data from the 'data' field (which is a query string)
        const invoiceData = querystring.parse(data);

        // 1. Logic for PDF generation using pdfkit (as requested)
        // Note: The frontend currently generates its own PDF via html2pdf, 
        // but we implement the logic here as requested for server-side capability.
        
        const doc = new PDFDocument();
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        
        return new Promise((resolve) => {
            doc.on('end', () => {
                let pdfData = Buffer.concat(buffers);
                
                // We return a JSON response so the frontend's AJAX 'success' callback fires.
                // The frontend will then proceed with its own client-side PDF generation.
                // If we wanted to return the PDF directly, we would change Content-Type.
                res.status(200).json({
                    status: 200,
                    message: 'PDF logic executed on server',
                    invoice_number: invoiceData.invoice_number || 'N/A'
                });
                resolve();
            });

            // Basic PDF generation logic with pdfkit
            doc.fontSize(25).text(invoiceData.bill_type?.toUpperCase() || 'INVOICE', { align: 'right' });
            doc.moveDown();
            
            doc.fontSize(10).text(`Number: ${invoiceData.invoice_number || ''}`, { align: 'right' });
            doc.text(`Date: ${invoiceData.invoice_date || ''}`, { align: 'right' });
            
            doc.moveDown();
            doc.fontSize(14).text('From:', { underline: true });
            doc.fontSize(10).text(invoiceData.company_name || '');
            doc.text(invoiceData.company_details || '');
            
            doc.moveDown();
            doc.fontSize(14).text('Bill To:', { underline: true });
            doc.fontSize(10).text(invoiceData.client_details || '');

            doc.moveDown(2);
            doc.fontSize(12).text(`Total Amount: ${invoiceData.bill_currency || ''}${invoiceData.total || '0.00'}`, { align: 'right', bold: true });
            
            if (invoiceData.terms) {
                doc.moveDown();
                doc.fontSize(10).text('Terms & Conditions:', { underline: true });
                doc.text(invoiceData.terms);
            }
            
            doc.end();
        });

    } catch (error) {
        console.error('Serverless Error:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};
