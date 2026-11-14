import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { db } from '../config/firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const Checkout = () => {
  const { cartItems, clearCart } = useCart();
  const { user, userProfile } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: userProfile?.displayName || user?.displayName || '', phone: userProfile?.phone || '', method: 'delivery', address: '', date: '', note: '', cardMessage: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shippingSettings, setShippingSettings] = useState({ flatFee: 0, freeThreshold: 0 });
  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price || 0) * (1 - Number(item.discount || 0) / 100) * item.quantity, 0);
  const shipping = form.method === 'delivery' && !(shippingSettings.freeThreshold > 0 && subtotal >= shippingSettings.freeThreshold) ? Number(shippingSettings.flatFee || 0) : 0;
  const total = subtotal + shipping;
  const whatsappNumber = (import.meta.env.VITE_STORE_WHATSAPP_NUMBER || '').replace(/\D/g, '');

  useEffect(() => {
    getDoc(doc(db, 'settings', 'shipping')).then(snap => {
      if (snap.exists()) setShippingSettings({ flatFee: Number(snap.data().flatFee || 0), freeThreshold: Number(snap.data().freeThreshold || 0) });
    }).catch(err => console.error('Pengaturan ongkir tidak tersedia:', err));
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!user) { navigate('/login', { state: { from: '/checkout' } }); return; }
    if (!whatsappNumber) { setError('Checkout belum dapat dilanjutkan: atur VITE_STORE_WHATSAPP_NUMBER di .env, lalu mulai ulang aplikasi.'); return; }
    if (!/^62\d{8,13}$/.test(whatsappNumber)) { setError('Nomor WhatsApp toko harus berformat internasional, misalnya 6281234567890.'); return; }
    if (cartItems.some(item => item.productType === 'affiliate' || item.isActive === false)) { setError('Keranjang berisi produk yang tidak tersedia untuk checkout. Hapus lalu pilih kembali produk toko yang aktif.'); return; }
    if (!form.name.trim() || !form.phone.trim() || !form.date || (form.method === 'delivery' && !form.address.trim())) { setError('Lengkapi nama, nomor WhatsApp, tanggal, dan alamat jika memilih pengiriman.'); return; }
    const whatsappWindow = window.open('about:blank', '_blank');
    if (whatsappWindow) whatsappWindow.opener = null;
    setBusy(true);
    try {
      const productSnapshots = await Promise.all(cartItems.map(item => getDoc(doc(db, 'products', item.id))));
      if (productSnapshots.some(snapshot => !snapshot.exists())) throw new Error('Ada produk yang sudah dihapus dari katalog. Perbarui keranjang lalu coba lagi.');
      const items = cartItems.map((cartItem, index) => {
        const product = productSnapshots[index].data();
        if (product.productType === 'affiliate' || product.isActive === false) throw new Error(`${product.name || cartItem.name} tidak tersedia untuk checkout toko.`);
        if (!Number.isInteger(Number(product.stock)) || Number(product.stock) < cartItem.quantity) throw new Error(`Stok ${product.name || cartItem.name} tidak mencukupi. Hubungi toko untuk konfirmasi.`);
        return { productId: cartItem.id, name: product.name, image: product.image || product.images?.[0] || '', productType: 'store', quantity: cartItem.quantity, price: Number(product.price) * (1 - Number(product.discount || 0) / 100), category: product.category || '' };
      });
      const liveSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const liveShipping = form.method === 'delivery' && !(shippingSettings.freeThreshold > 0 && liveSubtotal >= shippingSettings.freeThreshold) ? Number(shippingSettings.flatFee || 0) : 0;
      const liveTotal = liveSubtotal + liveShipping;
      const order = {
        userId: user.uid, userName: form.name.trim(), userEmail: user.email || '',
        customer: { name: form.name.trim(), phone: form.phone.trim(), email: user.email || '', method: form.method, address: form.method === 'delivery' ? form.address.trim() : '', requestedDate: form.date, note: form.note.trim(), cardMessage: form.cardMessage.trim() },
        items, subtotal: liveSubtotal, shipping: liveShipping, total: liveTotal, orderStatus: 'pending', status: 'pending', paymentMethod: 'manual_whatsapp', paymentStatus: 'pending', createdAt: serverTimestamp(),
      };
      const orderRef = await addDoc(collection(db, 'orders'), order);
      const lines = items.map((item, i) => `${i + 1}. ${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity)}`).join('\n');
      const message = [
        `Halo Buket Bahagia, saya ingin mengonfirmasi pesanan #${orderRef.id.slice(0, 8).toUpperCase()}.`, '',
        `Nama: ${form.name.trim()}`, `WhatsApp: ${form.phone.trim()}`, `Penerimaan: ${form.method === 'delivery' ? 'Diantar' : 'Ambil di toko'}`,
        ...(form.method === 'delivery' ? [`Alamat: ${form.address.trim()}`] : []), `Tanggal: ${form.date}`, '', 'Pesanan:', lines, '', `Subtotal: ${formatPrice(liveSubtotal)}`, `Ongkir sementara: ${formatPrice(liveShipping)}`, `Total sementara: ${formatPrice(liveTotal)}`,
        ...(form.note.trim() ? [`Catatan: ${form.note.trim()}`] : []), ...(form.cardMessage.trim() ? [`Isi kartu ucapan: ${form.cardMessage.trim()}`] : []), '', 'Mohon konfirmasi ketersediaan dan rincian pembayaran. Terima kasih!'
      ].join('\n');
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
      if (whatsappWindow) whatsappWindow.location.replace(waUrl);
      clearCart();
      navigate('/order-success', { state: { orderId: orderRef.id, orderTotal: liveTotal, paymentMethod: 'manual_whatsapp', whatsappUrl: waUrl } });
    } catch (err) {
      console.error('Gagal membuat pesanan:', err);
      whatsappWindow?.close();
      setError(['Ada produk yang sudah dihapus','Stok ','tidak tersedia untuk checkout'].some(message => err.message?.includes(message)) ? err.message : 'Pesanan belum berhasil disimpan. Periksa koneksi dan coba lagi.');
    } finally { setBusy(false); }
  };

  if (!cartItems.length) return <main className="max-w-3xl mx-auto p-10 text-center"><h1 className="text-3xl font-bold">Keranjang kosong</h1><Link to="/products" className="btn-primary inline-block mt-5">Lihat katalog</Link></main>;
  return <main className="max-w-5xl mx-auto px-4 py-10">
    <Link to="/cart" className="inline-flex items-center gap-2 mb-6"><ArrowLeft size={18}/> Kembali ke keranjang</Link>
    <h1 className="text-3xl sm:text-4xl font-bold mb-2">Checkout WhatsApp</h1><p className="mb-8 opacity-75">Pesanan dicatat sebagai pending. Admin akan memastikan harga, stok, dan biaya kirim sebelum pembayaran.</p>
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <form onSubmit={submit} className="card p-6 space-y-5">
        <label className="block">Nama lengkap<input className="input-field mt-1" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label className="block">Nomor WhatsApp<input className="input-field mt-1" required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="08xxxxxxxxxx"/></label>
        <fieldset><legend className="mb-2">Metode penerimaan</legend><div className="flex gap-5"><label><input type="radio" name="method" value="delivery" checked={form.method==='delivery'} onChange={e=>setForm({...form,method:e.target.value})}/> Diantar</label><label><input type="radio" name="method" value="pickup" checked={form.method==='pickup'} onChange={e=>setForm({...form,method:e.target.value})}/> Ambil di toko</label></div></fieldset>
        {form.method==='delivery' && <label className="block">Alamat pengiriman<textarea className="input-field mt-1" required rows="3" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>}
        <label className="block">Tanggal penerimaan/pengiriman<input className="input-field mt-1" type="date" required min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
        <label className="block">Catatan pesanan (opsional)<textarea className="input-field mt-1" rows="2" value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label>
        <label className="block">Isi kartu ucapan (opsional)<textarea className="input-field mt-1" rows="2" value={form.cardMessage} onChange={e=>setForm({...form,cardMessage:e.target.value})}/></label>
        {error && <p role="alert" className="p-3 rounded bg-red-100 text-red-800">{error}</p>}
        {!whatsappNumber && <p className="p-3 rounded bg-amber-100 text-amber-900">Nomor WhatsApp toko belum dikonfigurasi. Isi VITE_STORE_WHATSAPP_NUMBER pada .env.</p>}
        <button disabled={busy} className="btn-primary w-full inline-flex justify-center items-center gap-2"><MessageCircle size={18}/>{busy?'Menyimpan pesanan…':'Buat pesanan & buka WhatsApp'}</button>
      </form>
      <aside className="card p-6 h-fit"><h2 className="text-xl font-bold mb-4">Ringkasan</h2>{cartItems.map(item=><div key={item.id} className="flex justify-between gap-3 py-2 border-b"><span>{item.name} × {item.quantity}</span><span>{formatPrice(item.price*(1-Number(item.discount||0)/100)*item.quantity)}</span></div>)}<div className="flex justify-between pt-4"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between mt-2"><span>Ongkir sementara</span><span>{form.method==='delivery'?formatPrice(shipping):'Ambil di toko'}</span></div><div className="flex justify-between pt-3 mt-3 border-t font-bold"><span>Total sementara</span><span>{formatPrice(total)}</span></div><p className="text-sm mt-3 opacity-70">Admin akan mengonfirmasi total dan ketersediaan.</p></aside>
    </div>
  </main>;
};
export default Checkout;
