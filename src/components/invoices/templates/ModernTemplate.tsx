interface InvoiceTemplateProps {
  invoice: any;
  order: any;
  store: any;
  customer: any;
}

export default function ModernTemplate({ invoice, order, store, customer }: InvoiceTemplateProps) {
  return (
    <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 p-8 rounded-2xl shadow-xl">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              INVOICE
            </h1>
            <p className="text-gray-600 mt-2">#{invoice.invoiceNumber}</p>
            <p className="text-sm text-gray-500">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            {store.logo && (
              <img src={store.logo} alt={store.name} className="h-20 mb-4 rounded-lg shadow-md" />
            )}
            <h2 className="text-2xl font-bold text-gray-800">{store.name}</h2>
            {store.address && <p className="text-gray-600 mt-1">{store.address}</p>}
            {store.phone && <p className="text-gray-600">{store.phone}</p>}
            {store.email && <p className="text-blue-600 font-medium">{store.email}</p>}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
          Bill To
        </h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-lg font-semibold text-gray-800">{customer.name}</p>
          <p className="text-gray-600">{customer.email}</p>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
          Order Details
        </h3>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Product</th>
                <th className="px-6 py-4 text-center font-semibold">Qty</th>
                <th className="px-6 py-4 text-right font-semibold">Price</th>
                <th className="px-6 py-4 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              <tr className="border-b border-gray-100">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {order.product.image && (
                      <img src={order.product.image} alt={order.product.name} className="w-16 h-16 object-cover rounded-lg mr-4 shadow-sm" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{order.product.name}</p>
                      <p className="text-sm text-gray-500">by {order.product.supplier.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {order.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-medium">${order.productPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-bold text-green-600">${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-white rounded-xl p-6 mb-8 shadow-lg">
        <div className="flex justify-end">
          <div className="w-80">
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">${invoice.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg px-4">
                <span className="text-xl font-bold text-gray-800">Total:</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  ${invoice.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center">
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <p className="text-lg font-semibold text-gray-800 mb-2">Thank you for your business!</p>
          <p className="text-gray-600">We appreciate your trust in {store.name}</p>
        </div>
      </div>
    </div>
  );
}
