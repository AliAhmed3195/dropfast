import nodemailer from 'nodemailer';
import { 
  generateSimpleInvoiceTemplate,
  generateModernInvoiceTemplate,
  generateMinimalInvoiceTemplate,
  generateProfessionalInvoiceTemplate
} from './email-template';

// Initialize SMTP transporter for Gmail
let smtpTransporter: any = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(emailData: EmailData) {
  // Check if email is enabled
  if (process.env.EMAIL_ENABLED !== 'true') {
    console.log('Email is disabled. Skipping email send.');
    return { success: true, messageId: 'disabled' };
  }

  // Check if SMTP is configured
  if (!smtpTransporter) {
    console.error('SMTP not configured. Please check your .env file.');
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const fromEmail = process.env.EMAIL_FROM || 'aliahmed3195@gmail.com';
    const fromName = process.env.EMAIL_FROM_NAME || 'FastDrop';
    const from = `${fromName} <${fromEmail}>`;

    const mailOptions = {
      from: from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    };

    const result = await smtpTransporter.sendMail(mailOptions);
    console.log('Email sent successfully via SMTP:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email via SMTP:', error);
    return { success: false, error: error };
  }
}

// Email templates
export function generateCustomerInvoiceEmail(customerName: string, orderData: any, invoiceData: any, storeData: any) {
  const storeName = storeData?.name || 'FastDrop';
  const storeEmail = storeData?.email || 'support@fastdrop.com';
  const storePhone = storeData?.phone || '';
  const invoiceTemplate = storeData?.invoiceTemplate || 'default';
  
  // Prepare invoice data for template rendering
  const templateInvoiceData = {
    id: invoiceData.invoiceNumber,
    orderId: orderData.id,
    date: new Date(orderData.createdAt).toLocaleDateString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    customer: {
      name: customerName,
      email: orderData.customer.email,
      address: orderData.customer.address || 'N/A'
    },
    store: {
      name: storeName,
      email: storeEmail,
      phone: storePhone,
      address: storeData?.address || 'N/A',
      logo: storeData?.logo || '/logo-placeholder.png',
      taxNumber: storeData?.taxNumber || 'N/A'
    },
    items: [
      {
        name: orderData.product.name,
        description: orderData.product.description || 'Product description',
        quantity: orderData.quantity,
        price: orderData.productPrice,
        total: orderData.totalAmount
      }
    ],
    subtotal: invoiceData.subtotal,
    tax: invoiceData.tax,
    total: invoiceData.total,
    status: 'PAID'
  };

  // Generate HTML template based on store template
  let templateHtml;
  const templateType = storeData?.invoiceTemplate || storeData?.template || 'default';
  console.log('Selected template type:', templateType);
  console.log('Store data:', { invoiceTemplate: storeData?.invoiceTemplate, template: storeData?.template });
  
  if (templateType === 'modern') {
    templateHtml = generateModernInvoiceTemplate(templateInvoiceData, storeData);
  } else if (templateType === 'minimal') {
    templateHtml = generateMinimalInvoiceTemplate(templateInvoiceData, storeData);
  } else if (templateType === 'professional') {
    templateHtml = generateProfessionalInvoiceTemplate(templateInvoiceData, storeData);
  } else {
    templateHtml = generateSimpleInvoiceTemplate(templateInvoiceData, storeData);
  }
  
  return {
    subject: `Invoice #${invoiceData.invoiceNumber} - Your Order Confirmation from ${storeName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Order Confirmation</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Thank you for choosing ${storeName}</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${customerName},</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 30px;">Thank you for your order! Here is your invoice:</p>
          
          <!-- Invoice Template -->
          <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 25px 0;">
            ${templateHtml}
          </div>
          
          <!-- Contact Info -->
          <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px;">Need help? Contact us:</p>
            <p style="margin: 0; color: #2d3748; font-weight: bold;">${storeEmail}</p>
            ${storePhone ? `<p style="margin: 5px 0 0 0; color: #2d3748;">${storePhone}</p>` : ''}
          </div>
          
          <p style="font-size: 16px; color: #333; margin-top: 30px;">Best regards,<br><strong>${storeName} Team</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #2d3748; padding: 20px; text-align: center; color: #a0aec0;">
          <p style="margin: 0; font-size: 14px;">© 2024 ${storeName}. All rights reserved.</p>
        </div>
      </div>
    `,
    text: `
      Order Confirmation from ${storeName}
      
      Dear ${customerName},
      
      Thank you for your order! Here are your order details:
      
      Order ID: ${orderData.id}
      Product: ${orderData.product.name}
      Quantity: ${orderData.quantity}
      Total Amount: $${orderData.totalAmount}
      Order Date: ${new Date(orderData.createdAt).toLocaleDateString()}
      
      Invoice Number: ${invoiceData.invoiceNumber}
      Subtotal: $${invoiceData.subtotal}
      Tax: $${invoiceData.tax}
      Total: $${invoiceData.total}
      
      Need help? Contact us: ${storeEmail}${storePhone ? ` | ${storePhone}` : ''}
      
      Best regards,
      ${storeName} Team
    `
  };
}

export function generateSupplierOrderNotification(supplierName: string, orderData: any) {
  return {
    subject: `New Order - ${orderData.product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">New Order Received</h2>
        <p>Dear ${supplierName},</p>
        <p>You have received a new order for your product!</p>
        
        <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Order Details</h3>
          <p><strong>Order ID:</strong> ${orderData.id}</p>
          <p><strong>Product:</strong> ${orderData.product.name}</p>
          <p><strong>Quantity:</strong> ${orderData.quantity}</p>
          <p><strong>Your Revenue:</strong> $${orderData.productPrice}</p>
          <p><strong>Order Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Customer Information</h3>
          <p><strong>Customer:</strong> ${orderData.customer.name}</p>
          <p><strong>Email:</strong> ${orderData.customer.email}</p>
        </div>
        
        <p>Please process this order and update the status accordingly.</p>
        <p>Best regards,<br>FastDrop Team</p>
      </div>
    `,
    text: `
      New Order Received
      
      Dear ${supplierName},
      
      You have received a new order for your product!
      
      Order ID: ${orderData.id}
      Product: ${orderData.product.name}
      Quantity: ${orderData.quantity}
      Your Revenue: $${orderData.productPrice}
      Order Date: ${new Date(orderData.createdAt).toLocaleDateString()}
      
      Customer Information:
      Customer: ${orderData.customer.name}
      Email: ${orderData.customer.email}
      
      Please process this order and update the status accordingly.
      
      Best regards,
      FastDrop Team
    `
  };
}

export function generateVendorOrderNotification(vendorName: string, orderData: any) {
  return {
    subject: `New Sale - ${orderData.product.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7C3AED;">New Sale Confirmed</h2>
        <p>Dear ${vendorName},</p>
        <p>Congratulations! You have made a new sale!</p>
        
        <div style="background-color: #F3E8FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Sale Details</h3>
          <p><strong>Order ID:</strong> ${orderData.id}</p>
          <p><strong>Product:</strong> ${orderData.product.name}</p>
          <p><strong>Quantity:</strong> ${orderData.quantity}</p>
          <p><strong>Your Profit:</strong> $${orderData.markupAmount}</p>
          <p><strong>Total Sale:</strong> $${orderData.totalAmount}</p>
          <p><strong>Sale Date:</strong> ${new Date(orderData.createdAt).toLocaleDateString()}</p>
        </div>
        
        <div style="background-color: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Supplier Information</h3>
          <p><strong>Supplier:</strong> ${orderData.product.supplier.name}</p>
          <p><strong>Supplier Revenue:</strong> $${orderData.productPrice}</p>
        </div>
        
        <div style="background-color: #F0FDF4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Customer Information</h3>
          <p><strong>Customer:</strong> ${orderData.customer.name}</p>
          <p><strong>Email:</strong> ${orderData.customer.email}</p>
        </div>
        
        <p>Great job on the sale! Keep up the excellent work.</p>
        <p>Best regards,<br>FastDrop Team</p>
      </div>
    `,
    text: `
      New Sale Confirmed
      
      Dear ${vendorName},
      
      Congratulations! You have made a new sale!
      
      Order ID: ${orderData.id}
      Product: ${orderData.product.name}
      Quantity: ${orderData.quantity}
      Your Profit: $${orderData.markupAmount}
      Total Sale: $${orderData.totalAmount}
      Sale Date: ${new Date(orderData.createdAt).toLocaleDateString()}
      
      Supplier Information:
      Supplier: ${orderData.product.supplier.name}
      Supplier Revenue: $${orderData.productPrice}
      
      Customer Information:
      Customer: ${orderData.customer.name}
      Email: ${orderData.customer.email}
      
      Great job on the sale! Keep up the excellent work.
      
      Best regards,
      FastDrop Team
    `
  };
}
