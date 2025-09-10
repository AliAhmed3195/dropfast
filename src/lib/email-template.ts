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

// Modern Invoice Template
export function generateModernInvoiceTemplate(invoiceData: any, storeData: any) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\"><defs><pattern id=\"grain\" width=\"100\" height=\"100\" patternUnits=\"userSpaceOnUse\"><circle cx=\"25\" cy=\"25\" r=\"1\" fill=\"white\" opacity=\"0.1\"/><circle cx=\"75\" cy=\"75\" r=\"1\" fill=\"white\" opacity=\"0.1\"/></pattern></defs><rect width=\"100\" height=\"100\" fill=\"url(%23grain)\"/></svg>') repeat;"></div>
        <div style="position: relative; z-index: 1;">
          ${storeData?.logo ? `<img src="${storeData.logo}" alt="${storeData.name}" style="max-height: 80px; margin-bottom: 20px; filter: brightness(0) invert(1);">` : ''}
          <h1 style="margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -1px;">${storeData?.name || 'FastDrop'}</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Invoice #${invoiceData.id}</p>
        </div>
      </div>
      
      <!-- Content -->
      <div style="background: white; padding: 40px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; flex-wrap: wrap; gap: 20px;">
          <div style="flex: 1; min-width: 250px;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Bill To:</h3>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <p style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600; font-size: 16px;">${invoiceData.customer.name}</p>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${invoiceData.customer.email}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">${invoiceData.customer.address}</p>
            </div>
          </div>
          <div style="flex: 1; min-width: 250px; text-align: right;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Invoice Date:</strong> ${invoiceData.date}</p>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
              <p style="margin: 0; color: #10b981; font-weight: 600; font-size: 16px;"><strong>Status:</strong> ${invoiceData.status}</p>
            </div>
          </div>
        </div>
        
        <!-- Items Table -->
        <div style="background: #f8fafc; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <th style="padding: 20px; text-align: left; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Item</th>
                <th style="padding: 20px; text-align: center; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Qty</th>
                <th style="padding: 20px; text-align: right; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Price</th>
                <th style="padding: 20px; text-align: right; font-weight: 600; font-size: 14px; letter-spacing: 0.5px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoiceData.items.map((item: any, index: number) => `
                <tr style="background: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                  <td style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
                    <div>
                      <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 16px;">${item.name}</p>
                      <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${item.description}</p>
                    </div>
                  </td>
                  <td style="padding: 20px; text-align: center; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">${item.quantity}</td>
                  <td style="padding: 20px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600;">$${item.price.toFixed(2)}</td>
                  <td style="padding: 20px; text-align: right; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 700; font-size: 16px;">$${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Totals -->
        <div style="text-align: right; margin-bottom: 40px;">
          <div style="display: inline-block; min-width: 300px; background: #f8fafc; padding: 30px; border-radius: 12px; border: 2px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 16px; font-weight: 500;">Subtotal:</span>
              <span style="color: #1f2937; font-size: 16px; font-weight: 600;">$${invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
              <span style="color: #6b7280; font-size: 16px; font-weight: 500;">Tax:</span>
              <span style="color: #1f2937; font-size: 16px; font-weight: 600;">$${invoiceData.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 20px; border-top: 3px solid #667eea; font-size: 20px; font-weight: 700;">
              <span style="color: #1f2937;">Total:</span>
              <span style="color: #667eea;">$${invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6;">
            Thank you for your business! If you have any questions about this invoice, please contact us.
          </p>
          <div style="margin-top: 20px; display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
            ${storeData?.email ? `<p style="margin: 0; color: #667eea; font-size: 14px; font-weight: 600;">📧 ${storeData.email}</p>` : ''}
            ${storeData?.phone ? `<p style="margin: 0; color: #667eea; font-size: 14px; font-weight: 600;">📞 ${storeData.phone}</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Minimal Invoice Template
export function generateMinimalInvoiceTemplate(invoiceData: any, storeData: any) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb;">
      <!-- Header -->
      <div style="padding: 40px 30px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${storeData?.logo ? `<img src="${storeData.logo}" alt="${storeData.name}" style="max-height: 50px; margin-bottom: 20px;">` : ''}
        <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #1f2937; letter-spacing: 1px;">${storeData?.name || 'FastDrop'}</h1>
        <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 14px; letter-spacing: 2px;">INVOICE #${invoiceData.id}</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; flex-wrap: wrap; gap: 30px;">
          <div>
            <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Bill To</h3>
            <p style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px; font-weight: 500;">${invoiceData.customer.name}</p>
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">${invoiceData.customer.email}</p>
            <p style="margin: 0; color: #6b7280; font-size: 14px;">${invoiceData.customer.address}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;"><strong>Date:</strong> ${invoiceData.date}</p>
            <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;"><strong>Due:</strong> ${invoiceData.dueDate}</p>
            <p style="margin: 0; color: #10b981; font-size: 14px; font-weight: 500;">${invoiceData.status}</p>
          </div>
        </div>
        
        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr>
              <th style="padding: 15px 0; text-align: left; border-bottom: 2px solid #1f2937; color: #1f2937; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Item</th>
              <th style="padding: 15px 0; text-align: center; border-bottom: 2px solid #1f2937; color: #1f2937; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
              <th style="padding: 15px 0; text-align: right; border-bottom: 2px solid #1f2937; color: #1f2937; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Price</th>
              <th style="padding: 15px 0; text-align: right; border-bottom: 2px solid #1f2937; color: #1f2937; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item: any) => `
              <tr>
                <td style="padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
                  <p style="margin: 0; font-weight: 500; color: #1f2937; font-size: 16px;">${item.name}</p>
                  <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${item.description}</p>
                </td>
                <td style="padding: 20px 0; text-align: center; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 16px;">${item.quantity}</td>
                <td style="padding: 20px 0; text-align: right; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 16px;">$${item.price.toFixed(2)}</td>
                <td style="padding: 20px 0; text-align: right; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 16px; font-weight: 500;">$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Totals -->
        <div style="text-align: right; margin-bottom: 40px;">
          <div style="display: inline-block; min-width: 250px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 10px 0;">
              <span style="color: #6b7280; font-size: 16px;">Subtotal</span>
              <span style="color: #1f2937; font-size: 16px; font-weight: 500;">$${invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 10px 0; border-top: 1px solid #e5e7eb;">
              <span style="color: #6b7280; font-size: 16px;">Tax</span>
              <span style="color: #1f2937; font-size: 16px; font-weight: 500;">$${invoiceData.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 20px 0; border-top: 2px solid #1f2937; font-size: 18px; font-weight: 600;">
              <span style="color: #1f2937;">Total</span>
              <span style="color: #1f2937;">$${invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; padding-top: 30px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
            Thank you for your business.
          </p>
          ${storeData?.email ? `<p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">${storeData.email}</p>` : ''}
        </div>
      </div>
    </div>
  `;
}

// Professional Invoice Template
export function generateProfessionalInvoiceTemplate(invoiceData: any, storeData: any) {
  return `
    <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; background-color: #ffffff; border: 2px solid #1f2937;">
      <!-- Header -->
      <div style="background: #1f2937; color: white; padding: 30px; text-align: center;">
        ${storeData?.logo ? `<img src="${storeData.logo}" alt="${storeData.name}" style="max-height: 60px; margin-bottom: 15px; filter: brightness(0) invert(1);">` : ''}
        <h1 style="margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 1px;">${storeData?.name || 'FastDrop'}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; letter-spacing: 2px;">INVOICE</p>
        <p style="margin: 5px 0 0 0; opacity: 0.7; font-size: 14px;">Invoice #${invoiceData.id}</p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; flex-wrap: wrap; gap: 30px;">
          <div style="flex: 1; min-width: 300px;">
            <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Bill To:</h3>
            <div style="border: 1px solid #d1d5db; padding: 20px; background: #f9fafb;">
              <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: bold;">${invoiceData.customer.name}</p>
              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px;">${invoiceData.customer.email}</p>
              <p style="margin: 0; color: #4b5563; font-size: 16px;">${invoiceData.customer.address}</p>
            </div>
          </div>
          <div style="flex: 1; min-width: 300px; text-align: right;">
            <div style="border: 1px solid #d1d5db; padding: 20px; background: #f9fafb;">
              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px;"><strong>Invoice Date:</strong> ${invoiceData.date}</p>
              <p style="margin: 0 0 10px 0; color: #4b5563; font-size: 16px;"><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
              <p style="margin: 0; color: #059669; font-size: 16px; font-weight: bold;">Status: ${invoiceData.status}</p>
            </div>
          </div>
        </div>
        
        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #d1d5db;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 15px; text-align: left; border: 1px solid #d1d5db; color: #1f2937; font-size: 14px; font-weight: bold;">Description</th>
              <th style="padding: 15px; text-align: center; border: 1px solid #d1d5db; color: #1f2937; font-size: 14px; font-weight: bold;">Quantity</th>
              <th style="padding: 15px; text-align: right; border: 1px solid #d1d5db; color: #1f2937; font-size: 14px; font-weight: bold;">Unit Price</th>
              <th style="padding: 15px; text-align: right; border: 1px solid #d1d5db; color: #1f2937; font-size: 14px; font-weight: bold;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoiceData.items.map((item: any, index: number) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f9fafb'};">
                <td style="padding: 15px; border: 1px solid #d1d5db;">
                  <p style="margin: 0; font-weight: bold; color: #1f2937; font-size: 16px;">${item.name}</p>
                  <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${item.description}</p>
                </td>
                <td style="padding: 15px; text-align: center; border: 1px solid #d1d5db; color: #1f2937; font-size: 16px;">${item.quantity}</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #d1d5db; color: #1f2937; font-size: 16px;">$${item.price.toFixed(2)}</td>
                <td style="padding: 15px; text-align: right; border: 1px solid #d1d5db; color: #1f2937; font-size: 16px; font-weight: bold;">$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <!-- Totals -->
        <div style="text-align: right; margin-bottom: 40px;">
          <div style="display: inline-block; min-width: 300px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 10px 20px; background: #f9fafb; border: 1px solid #d1d5db;">
              <span style="color: #4b5563; font-size: 16px; font-weight: bold;">Subtotal:</span>
              <span style="color: #1f2937; font-size: 16px; font-weight: bold;">$${invoiceData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding: 10px 20px; background: #f9fafb; border: 1px solid #d1d5db;">
              <span style="color: #4b5563; font-size: 16px; font-weight: bold;">Tax:</span>
              <span style="color: #1f2937; font-size: 16px; font-weight: bold;">$${invoiceData.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 15px 20px; background: #1f2937; color: white; font-size: 18px; font-weight: bold;">
              <span>TOTAL:</span>
              <span>$${invoiceData.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 30px; border: 1px solid #d1d5db; text-align: center;">
          <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for your business. Please remit payment by the due date.
          </p>
          <div style="margin-top: 20px; display: flex; justify-content: center; gap: 40px; flex-wrap: wrap;">
            ${storeData?.email ? `<p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: bold;">Email: ${storeData.email}</p>` : ''}
            ${storeData?.phone ? `<p style="margin: 0; color: #1f2937; font-size: 14px; font-weight: bold;">Phone: ${storeData.phone}</p>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}