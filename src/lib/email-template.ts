// Simple HTML template generator for invoices
export function generateSimpleInvoiceTemplate(invoiceData: any, storeData: any) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        ${storeData?.logo ? `<img src="${storeData.logo}" alt="${storeData.name}" style="max-height: 60px; margin-bottom: 15px;">` : ''}
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">${storeData?.name || 'FastDrop'}</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Invoice #${invoiceData.id}</p>
      </div>
      
      <!-- Invoice Details -->
      <div style="padding: 30px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px;">
          <div>
            <h3 style="color: #374151; margin: 0 0 10px 0;">Bill To:</h3>
            <p style="margin: 0; color: #6b7280;">${invoiceData.customer.name}</p>
            <p style="margin: 0; color: #6b7280;">${invoiceData.customer.email}</p>
            <p style="margin: 0; color: #6b7280;">${invoiceData.customer.address}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; color: #6b7280;"><strong>Invoice Date:</strong> ${invoiceData.date}</p>
            <p style="margin: 0; color: #6b7280;"><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
            <p style="margin: 0; color: #6b7280;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">${invoiceData.status}</span></p>
          </div>
        </div>
        
        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="padding: 15px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151;">Item</th>
              <th style="padding: 15px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151;">Qty</th>
              <th style="padding: 15px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Price</th>
              <th style="padding: 15px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #374151;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item: any) => `
              <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                  <div>
                    <p style="margin: 0; font-weight: bold; color: #374151;">${item.name}</p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">${item.description}</p>
                  </div>
                </td>
                <td style="padding: 15px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.quantity}</td>
                <td style="padding: 15px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151;">$${item.price.toFixed(2)}</td>
                <td style="padding: 15px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #374151; font-weight: bold;">$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Totals -->
        <div style="text-align: right; margin-bottom: 30px;">
          <div style="display: inline-block; min-width: 200px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Subtotal:</span>
              <span style="color: #374151;">$${invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Tax:</span>
              <span style="color: #374151;">$${invoiceData.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #e5e7eb; font-size: 18px; font-weight: bold;">
              <span style="color: #374151;">Total:</span>
              <span style="color: #667eea;">$${invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; text-align: center;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Thank you for your business! If you have any questions about this invoice, please contact us.
          </p>
          ${storeData?.email ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Email: ${storeData.email}</p>` : ''}
          ${storeData?.phone ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Phone: ${storeData.phone}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}
