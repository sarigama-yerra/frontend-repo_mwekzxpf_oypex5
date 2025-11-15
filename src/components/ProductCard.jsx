import { ShoppingCart } from 'lucide-react'

function ProductCard({ product, onAdd }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {product.image ? (
        <img src={product.image} alt={product.title} className="h-40 w-full object-cover" />
      ) : (
        <div className="h-40 w-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center text-gray-400">
          <span className="text-sm">No image</span>
        </div>
      )}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-800 line-clamp-2 min-h-[3.5rem]">{product.title}</h3>
        <p className="text-sm text-gray-500 mt-1 capitalize">{product.category}</p>
        {product.description && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-lg font-bold text-gray-900">${Number(product.price).toFixed(2)}</span>
          <button
            onClick={() => onAdd(product)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          >
            <ShoppingCart size={18} />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductCard
