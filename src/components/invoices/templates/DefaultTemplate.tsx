interface InvoiceTemplateProps {
  invoice: any;
  order: any;
  store: any;
  customer: any;
}

export default function DefaultTemplate({ invoice, order, store, customer }: InvoiceTemplateProps) {
  return (
    <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">INVOICE</h1>
          <p className="text-gray-600">Invoice #{invoice.invoiceNumber}</p>
        </div>
        <div className="text-right">
          {store.logo && (
            <img src={store.logo} alt={store.name} className="h-16 mb-4" />
          )}
          <h2 className="text-xl font-semibold">{store.name}</h2>
          {store.address && <p className="text-gray-600">{store.address}</p>}
          {store.phone && <p className="text-gray-600">{store.phone}</p>}
          {store.email && <p className="text-gray-600">{store.email}</p>}
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Bill To:</h3>
        <p className="font-medium">{customer.name}</p>
        <p className="text-gray-600">{customer.email}</p>
      </div>

      {/* Order Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Order Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Product</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-2">
                  <div className="flex items-center">
                    {order.product.image && (
                      <img src={order.product.image} alt={order.product.name} className="w-12 h-12 object-cover rounded mr-3" />
                    )}
                    <div>
                      <p className="font-medium">{order.product.name}</p>
                      <p className="text-sm text-gray-600">Supplier: {order.product.supplier.name}</p>
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-2">{order.quantity}</td>
                <td className="border border-gray-300 px-4 py-2">${order.productPrice.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-2">${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-64">
          <div className="flex justify-between py-2 border-b">
            <span>Subtotal:</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span>Tax:</span>
            <span>${invoice.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 text-lg font-semibold">
            <span>Total:</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-4 text-center text-gray-600">
        <p>Thank you for your business!</p>
        <p className="text-sm">Invoice generated on {new Date(invoice.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
