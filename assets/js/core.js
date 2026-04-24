var protocol = window.location.protocol + '//';
var host = window.location.host;
var path = window.location.pathname;
var canonicalLink = document.querySelector('link[rel="canonical"]');

if(path == '/') {
    path = '';
}

if (canonicalLink) {
    canonicalLink.href = protocol + host + path;
}

// Function to be executed when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    var logo = document.getElementById("logo");

    if(logo && host != 'makerinvoice.com') {
        logo.innerHTML = host;
    }

    if(host != 'invoicemaker.local' && host != 'makerinvoice.com' && host != 'free.makerinvoice.com' && host != 'invoicemaker.me') {
        document.body.innerHTML = '';
    }
});

// Core JavaScript

var subtotal = 0.00;
var total = 0.00;
var tax = 0.00;
var discount = 0.00;
var advance_amount = 0.00;

jQuery(document).ready(function () {
    $("#closeDonationModal").click(function(){
        $(".donation").hide();
        $(".donation-wrapper").hide();
    });

    //! Signature
    $("#newSignature").on('click', function(){
        //ToDo automatic save signature
        console.log('newSignature click');
    });

    //! settings
    $('.settings_toggle').on('click', function () {
        $('#show_settings_toggle').slideToggle();
        $('.invoicemaker_arrow').toggleClass('invoicemaker_arrow_rotate');
        if ($('.content_overlap_btn').hasClass('hidden_btn')) {
            $('.content_overlap_btn').removeClass('hidden_btn');
            $('.content_overlap_btn').show();
        }
    });

    //! notifications
    jQuery('.notification_toggle').on('click', function () {
        jQuery('#show_top_notification').slideToggle();
        jQuery('.invoicemaker_arrow').toggleClass('invoicemaker_arrow_rotate');
        if (jQuery('.content_overlap_btn').hasClass('hidden_btn')) {
            jQuery('.content_overlap_btn').removeClass('hidden_btn');
            jQuery('.content_overlap_btn').show();
            jQuery('.invoicemaker_sub_content').slideUp();
            jQuery('.invoicemaker_main_content').removeClass('invoicemaker_main_content_bfr');
        }
    });

    jQuery('.content_overlap_btn').on('click', function () {
        jQuery(this).hide();
        jQuery(this).addClass('hidden_btn');
        jQuery('.invoicemaker_sub_content').slideDown();
        jQuery('.invoicemaker_main_content').addClass('invoicemaker_main_content_bfr');
    });
    jQuery(".file-input").change(function () {
        if (typeof (FileReader) != "undefined") {
            var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.jpg|.jpeg|.gif|.png|.bmp)$/;
            jQuery($(this)[0].files).each(function () {
                var file = jQuery(this);
                if (regex.test(file[0].name.toLowerCase())) {
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        resizedataURL(e.target.result, file[0].type, 90, 90);
                        ///// addLogo(e.target.result);
                    }
                    reader.readAsDataURL(file[0]);
                } else {
                    removeLogo();
                    alert(file[0].name + " is not a valid image file.");
                    return false;
                }
            });
        } else {
            alert("This browser does not support HTML5 FileReader.");
        }
    });

    jQuery('#logo_remove_btn').on('click', function () {
        removeLogo();
    });

    jQuery('#addnew_row').on('click', function () {
        addNewRow();
    });

    //calculating change in row
    ItemRowChange();

    jQuery('#download_as_pdf').on('click', function () {
        jQuery('#invoice_builder').submit();
    });

    jQuery(".currency-selector").on("change", updateSymbol);

    jQuery('#invoice_builder').validate({
        errorClass: 'is-danger',
        validClass: '',
        submitHandler: function () {
            jQuery('.wait_loader').fadeIn();
            var serializedData = jQuery('#invoice_builder').serialize();
            // var builderUrl = site_url + 'packme/';
            var builderUrl = '/api/packme';
            jQuery.ajax({
                url: builderUrl,
                type: 'POST',
                data: {
                    action: 'pack',
                    data: serializedData
                },
                success: function (response) {
                    //! Decode the serialized data
                    var invoiceData = decodeSerializedData(serializedData);

                    // console.log(invoiceData);

                    // var htmlContent = document.getElementById('invoice_builder').innerHTML;
                    var htmlContent = '';

                    if(invoiceData['bill_type'] == 'invoice' || invoiceData['bill_type'] == 'estimate' || invoiceData['bill_type'] == 'quote') {

                    // Generation of HTML content
                    htmlContent = '<div class="invoice-wrapper">';

                    htmlContent += `
                        <style>
                            * {
                                box-sizing: border-box;
                            }

                            body {
                                font-family: Arial, sans-serif;
                            }

                            .invoice-wrapper {
                                display: block;
                                padding: 70px;
                            }

                            .invoice-bill-from, .invoice-bill-to {
                                width: 100%;
                                margin-bottom: 100px;
                            }

                            .invoice-bill-to {
                                margin-bottom: 35px;
                            }

                            .invoice-bill-from .name {
                                font-size: 20px;
                                font-weight: bold;
                                padding-top: 0;
                                margin-top: 0;
                                margin-bottom: 20px;
                                margin-bottom: 5px;
                            }

                            .invoice-bill-from .invoice-bill-from__left,
                            .invoice-bill-from .invoice-bill-from__right,
                            .invoice-bill-to .invoice-bill-to__left,
                            .invoice-bill-to .invoice-bill-to__right {
                                width: 49%;
                                display: inline-block;
                            }

                            .invoice-bill-from .invoice-bill-from__right {
                                text-align: right;
                                float: right;
                                font-weight: bold;
                                font-size: 25px !important;
                                text-transform: uppercase;
                            }

                            .invoice-bill-from .invoice-bill-from__right, .invoice-bill-to .invoice-bill-to__right {
                                text-align: right;
                                float: right;
                                font-size: 15px;
                            }

                            .invoice-details {
                                margin-bottom: 20px;
                                margin-top: 0;
                            }
                            .invoice-details .invoice-detail p {
                                margin: 5px 0;
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100%;
                                display: block;
                            }

                            .invoice-details .invoice-detail {
                                display: flex;
                            }

                            .invoice-details .invoice-detail p b {
                                text-transform: capitalize;
                                text-align: right;
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 100px !important;
                                display: inline-block;
                            }
                            .invoice-items {
                                width: 100%;
                                border-collapse: collapse;
                            }

                            .invoice-items tr.header {
                                background-color: #f2f2f2;
                            }

                            .invoice-items th, .invoice-items td {
                                border: 1px solid #aaa;
                                padding: 8px;
                            }

                            .invoice-items .description {
                                width: 70%;
                                text-align: center;
                            }

                            .invoice-items .amount {
                                width: 30%;
                                text-align: center;
                            }

                            .invoice-items td.description {
                                text-align: left;
                            }

                            .invoice-items td.amount {
                                text-align: right;
                            }

                            .invoice-total {
                                width: 100%;
                                display: flex;
                                justify-content: space-between;
                            }

                            .invoice-total .invoice-total__total {
                                width: 68%;
                                border: 1px solid #fff;
                                padding: 8px;
                                text-align: right;
                                font-weight: bold;
                                display: inline-block;
                                float: left;
                            }

                            .invoice-total .invoice-total__amount {
                                width: 27.6%;
                                width: 30%;
                                background-color: #f2f2f2;
                                border: 1px solid #aaa;
                                color: #000;
                                padding: 8px;
                                text-align: right;
                                font-weight: bold;
                                display: inline-block;
                                float: right;
                            }

                            .terms-conditions {
                                margin-top: 150px;
                                margin-top: 100px;
                                font-size: 12px;
                            }

                            .additional-notes {
                                margin-top: 50px;
                            }

                            .signature-wrapper {
                                margin: 0;
                                padding: 0;
                                width: 100%;
                                display: flex;
                                justify-content: flex-end;
                            }

                            .signature-wrapper img {
                                margin: 0;
                                padding: 0;
                                max-width: 200px;
                                max-height: 200px;
                                width: 100%;
                                height: 100%;
                            }

                            .border-transparent {
                                border-color: transparent !important;
                            }

                        </style>`;

                        //! Invoice Logo
                        var logo = '';

                        if(invoiceData['logo'] != '') {
                            logo = '<img src="' + invoiceData['logo'] + '" alt="' + invoiceData['bill_type'] + '"><br>';
                        }

                        //! Invoice from
                        invoiceData['company_details'] = invoiceData['company_details'].replace(/(?:\r\n|\r|\n)/g, '<br>');

                        htmlContent += `
                        <div class='invoice-bill-from'>
                            <div class='invoice-bill-from__left'>
                                ${logo}
                                <p class='name'>${invoiceData['company_name']}</p><br>
                                ${invoiceData['company_details']}
                            </div>

                            <div class='invoice-bill-from__right'>
                                ${invoiceData['bill_type']}
                            </div>
                        </div>`;

                        //! Pan Number
                        var pan_number = '';

                        if(invoiceData['pan_number']) {
                            pan_number = `<div class='invoice-detail'><p><b>PAN #</b></p><p>${invoiceData['pan_number']}</p></div>`;
                        }

                        //! GSTIN/TAX Number
                        var tax_number = '';

                        if(invoiceData['tax_number']) {
                            tax_number = `<div class='invoice-detail'><p><b>GST/TAX #</b></p><p>${invoiceData['tax_number']}</p></div>`;
                        }

                        //! Invoice Bill To
                        invoiceData['client_details'] = invoiceData['client_details'].replace(/(?:\r\n|\r|\n)/g, '<br>');
                        invoiceData['invoice_date'] = invoiceData['invoice_date'].split('-').join('/');

                        htmlContent += `
                        <div class='invoice-bill-to'>
                            <div class='invoice-bill-to__left'>
                                <b>Bill To</b><br><br>
                                ${invoiceData['client_details']}
                            </div>

                            <div class='invoice-bill-to__right'>
                                <div class='invoice-details'>
                                    <div class='invoice-detail'>
                                        <p><b>${invoiceData['bill_type']} #</b></p><p>${invoiceData['invoice_number']}</p>
                                    </div>
                                    <div class='invoice-detail'>
                                        <p><b>${invoiceData['bill_type']} Date</b></p><p>${invoiceData['invoice_date']}</p>
                                    </div>
                                    ${pan_number}
                                    ${tax_number}
                                </div>
                            </div>
                        </div>`;

                        //! Invoice items
                        var invoice_items = '';

                        // Get all elements with class 'columns' inside 'append_item_row'
                        var itemRows = document.querySelectorAll('.append_item_row .columns');

                        // Iterate over each item row
                        itemRows.forEach(function(row) {
                            var description = row.querySelector('.name').value;
                            var price = row.querySelector('.price').value;
                            var qty = row.querySelector('.qty').value;
                            var amount = row.querySelector('.amount').value;

                            if(amount) {
                                //! Format amount
                                amount = formatPrice(amount);

                                //! Without currency
                                invoice_items += "<tr class='item'><td class='description'>" + description + "</td><td class='amount'>" + amount + "</td></tr>";

                                // ToDo Without currency and with price + qty
                                // invoice_items += "<tr class='item'><td class='description'>" + description + "</td><td class='amount'>" + amount + "</td></tr>";

                                //! With currency
                                // invoice_items += "<tr class='item'><td class='description'>" + description + "</td><td class='amount'>" + invoiceData['bill_currency'] + amount + "</td></tr>";
                            }
                        });

                        //! Invoice
                        htmlContent += `
                        <table class='invoice-items'>
                            <tr class='header'>
                                <th class='description'>DESCRIPTION</th>
                                <th class='amount'>AMOUNT</th>
                            </tr>
                            ${invoice_items}
                        </table>`;

                        //! Subtotal
                        if(invoiceData['tax_amount'] || invoiceData['discount']) {
                            htmlContent += `<div class='invoice-total'>
                                <div class='invoice-total__total border-transparent'>SUBTOTAL</div>
                                <div class='invoice-total__amount'>${invoiceData['bill_currency']}${invoiceData['sub_total']}</div>
                            </div>`;
                        }

                        //! GST/Tax
                        if(invoiceData['tax_amount']) {
                            htmlContent += `<div class='invoice-total'>
                                <div class='invoice-total__total border-transparent'>GST/Tax</div>
                                <div class='invoice-total__amount'>${invoiceData['tax_amount']}%</div>
                            </div>`;
                        }

                        //! Discount
                        if(invoiceData['discount']) {
                            htmlContent += `<div class='invoice-total'>
                                <div class='invoice-total__total border-transparent'>Discount</div>
                                <div class='invoice-total__amount'>${invoiceData['discount']}%</div>
                            </div>`;
                        }

                        //! Advance
                        if(invoiceData['advance']) {
                            htmlContent += `<div class='invoice-total'>
                                <div class='invoice-total__total border-transparent'>Advance</div>
                                <div class='invoice-total__amount'>${invoiceData['advance']}</div>
                            </div>`;
                        }

                        //! Total
                        htmlContent += `<div class='invoice-total'>
                            <div class='invoice-total__total border-transparent'>TOTAL</div>
                            <div class='invoice-total__amount'>${invoiceData['bill_currency']}${invoiceData['total']}</div>
                        </div>`;

                        //! Additional Notes / Project Description
                        if(invoiceData['project_details']) {
                            invoiceData['project_details'] = invoiceData['project_details'].replace(/(?:\r\n|\r|\n)/g, '<br>');

                            htmlContent += `<div class='terms-conditions additional-notes'>
                            <b>Additional Notes / Project Description</b>
                            <br>
                            <br>
                            ${invoiceData['project_details']}
                            </div>`;
                        }

                        //! Terms & Conditions
                        if(invoiceData['terms']) {
                            invoiceData['terms'] = invoiceData['terms'].replace(/(?:\r\n|\r|\n)/g, '<br>');

                            htmlContent += `<div class='terms-conditions'>
                            <b>Terms & Conditions</b>
                            <br>
                            <br>
                            ${invoiceData['terms']}
                            </div>`;
                        }

                        //! Signature
                        var signature = document.getElementById("saveSignature").src;

                        if(signature) {
                            htmlContent += `<div class='signature-wrapper'>
                            <img src='${signature}' alt='signature' class='signature'>
                            </div>`;
                        }

                        htmlContent += '</div>';

                        //! Define options for the PDF generation
                        var options = {
                            filename: `${invoiceData['bill_type']}-${invoiceData['invoice_number']}.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                        };


                        //! Settings

                        //! BG color
                        if(invoiceData['color_bg']) {
                            htmlContent += `
                                <style>
                                div {
                                    background: ${invoiceData['color_bg']};
                                }
                                </style>
                            `;
                        }

                        //! Text Color
                        if(invoiceData['color_text']) {
                            htmlContent += `
                                <style>
                                * {
                                    color: ${invoiceData['color_text']};
                                }
                                </style>
                            `;
                        }

                        // console.log(htmlContent);

                        //! Convert HTML to PDF
                        html2pdf().from(htmlContent).set(options).save();

                        setTimeout(function () {
                            jQuery('.wait_loader').fadeOut();
                            $(".donation").show();
                            $(".donation-wrapper").show();
                            // jQuery('form#download_invoice').submit();
                        }, 2000);
                    } else {
                        alert('Error invoice type');

                        //! Error
                        return false;
                    }


                    //! Error
                    return false;

                    //! test start
                    // Create a new jsPDF instance
                    // const docGen = new jsPDF();

                    // // Add some content to the PDF
                    // docGen.text('Hello world!', 10, 10);

                    // // Save the PDF as a file
                    // docGen.save('example.pdf');


                    // create a document and pipe to a blob
                    // https://codepen.io/muneebul/pen/yLyYBvE
                    //https://artskydj.github.io/jsPDF/docs/jsPDF.html
                    var doc = new jsPDF();

                    doc.text('INVOICE', 180, 10);
                    doc.text('INVOICE2', 180, 30);
                    // doc
                    // .text('And here is some wrapped text...', 100, 300)
                    // .font('Times-Roman', 13)
                    // .moveDown()
                    // .text(lorem, {
                    //     width: 412,
                    //     align: 'justify',
                    //     indent: 30,
                    //     columns: 2,
                    //     height: 300,
                    //     ellipsis: true
                    // });

                    doc.save('example.pdf');

                    //! test end


                    // var resData = JSON.parse(response);
                    // if (resData.status == 200) {

                    //     jQuery('#invoice_base').val(resData.output.invoice_base);
                    //     jQuery('#invoice_hash').val(resData.output.invoice_hash);
                    //     var invoiceData = [];
                    //     var customerData = [];
                    //     var invdata = [];
                    //     if (typeof (Storage) !== "undefined") {
                    //         // Store

                    //         if (localStorage.getItem('invoicedata')) {
                    //             invoiceData = JSON.parse(localStorage.getItem('invoicedata'));
                    //         }

                    //         if (localStorage.getItem('customerdata')) {
                    //             customerData = JSON.parse(localStorage.getItem('customerdata'));
                    //         }

                    //         invdata['base'] = resData.output.invoice_base;
                    //         invdata['hash'] = resData.output.invoice_hash;
                    //         invoiceData[resData.invoice_id] = JSON.stringify({ ...invdata });
                    //         customerData[resData.client_details] = JSON.stringify({ ...invdata });

                    //         localStorage.setItem('invoicedata', JSON.stringify({ ...invoiceData }));
                    //         localStorage.setItem('customerdata', JSON.stringify({ ...customerData }));
                    //     } else {
                    //         alert("You Can Download PDF, But Your Data May Not Saved, Because You Have Old Browser!");
                    //     }

                    //     setTimeout(function () {
                    //         jQuery('.wait_loader').fadeOut();
                    //         jQuery('form#download_invoice').submit();
                    //     }, 2000);
                    // } else {
                    //     alert('Please Check Your Internet Connection!');
                    // }
                }
            });
        }
    });
});

//! my start
// Function to decode the serialized data
function decodeSerializedData(data) {
    var decodedData = {};
    data.split('&').forEach(function (pair) {
        var keyValue = pair.split('=');
        var key = decodeURIComponent(keyValue[0]);
        var value = decodeURIComponent(keyValue[1]);
        decodedData[key] = value;
    });
    return decodedData;
}

function formatPrice(totalValue = 0) {
    // Convert totalValue to number
    var totalNumber = parseFloat(totalValue);

    // Format total using toLocaleString with options
    var formattedTotal = totalNumber.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    return formattedTotal;
}
//! my end

function ItemRowChange() {
    jQuery('.append_item_row #item_row').each(function () {
        //change price
        var item = jQuery(this);
        var price = 0.00;
        var qty = 0;
        var total_price = 0.00;
        jQuery(item).find('.price').on('change', function () {
            price = parseFloat(jQuery(this).val());
            qty = parseInt(jQuery(item).find('.qty').val());
            total_price = price * qty;
            jQuery(item).find('.amount').val(total_price.toFixed(2));
            CalculateSum();
        });

        jQuery(item).find('.qty').on('change', function () {
            qty = jQuery(this).val();
            price = jQuery(item).find('.price').val();
            total_price = price * qty;
            jQuery(item).find('.amount').val(total_price.toFixed(2));
            CalculateSum();
        });

        jQuery('.tax,.advance_amount,.discount').on('change', function () {
            CalculateSum();
        });
    });
}


function getSubtotal() {
    var ntotal = 0.00;
    jQuery('.append_item_row #item_row').each(function () {
        var val = 0.00;
        val = jQuery(this).find('.amount').val();

        if(val) {
            ntotal += parseFloat(val);
        }
    });

    return ntotal;
}

function calculateTax(total, tax) {
    return (tax / 100) * total;
}

function CalculateSum() {
    if (jQuery('.discount').val() == "") discount = 0.00; else discount = parseFloat(jQuery('.discount').val());
    if (jQuery('.tax').val() == "") tax = 0.00; else tax = parseFloat(jQuery('.tax').val());
    if (jQuery('.advance_amount').val() == "") advance_amount = 0.00; else advance_amount = parseFloat(jQuery('.advance_amount').val());

    subtotal = getSubtotal();
    total = subtotal - calculateTax(subtotal, discount);

    total = total + calculateTax(total, tax) - advance_amount;
    // jQuery('.sub_total').text(subtotal.toFixed(2));
    // jQuery('.sub_total_hidden').val(subtotal.toFixed(2));

    // jQuery('.total').text(total.toFixed(2));
    // jQuery('.total_hidden').val(total.toFixed(2));

    jQuery('.sub_total').text(formatPrice(subtotal));
    jQuery('.sub_total_hidden').val(formatPrice(subtotal));

    jQuery('.total').text(formatPrice(total));
    jQuery('.total_hidden').val(formatPrice(total));
}

function resizeImage() {

}

function addLogo(url) {
    jQuery('.logoInvoice').attr('src', url);
    jQuery('#bash_logo').val(url);
    jQuery('.file #hide_top_notification').show();
    jQuery('.file #show_top_notification').hide();
}
function removeLogo() {
    jQuery('.file-input').val('');
    jQuery('#bash_logo').val('');
    jQuery('.file #show_top_notification').show();
    jQuery('.file #hide_top_notification').hide();
    jQuery('.logoInvoice').attr('src', '');
}
function removeItem(item) {
    jQuery(item).parent().parent().remove();
    CalculateSum();
}
function addNewRow() {
    jQuery('.append_item_row').append('<ul class="columns inv_mgb_0" id="item_row">\
    <li class="column is-6">\
        <input class="input name" type="text" name="item[\'data\'][0]" placeholder="Enter Product / Service Name"/>\
    </li>\
    <li class="column is-2">\
        <input class="input price" type="number" name="item[\'data\'][1]" placeholder="0.00"/>\
    </li>\
    <li class="column is-1">\
        <input class="input qty" type="number" name="item[\'data\'][2]" placeholder="1" min="1" value="1"/>\
    </li>\
    <li class="column is-2">\
        <input class="input amount" type="number" name="item[\'data\'][3]" placeholder="0.00" readonly/>\
    </li>\
    <li class="column is-1">\
        <button class="button is-default" type="button" onClick="removeItem(this);"><i class="fa fa-danger"><svg height="427pt" viewBox="-40 0 427 427.00131" width="427pt" xmlns="http://www.w3.org/2000/svg"><path d="m232.398438 154.703125c-5.523438 0-10 4.476563-10 10v189c0 5.519531 4.476562 10 10 10 5.523437 0 10-4.480469 10-10v-189c0-5.523437-4.476563-10-10-10zm0 0"/><path d="m114.398438 154.703125c-5.523438 0-10 4.476563-10 10v189c0 5.519531 4.476562 10 10 10 5.523437 0 10-4.480469 10-10v-189c0-5.523437-4.476563-10-10-10zm0 0"/><path d="m28.398438 127.121094v246.378906c0 14.5625 5.339843 28.238281 14.667968 38.050781 9.285156 9.839844 22.207032 15.425781 35.730469 15.449219h189.203125c13.527344-.023438 26.449219-5.609375 35.730469-15.449219 9.328125-9.8125 14.667969-23.488281 14.667969-38.050781v-246.378906c18.542968-4.921875 30.558593-22.835938 28.078124-41.863282-2.484374-19.023437-18.691406-33.253906-37.878906-33.257812h-51.199218v-12.5c.058593-10.511719-4.097657-20.605469-11.539063-28.03125-7.441406-7.421875-17.550781-11.5546875-28.0625-11.46875h-88.796875c-10.511719-.0859375-20.621094 4.046875-28.0625 11.46875-7.441406 7.425781-11.597656 17.519531-11.539062 28.03125v12.5h-51.199219c-19.1875.003906-35.394531 14.234375-37.878907 33.257812-2.480468 19.027344 9.535157 36.941407 28.078126 41.863282zm239.601562 279.878906h-189.203125c-17.097656 0-30.398437-14.6875-30.398437-33.5v-245.5h250v245.5c0 18.8125-13.300782 33.5-30.398438 33.5zm-158.601562-367.5c-.066407-5.207031 1.980468-10.21875 5.675781-13.894531 3.691406-3.675781 8.714843-5.695313 13.925781-5.605469h88.796875c5.210937-.089844 10.234375 1.929688 13.925781 5.605469 3.695313 3.671875 5.742188 8.6875 5.675782 13.894531v12.5h-128zm-71.199219 32.5h270.398437c9.941406 0 18 8.058594 18 18s-8.058594 18-18 18h-270.398437c-9.941407 0-18-8.058594-18-18s8.058593-18 18-18zm0 0"/><path d="m173.398438 154.703125c-5.523438 0-10 4.476563-10 10v189c0 5.519531 4.476562 10 10 10 5.523437 0 10-4.480469 10-10v-189c0-5.523437-4.476563-10-10-10zm0 0"/></svg></i></button>\
    </li>\
    </ul>');
    ItemRowChange();
}

function updateSymbol(e) {
    var selected = jQuery(".currency-selector option:selected");
    jQuery(".currency-symbol").text(selected.data("symbol"));
    jQuery('.currency-addon-fixed').text(selected.data("symbol"));
    jQuery('.sign-st,.sign-st2,.sign-st3').text(selected.data("symbol"));
}

function resizedataURL(datas, type, wantedWidth, wantedHeight) {
    // We create an image to receive the Data URI
    var img = document.createElement('img');

    // When the event "onload" is triggered we can resize the image.
    img.onload = function () {
        // We create a canvas and get its context.
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var oldWidth = img.width;
        var oldHeight = img.height;
        var newHeight = Math.floor(oldHeight / oldWidth * wantedWidth)
        // We set the dimensions at the wanted size.
        canvas.width = wantedWidth;
        canvas.height = newHeight;

        // We resize the image with the canvas method drawImage();
        ctx.drawImage(this, 0, 0, wantedWidth, newHeight);

        var dataURI = canvas.toDataURL(type, 0.6);

        /////////////////////////////////////////
        // Use and treat your Data URI here !! //
        /////////////////////////////////////////
        addLogo(dataURI);
    };

    // We put the Data URI in the image's src attribute
    img.src = datas;
}

function LoadClientsData() {
    if (localStorage.getItem('customerdata')) {
        var customerData = JSON.parse(localStorage.getItem('customerdata'));
        var ihtml = "";
        for (var key in customerData) {
            if (customerData.hasOwnProperty(key)) {
                var clientdata = customerData[key];
                clientdata = JSON.parse(clientdata);
                ihtml += '<div class="column is-3">\
                <div class="panel inv_mgt_10">\
                    <div class="panel-block">\
                    <div class="is-up_level_48 has-text-center">\
                        <figure class="image is-48x48 is-center is-avatar">\
                            <div class="is-rounded has-background-warning is-avatar">'+ key.charAt(0).toUpperCase() + '</div>\
                        </figure>\
                        <h3 class="inv_pad_5_10">'+ key + '</h3>\
                    </div>\
                    </div>\
                    <div class="panel-block  has-text-centered">\
                    <div class="buttons is-centered is-width-full"><form class="" name="NewInvoiceFrm" action="'+ site_url + '" method="post"><input type="hidden" name="baseload" value="' + clientdata.base + '"/><button type="submit" class="button is-link is-small is-rounded is-centered">+ New Invoice</button></form><a class="button is-danger is-small is-rounded is-centered" href="javascript:void(0)" onclick="removeClient(\'' + key + '\');">x Remove</a></div>\
                    </div>\
                </div>\
            </div>';
            }
        }
        jQuery('.LoadClientsData').html(ihtml);
    }
}


function LoadInvoicesData() {
    if (localStorage.getItem('invoicedata')) {
        var customerData = JSON.parse(localStorage.getItem('invoicedata'));
        var ihtml = "";
        for (var key in customerData) {
            if (customerData.hasOwnProperty(key)) {
                var clientdata = customerData[key];
                clientdata = JSON.parse(clientdata);
                ihtml += '<div class="column is-3">\
                <div class="panel inv_mgt_10">\
                    <div class="panel-block">\
                    <div class="is-up_level_48 has-text-center">\
                        <figure class="image is-48x48 is-center is-avatar">\
                            <div class="is-rounded has-background-warning is-avatar">'+ key.charAt(0).toUpperCase() + '</div>\
                        </figure>\
                        <h3 class="inv_pad_5_10">'+ key + '</h3>\
                    </div>\
                    </div>\
                    <div class="panel-block  has-text-centered">\
                    <div class="buttons is-centered is-width-full"><form class="" name="NewInvoiceFrm" action="'+ site_url + '" method="post"><input type="hidden" name="baseload" value="' + clientdata.base + '"/><button type="submit" class="button is-link is-small is-rounded is-centered">+ New Invoice</button></form><a class="button is-danger is-small is-rounded is-centered" href="javascript:void(0)" onclick="removeInvoice(\'' + key + '\');">x Remove</a></div>\
                </div>\
                </div>\
            </div>';
            }
        }
        jQuery('.LoadInvoicesData').html(ihtml);
    }
}

function removeClient() {
    alert("We Are Working on This Feature!")
}

function removeInvoice() {
    alert("We Are Working on This Feature!")
}