import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const Cart = () => {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  if (!cartItems.length) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-charcoal">Keranjang Anda kosong</h1>
        <p className="mt-3 text-charcoal/70">Pilih buket toko untuk memulai pesanan.</p>
        <Link to="/products" className="btn-primary inline-block mt-6">
          Lihat katalog
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-7 text-charcoal">Keranjang Belanja</h1>
      <div className="grid lg:grid-cols-[1fr_340px] gap-7">
        <section className="space-y-4">
          {cartItems.map((item) => (
            <article key={item.id} className="card p-4 sm:p-5 flex gap-4">
              <img
                src={item.image || item.images?.[0] || '/placeholder-buket.svg'}
                alt={item.name}
                className="w-24 h-24 rounded-xl object-cover bg-cream"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-dusty-rose-dark">{item.category}</p>
                <h2 className="font-bold text-lg text-charcoal">{item.name}</h2>
                <p className="mt-1 text-charcoal/80">
                  {formatPrice(item.price * (1 - Number(item.discount || 0) / 100))} / buah
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    aria-label="Kurangi jumlah"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="rounded-full border border-soft-brown/25 p-1 text-charcoal hover:bg-cream transition"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="font-bold text-charcoal">{item.quantity}</span>
                  <button
                    aria-label="Tambah jumlah"
                    disabled={item.quantity >= Number(item.stock)}
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="rounded-full border border-soft-brown/25 p-1 text-charcoal hover:bg-cream transition disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    aria-label="Hapus item"
                    onClick={() => removeFromCart(item.id)}
                    className="ml-auto text-dusty-rose-dark hover:text-red-600 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <strong className="text-charcoal font-bold">
                {formatPrice(item.price * (1 - Number(item.discount || 0) / 100) * item.quantity)}
              </strong>
            </article>
          ))}
          <button onClick={clearCart} className="text-dusty-rose-dark hover:text-charcoal underline text-sm transition">
            Kosongkan keranjang
          </button>
        </section>

        <aside className="card p-6 h-fit">
          <h2 className="font-bold text-xl text-charcoal">Ringkasan pesanan</h2>
          <div className="flex justify-between mt-5 text-charcoal">
            <span>Subtotal</span>
            <strong className="text-charcoal">{formatPrice(getCartTotal())}</strong>
          </div>
          <p className="text-sm text-charcoal/60 mt-3">
            Ongkir dikonfirmasi admin setelah pesanan diterima.
          </p>
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-6">
            Lanjut checkout
          </button>
          <Link to="/products" className="block text-center mt-4 text-charcoal/70 hover:text-dusty-rose transition">
            Lanjut belanja
          </Link>
        </aside>
      </div>
    </main>
  );
};

export default Cart;
