import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    method: 'delivery',
    address: '',
    date: '',
    note: '',
    cardMessage: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shippingSettings, setShippingSettings] = useState({ flatFee: 0, freeThreshold: 0 });

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0) * (1 - Number(item.discount || 0) / 100) * item.quantity,
    0
  );
  const shipping =
    form.method === 'delivery' &&
    !(shippingSettings.freeThreshold > 0 && subtotal >= shippingSettings.freeThreshold)
      ? Number(shippingSettings.flatFee || 0)
      : 0;
  const total = subtotal + shipping;
  const whatsappNumber = (import.meta.env.VITE_STORE_WHATSAPP_NUMBER || '').replace(/\D/g, '');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'shipping'))
      .then((snap) => {
        if (snap.exists()) {
          setShippingSettings({
            flatFee: Number(snap.data().flatFee || 0),
            freeThreshold: Number(snap.data().freeThreshold || 0),
          });
        }
      })
      .catch((err) => console.error('Pengaturan ongkir tidak tersedia:', err));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!whatsappNumber) {
      setError('Checkout belum dapat dilanjutkan: atur VITE_STORE_WHATSAPP_NUMBER di .env, lalu mulai ulang aplikasi.');
      return;
    }
    if (!/^62\d{8,13}$/.test(whatsappNumber)) {
      setError('Nomor WhatsApp toko harus berformat internasional, misalnya 6281234567890.');
      return;
    }
    if (cartItems.some((item) => item.productType === 'affiliate' || item.isActive === false)) {
      setError('Keranjang berisi produk yang tidak tersedia untuk checkout. Hapus lalu pilih kembali produk toko yang aktif.');
      return;
    }
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.date ||
      (form.method === 'delivery' && !form.address.trim())
    ) {
      setError('Lengkapi nama, nomor WhatsApp, tanggal, dan alamat jika memilih pengiriman.');
      return;
    }

    const whatsappWindow = window.open('about:blank', '_blank');
    if (whatsappWindow) whatsappWindow.opener = null;
    setBusy(true);

    try {
      const productSnapshots = await Promise.all(
        cartItems.map((item) => getDoc(doc(db, 'products', item.id)))
      );
      if (productSnapshots.some((snapshot) => !snapshot.exists())) {
        throw new Error('Ada produk yang sudah dihapus dari katalog. Perbarui keranjang lalu coba lagi.');
      }

      const items = cartItems.map((cartItem, index) => {
        const product = productSnapshots[index].data();
        if (product.productType === 'affiliate' || product.isActive === false) {
          throw new Error(`${product.name || cartItem.name} tidak tersedia untuk checkout toko.`);
        }
        if (!Number.isInteger(Number(product.stock)) || Number(product.stock) < cartItem.quantity) {
          throw new Error(`Stok ${product.name || cartItem.name} tidak mencukupi. Hubungi toko untuk konfirmasi.`);
        }
        return {
          productId: cartItem.id,
          name: product.name,
          image: product.image || product.images?.[0] || '',
          productType: 'store',
          quantity: cartItem.quantity,
          price: Number(product.price) * (1 - Number(product.discount || 0) / 100),
          category: product.category || '',
        };
      });

      const liveSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const liveShipping =
        form.method === 'delivery' &&
        !(shippingSettings.freeThreshold > 0 && liveSubtotal >= shippingSettings.freeThreshold)
          ? Number(shippingSettings.flatFee || 0)
          : 0;
      const liveTotal = liveSubtotal + liveShipping;

      const order = {
        guestInfo: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.method === 'delivery' ? form.address.trim() : '',
          method: form.method,
          requestedDate: form.date,
          note: form.note.trim(),
          cardMessage: form.cardMessage.trim(),
        },
        userName: form.name.trim(),
        userPhone: form.phone.trim(),
        items,
        subtotal: liveSubtotal,
        shipping: liveShipping,
        total: liveTotal,
        orderStatus: 'pending',
        status: 'pending',
        paymentMethod: 'manual_whatsapp',
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(db, 'orders'), order);
      const lines = items
        .map(
          (item, i) =>
            `${i + 1}. ${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`
        )
        .join('\n');

      const message = [
        `Halo rybelflorist, saya ingin mengonfirmasi pesanan #${orderRef.id.slice(0, 8).toUpperCase()}.`,
        '',
        `Nama: ${form.name.trim()}`,
        `WhatsApp: ${form.phone.trim()}`,
        `Penerimaan: ${form.method === 'delivery' ? 'Diantar ke alamat' : 'Ambil di toko'}`,
        ...(form.method === 'delivery' ? [`Alamat: ${form.address.trim()}`] : []),
        `Tanggal: ${form.date}`,
        '',
        'Rincian Pesanan:',
        lines,
        '',
        `Subtotal: ${formatPrice(liveSubtotal)}`,
        `Ongkir sementara: ${formatPrice(liveShipping)}`,
        `Total sementara: ${formatPrice(liveTotal)}`,
        ...(form.note.trim() ? [`Catatan: ${form.note.trim()}`] : []),
        ...(form.cardMessage.trim() ? [`Isi kartu ucapan: ${form.cardMessage.trim()}`] : []),
        '',
        'Mohon konfirmasi ketersediaan dan rincian pembayaran. Terima kasih!',
      ].join('\n');

      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      if (whatsappWindow) whatsappWindow.location.replace(waUrl);

      clearCart();
      navigate('/order-success', {
        state: {
          orderId: orderRef.id,
          orderTotal: liveTotal,
          paymentMethod: 'manual_whatsapp',
          whatsappUrl: waUrl,
        },
      });
    } catch (err) {
      console.error('Gagal membuat pesanan:', err);
      whatsappWindow?.close();
      setError(
        ['Ada produk yang sudah dihapus', 'Stok ', 'tidak tersedia untuk checkout'].some((msg) =>
          err.message?.includes(msg)
        )
          ? err.message
          : 'Pesanan belum berhasil disimpan. Periksa koneksi dan coba lagi.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (!cartItems.length) {
    return (
      <main className="max-w-3xl mx-auto p-10 text-center">
        <h1 className="text-3xl font-bold text-charcoal">Keranjang Belanja Kosong</h1>
        <p className="text-charcoal/60 mt-2 text-sm">Pilih produk buket favorit Anda terlebih dahulu.</p>
        <Link to="/products" className="btn-primary inline-block mt-6">
          Lihat Katalog
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <Link to="/cart" className="inline-flex items-center gap-2 mb-6 text-dusty-rose-dark hover:text-charcoal font-semibold text-sm transition">
        <ArrowLeft size={18} /> Kembali ke Keranjang
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal">Pemesanan WhatsApp</h1>
        <p className="text-charcoal/70 text-sm mt-1">
          Tidak perlu login/daftar akun. Isi data pemesanan di bawah, pesanan akan dicatat dan Anda langsung diarahkan ke WhatsApp kami.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <form onSubmit={submit} className="bg-white p-6 sm:p-8 rounded-3xl border border-soft-brown/15 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
              Nama Lengkap *
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-soft-brown/20 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 text-charcoal text-sm"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Contoh: Rina Anggraini"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
              Nomor WhatsApp Pembeli *
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-soft-brown/20 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 text-charcoal text-sm"
              required
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
              Metode Penerimaan *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer bg-cream px-4 py-2 rounded-xl border border-soft-brown/15">
                <input
                  type="radio"
                  name="method"
                  value="delivery"
                  checked={form.method === 'delivery'}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="accent-[#D9A6A0]"
                />
                Diantar ke Alamat
              </label>
              <label className="flex items-center gap-2 text-sm text-charcoal cursor-pointer bg-cream px-4 py-2 rounded-xl border border-soft-brown/15">
                <input
                  type="radio"
                  name="method"
                  value="pickup"
                  checked={form.method === 'pickup'}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="accent-[#D9A6A0]"
                />
                Ambil di Toko
              </label>
            </div>
          </div>

          {form.method === 'delivery' && (
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
                Alamat Pengiriman Lengkap *
              </label>
              <textarea
                className="w-full px-4 py-2.5 rounded-xl border border-soft-brown/20 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 text-charcoal text-sm"
                required
                rows="3"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Alamat lengkap tujuan pengantaran..."
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
              Tanggal Diperlukan / Pengiriman *
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-xl border border-soft-brown/20 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 text-charcoal text-sm"
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
              Catatan Pesanan (Opsional)
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-soft-brown/20 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 text-charcoal text-sm"
              rows="2"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Contoh: Nuansa warna pita pink lembut, dll."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1">
              Isi Kartu Ucapan (Opsional)
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl border border-soft-brown/20 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 text-charcoal text-sm"
              rows="2"
              value={form.cardMessage}
              onChange={(e) => setForm({ ...form, cardMessage: e.target.value })}
              placeholder="Tulis pesan kartu ucapan untuk penerima buket..."
            />
          </div>

          {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">{error}</p>}
          {!whatsappNumber && (
            <p className="p-3 rounded-xl bg-amber-50 text-amber-800 text-sm border border-amber-200">
              Nomor WhatsApp toko belum dikonfigurasi di file .env (VITE_STORE_WHATSAPP_NUMBER).
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-primary w-full inline-flex justify-center items-center gap-2 py-3 text-base"
          >
            <MessageCircle size={18} />
            {busy ? 'Menyimpan pesanan…' : 'Kirim Pesanan via WhatsApp'}
          </button>
        </form>

        <aside className="bg-white p-6 rounded-3xl border border-soft-brown/15 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-charcoal mb-4 pb-3 border-b border-soft-brown/15">
            Ringkasan Belanja
          </h2>
          <div className="space-y-3 mb-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-charcoal/80 font-medium">
                  {item.name} × {item.quantity}
                </span>
                <span className="text-charcoal font-semibold">
                  {formatPrice(
                    item.price * (1 - Number(item.discount || 0) / 100) * item.quantity
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-soft-brown/15 space-y-2 text-sm">
            <div className="flex justify-between text-charcoal/70">
              <span>Subtotal</span>
              <span className="font-semibold text-charcoal">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-charcoal/70">
              <span>Ongkir Sementara</span>
              <span className="font-semibold text-charcoal">
                {form.method === 'delivery' ? formatPrice(shipping) : 'Ambil di Toko'}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-soft-brown/15 font-bold text-base text-charcoal">
              <span>Total Estimasi</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <p className="text-xs text-charcoal/60 mt-4 leading-relaxed bg-cream p-3 rounded-xl border border-soft-brown/15">
            Admin rybelflorist akan memverifikasi ketersediaan stok, tanggal, dan biaya kirim riil saat chat WhatsApp.
          </p>
        </aside>
      </div>
    </main>
  );
};

export default Checkout;
