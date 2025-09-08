'use client';

import DefaultTemplate from './templates/DefaultTemplate';
import ModernTemplate from './templates/ModernTemplate';
import MinimalTemplate from './templates/MinimalTemplate';
import ProfessionalTemplate from './templates/ProfessionalTemplate';

interface InvoiceRendererProps {
  templateName: string;
  invoiceData: any;
}

export default function InvoiceRenderer({ templateName, invoiceData }: InvoiceRendererProps) {
  const renderTemplate = () => {
    // Extract data from the unified invoiceData structure
    const invoice = {
      invoiceNumber: invoiceData.id,
      subtotal: invoiceData.subtotal,
      tax: invoiceData.tax,
      total: invoiceData.total,
      createdAt: invoiceData.date
    };
    
    const order = {
      id: invoiceData.orderId,
      quantity: invoiceData.items[0]?.quantity || 1,
      productPrice: invoiceData.items[0]?.price || 0,
      totalAmount: invoiceData.total,
      product: {
        name: invoiceData.items[0]?.name || 'Product',
        image: invoiceData.items[0]?.image || null,
        supplier: {
          name: 'Supplier'
        }
      }
    };
    
    const store = invoiceData.store;
    const customer = invoiceData.customer;
    
    const props = { invoice, order, store, customer };

    switch (templateName) {
      case 'default':
        return <DefaultTemplate {...props} />;
      case 'modern':
        return <ModernTemplate {...props} />;
      case 'minimal':
        return <MinimalTemplate {...props} />;
      case 'professional':
        return <ProfessionalTemplate {...props} />;
      default:
        return <DefaultTemplate {...props} />;
    }
  };

  return (
    <div className="invoice-container">
      {renderTemplate()}
    </div>
  );
}
