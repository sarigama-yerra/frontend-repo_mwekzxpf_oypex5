import { useEffect, useMemo, useState } from 'react'
import ProductCard from './components/ProductCard'

const CART_ID_KEY = 'cart_id_v1'

function useCartId() {
  const [cartId, setCartId] = useState('')
  useEffect(() => {
    let id = localStorage.getItem(CART_ID_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(CART_ID_KEY, id)
    }
    setCartId(id)
  }, [])
  return cartId
}

function App() {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState('relevance')

  const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
  const cartId = useCartId()

  const subtotal = useMemo(() => cart.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0), [cart])
  const tax = useMemo(() => Math.round(subtotal * 0.07 * 100) / 100, [subtotal])
  const total = useMemo(() => Math.round((subtotal + tax) * 100) / 100, [subtotal, tax])

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${backend}/categories`)
      const data = await res.json()
      setCategories(data || [])
    } catch {
      setCategories([])
    }
  }

  const fetchProducts = async () => {
    const params = new URLSearchParams()
    if (selectedCategory && selectedCategory !== 'all') params.set('category', selectedCategory)
    if (q.trim()) params.set('q', q.trim())
    if (sort === 'price_asc' || sort === 'price_desc') params.set('sort', sort)

    const res = await fetch(`${backend}/products${params.toString() ? `?${params.toString()}` : ''}`)
    const data = await res.json()
    setProducts(data)
  }

  const fetchCart = async () => {
    if (!cartId) return
    const res = await fetch(`${backend}/cart/${cartId}`)
    const data = await res.json()
    // join with product info for price
    const map = new Map(products.map(p => [p.id, p]))
    const enriched = data.map(ci => ({ ...ci, ...(map.get(ci.product_id) || {}) }))
    setCart(enriched)
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      await Promise.all([fetchProducts(), fetchCategories()])
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchCart()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartId, products.length])

  const addToCart = async (product) => {
    if (!cartId) return
    await fetch(`${backend}/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_id: cartId, product_id: product.id, quantity: 1 })
    })
    fetchCart()
  }

  const removeFromCart = async (itemId) => {
    await fetch(`${backend}/cart/${itemId}`, { method: 'DELETE' })
    fetchCart()
  }

  const placeOrder = async () => {
    if (!cart.length) return
    setPlacingOrder(true)
    const res = await fetch(`${backend}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cart_id: cartId })
    })
    const id = await res.text()
    setOrderId(id.replace(/\"/g, ''))
    setCart([])
    setPlacingOrder(false)
  }

  const applyFilters = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    await fetchProducts()
    await fetchCart()
    setLoading(false)
  }

  const seedDemo = async () => {
    await fetch(`${backend}/seed/electronics`, { method: 'POST' })
    applyFilters()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight">ProElectronics</span>
            <span className="ml-2 inline-flex items-center rounded-full bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-0.5">Pro</span>
          </div>
          <nav className="text-sm text-slate-600 flex items-center gap-4">
            <a href="/" className="hover:text-slate-900">Store</a>
            <a href="/test" className="hover:text-slate-900">System Test</a>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <section className="md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Electronics</h2>
              <p className="text-slate-500 text-sm">Shop TVs, laptops, phones, audio and more.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={seedDemo} className="text-xs bg-slate-900 hover:bg-black text-white font-semibold px-3 py-2 rounded-lg">Seed demo catalog</button>
            </div>
          </div>

          <form onSubmit={applyFilters} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search electronics..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="relevance">Sort: Relevance</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg">Apply</button>
            </div>
          </form>

          {loading ? (
            <p className="text-slate-500">Loading products...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(p => (
                <ProductCard key={p.id} product={p} onAdd={addToCart} />
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-slate-500 text-sm">No products match your filters.</div>
              )}
            </div>
          )}
        </section>

        <aside className="md:col-span-1 bg-white rounded-xl shadow-sm border border-slate-100 p-4 h-fit sticky top-24">
          <h3 className="text-xl font-semibold mb-4">Your Cart</h3>
          {cart.length === 0 ? (
            <p className="text-slate-500">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : null}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800 line-clamp-2">{item.title}</p>
                        <p className="text-xs text-slate-500">Qty {item.quantity}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-600 hover:text-red-700">Remove</button>
                    </div>
                    <p className="text-sm font-semibold mt-1">${Number(item.price || 0).toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-4 text-sm space-y-1">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>${tax.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold text-slate-900"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>
              <button disabled={placingOrder} onClick={placeOrder} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg disabled:opacity-50">
                {placingOrder ? 'Placing order...' : 'Checkout'}
              </button>
              {orderId && (
                <div className="text-xs text-green-700">Order placed! ID: {orderId}</div>
              )}
            </div>
          )}
        </aside>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} ProElectronics. All rights reserved.
      </footer>
    </div>
  )
}

export default App
