'use client';

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  createdAt: string;
  template: string;
  order: {
    id: string;
    quantity: number;
    product: {
      name: string;
      description: string;
      price: number;
    };
  };
  store: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    taxNumber?: string;
  };
  customer: {
    name: string;
    email: string;
  };
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  template?: 'default' | 'modern' | 'minimal' | 'professional';
}

export function InvoiceTemplate({ invoice, template = 'default' }: InvoiceTemplateProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (template === 'modern') {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            {invoice.store.logo && (
              <img
                src={invoice.store.logo}
                alt={invoice.store.name}
                className="h-16 w-auto mb-4"
              />
            )}
            <h1 className="text-3xl font-bold text-gray-900">{invoice.store.name}</h1>
            {invoice.store.address && (
              <p className="text-gray-600 mt-2">{invoice.store.address}</p>
            )}
            {invoice.store.phone && (
              <p className="text-gray-600">{invoice.store.phone}</p>
            )}
            {invoice.store.email && (
              <p className="text-gray-600">{invoice.store.email}</p>
            )}
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-indigo-600">INVOICE</h2>
            <p className="text-gray-600 mt-2">#{invoice.invoiceNumber}</p>
            <p className="text-gray-600">Date: {formatDate(invoice.createdAt)}</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusColor(invoice.status)}`}>
              {invoice.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Customer Info */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
          <p className="text-gray-900 font-medium">{invoice.customer.name}</p>
          <p className="text-gray-600">{invoice.customer.email}</p>
        </div>

        {/* Items */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Item</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Quantity</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Price</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.order.product.name}</p>
                    <p className="text-sm text-gray-600">{invoice.order.product.description}</p>
                  </div>
                </td>
                <td className="text-right py-4 px-4 text-gray-900">{invoice.order.quantity}</td>
                <td className="text-right py-4 px-4 text-gray-900">${invoice.order.product.price.toFixed(2)}</td>
                <td className="text-right py-4 px-4 font-medium text-gray-900">
                  ${(invoice.order.product.price * invoice.order.quantity).toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.tax > 0 && (
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Tax:</span>
                <span className="text-gray-900">${invoice.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-t-2 border-gray-200 font-bold text-lg">
              <span>Total:</span>
              <span>${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p>Thank you for your business!</p>
          {invoice.store.taxNumber && (
            <p className="mt-2">Tax ID: {invoice.store.taxNumber}</p>
          )}
        </div>
      </div>
    );
  }

  if (template === 'minimal') {
    return (
      <div className="max-w-3xl mx-auto bg-white p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{invoice.store.name}</h1>
          <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
          <p className="text-gray-600">{formatDate(invoice.createdAt)}</p>
        </div>

        {/* Customer */}
        <div className="mb-6">
          <p className="text-gray-900 font-medium">{invoice.customer.name}</p>
          <p className="text-gray-600">{invoice.customer.email}</p>
        </div>

        {/* Item */}
        <div className="mb-6">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-900">{invoice.order.product.name}</p>
              <p className="text-sm text-gray-600">Qty: {invoice.order.quantity}</p>
            </div>
            <p className="font-medium text-gray-900">${invoice.total.toFixed(2)}</p>
          </div>
        </div>

        {/* Total */}
        <div className="text-right">
          <p className="text-lg font-bold">Total: ${invoice.total.toFixed(2)}</p>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-2 ${getStatusColor(invoice.status)}`}>
            {invoice.status.toUpperCase()}
          </span>
        </div>
      </div>
    );
  }

  // Default template
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{invoice.store.name}</h1>
          {invoice.store.address && (
            <p className="text-gray-600">{invoice.store.address}</p>
          )}
          {invoice.store.phone && (
            <p className="text-gray-600">Phone: {invoice.store.phone}</p>
          )}
          {invoice.store.email && (
            <p className="text-gray-600">Email: {invoice.store.email}</p>
          )}
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold text-gray-900">INVOICE</h2>
          <p className="text-gray-600">#{invoice.invoiceNumber}</p>
          <p className="text-gray-600">Date: {formatDate(invoice.createdAt)}</p>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bill To:</h3>
        <p className="text-gray-900">{invoice.customer.name}</p>
        <p className="text-gray-600">{invoice.customer.email}</p>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">Description</th>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold">Qty</th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">Price</th>
              <th className="border border-gray-300 px-4 py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-4 py-2">
                <p className="font-medium">{invoice.order.product.name}</p>
                <p className="text-sm text-gray-600">{invoice.order.product.description}</p>
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">{invoice.order.quantity}</td>
              <td className="border border-gray-300 px-4 py-2 text-right">${invoice.order.product.price.toFixed(2)}</td>
              <td className="border border-gray-300 px-4 py-2 text-right font-medium">
                ${(invoice.order.product.price * invoice.order.quantity).toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="flex justify-between py-1">
            <span>Subtotal:</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.tax > 0 && (
            <div className="flex justify-between py-1">
              <span>Tax:</span>
              <span>${invoice.tax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-gray-300 font-bold text-lg">
            <span>Total:</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="mt-6 text-center">
        <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
          {invoice.status.toUpperCase()}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-gray-600">
        <p>Thank you for your business!</p>
        {invoice.store.taxNumber && (
          <p className="mt-1">Tax ID: {invoice.store.taxNumber}</p>
        )}
      </div>
    </div>
  );
}
