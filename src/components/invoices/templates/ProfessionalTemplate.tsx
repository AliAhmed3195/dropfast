interface InvoiceTemplateProps {
  invoice: any;
  order: any;
  store: any;
  customer: any;
}

export default function ProfessionalTemplate({ invoice, order, store, customer }: InvoiceTemplateProps) {
  return (
    <div className="max-w-5xl mx-auto bg-white p-10 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">INVOICE</h1>
          <div className="space-y-1">
            <p className="text-gray-600">Invoice Number: <span className="font-semibold">#{invoice.invoiceNumber}</span></p>
            <p className="text-gray-600">Date: <span className="font-semibold">{new Date(invoice.createdAt).toLocaleDateString()}</span></p>
            <p className="text-gray-600">Due Date: <span className="font-semibold">{new Date(invoice.createdAt).toLocaleDateString()}</span></p>
          </div>
        </div>
        <div className="text-right">
          {store.logo && (
            <img src={store.logo} alt={store.name} className="h-20 mb-4" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{store.name}</h2>
          <div className="text-gray-600 space-y-1">
            {store.address && <p>{store.address}</p>}
            {store.phone && <p>Phone: {store.phone}</p>}
            {store.email && <p>Email: {store.email}</p>}
            {store.taxNumber && <p>Tax ID: {store.taxNumber}</p>}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-gray-50 p-6 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Bill To:</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-semibold text-gray-900">{customer.name}</p>
            <p className="text-gray-600">{customer.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Payment Terms: Net 30</p>
            <p className="text-sm text-gray-600">Payment Method: Credit Card</p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Description</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold text-gray-900">Qty</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">Unit Price</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold text-gray-900">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-4">
                  <div className="flex items-center">
                    {order.product.image && (
                      <img src={order.product.image} alt={order.product.name} className="w-16 h-16 object-cover rounded mr-4" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{order.product.name}</p>
                      <p className="text-sm text-gray-600">Category: {order.product.category}</p>
                      <p className="text-sm text-gray-600">Supplier: {order.product.supplier.name}</p>
                    </div>
                  </div>
                </td>
                <td className="border border-gray-300 px-4 py-4 text-center">{order.quantity}</td>
                <td className="border border-gray-300 px-4 py-4 text-right">${order.productPrice.toFixed(2)}</td>
                <td className="border border-gray-300 px-4 py-4 text-right font-semibold">${order.totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-2 text-right text-gray-600">Subtotal:</td>
                <td className="py-2 text-right font-semibold w-24">${invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-2 text-right text-gray-600">Tax (0%):</td>
                <td className="py-2 text-right font-semibold w-24">${invoice.tax.toFixed(2)}</td>
              </tr>
              <tr className="border-t-2 border-gray-300">
                <td className="py-3 text-right text-lg font-bold text-gray-900">Total:</td>
                <td className="py-3 text-right text-lg font-bold text-gray-900 w-24">${invoice.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <h4 className="font-semibold text-gray-900 mb-2">Payment Instructions:</h4>
        <p className="text-gray-700 text-sm">
          Payment is due within 30 days of invoice date. Please include the invoice number with your payment.
          For questions about this invoice, please contact us at {store.email || 'support@example.com'}.
        </p>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 pt-6">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Thank you for your business!</h4>
            <p className="text-gray-600 text-sm">
              We appreciate your trust in {store.name}. If you have any questions or concerns, 
              please don't hesitate to contact us.
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              Invoice generated on {new Date(invoice.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              This is a computer-generated invoice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
