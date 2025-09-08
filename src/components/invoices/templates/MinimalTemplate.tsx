interface InvoiceTemplateProps {
  invoice: any;
  order: any;
  store: any;
  customer: any;
}

export default function MinimalTemplate({ invoice, order, store, customer }: InvoiceTemplateProps) {
  return (
    <div className="max-w-3xl mx-auto bg-white p-12">
      {/* Header */}
      <div className="border-b border-gray-200 pb-8 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-light text-gray-900">INVOICE</h1>
            <p className="text-sm text-gray-500 mt-1">#{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            {store.logo && (
              <img src={store.logo} alt={store.name} className="h-12 mb-3" />
            )}
            <h2 className="text-lg font-medium text-gray-900">{store.name}</h2>
            {store.address && <p className="text-sm text-gray-500">{store.address}</p>}
            {store.phone && <p className="text-sm text-gray-500">{store.phone}</p>}
            {store.email && <p className="text-sm text-gray-500">{store.email}</p>}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Bill to:</h3>
        <p className="text-gray-900">{customer.name}</p>
        <p className="text-gray-500">{customer.email}</p>
      </div>

      {/* Order Details */}
      <div className="mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 text-sm font-medium text-gray-900">Item</th>
              <th className="text-right py-3 text-sm font-medium text-gray-900">Qty</th>
              <th className="text-right py-3 text-sm font-medium text-gray-900">Price</th>
              <th className="text-right py-3 text-sm font-medium text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-4">
                <div className="flex items-center">
                  {order.product.image && (
                    <img src={order.product.image} alt={order.product.name} className="w-10 h-10 object-cover rounded mr-3" />
                  )}
                  <div>
                    <p className="text-gray-900">{order.product.name}</p>
                    <p className="text-xs text-gray-500">{order.product.supplier.name}</p>
                  </div>
                </div>
              </td>
              <td className="text-right py-4 text-gray-900">{order.quantity}</td>
              <td className="text-right py-4 text-gray-900">${order.productPrice.toFixed(2)}</td>
              <td className="text-right py-4 text-gray-900">${order.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tax</span>
              <span className="text-gray-900">${invoice.tax.toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-2">
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">Total</span>
                <span className="font-medium text-gray-900">${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500">Thank you for your business</p>
      </div>
    </div>
  );
}
