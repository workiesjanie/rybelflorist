import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCurrency } from '../context/CurrencyContext';
import { MessageCircle } from 'lucide-react';

const statuses = [
  { value: 'pending', label: 'Pending (Menunggu)' },
  { value: 'confirmed', label: 'Confirmed (Stok Dipotong)' },
  { value: 'processing', label: 'Processing (Diproses)' },
  { value: 'shipped', label: 'Shipped (Dikirim)' },
  { value: 'delivered', label: 'Delivered (Tiba)' },
  { value: 'completed', label: 'Completed (Selesai)' },
  { value: 'cancelled', label: 'Cancelled (Batal)' },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
      (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error(err);
        setError('Tidak dapat memuat pesanan. Pastikan Anda masuk sebagai admin dan Firestore Rules terbaru sudah diterapkan.');
      }
    );
    return () => unsubscribe();
  }, []);

  const changeStatus = async (order, status) => {
    setBusy(order.id);
    setError('');
    try {
      await runTransaction(db, async (tx) => {
        const orderRef = doc(db, 'orders', order.id);
        const currentSnap = await tx.get(orderRef);
        if (!currentSnap.exists()) throw new Error('Pesanan tidak ditemukan.');
        const current = currentSnap.data();
        if (current.orderStatus !== order.orderStatus) {
          throw new Error('Status pesanan telah berubah oleh sesi lain. Muat ulang halaman.');
        }

        const orderItems = current.items || [];
        if (orderItems.some((item) => !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1)) {
          throw new Error('Pesanan memiliki kuantitas tidak valid.');
        }

        if (status === 'confirmed' && current.orderStatus === 'pending') {
          const productItems = [
            ...(orderItems
              .filter((item) => item.productType !== 'affiliate' && item.productId)
              .reduce((map, item) => {
                const previous = map.get(item.productId) || { ...item, quantity: 0 };
                previous.quantity += Number(item.quantity || 0);
                map.set(item.productId, previous);
                return map;
              }, new Map())
              .values()),
          ];

          const productRefs = productItems.map((item) => doc(db, 'products', item.productId));
          const productSnaps = [];
          for (const ref of productRefs) productSnaps.push(await tx.get(ref));

          productSnaps.forEach((snap, index) => {
            if (!snap.exists()) throw new Error(`Produk ${productItems[index].name} sudah dihapus dari katalog.`);
            const stock = Number(snap.data().stock);
            if (!Number.isInteger(stock) || stock < productItems[index].quantity) {
              throw new Error(`Stok fisik ${productItems[index].name} tidak mencukupi (${stock} tersedia).`);
            }
          });

          productSnaps.forEach((snap, index) =>
            tx.update(productRefs[index], {
              stock: Number(snap.data().stock) - Number(productItems[index].quantity),
            })
          );
        }

        tx.update(orderRef, {
          orderStatus: status,
          status,
          ...(status === 'confirmed' ? { confirmedAt: serverTimestamp() } : {}),
          updatedAt: serverTimestamp(),
        });
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Gagal memperbarui status pesanan.');
    } finally {
      setBusy('');
    }
  };

  const openWhatsAppCustomer = (phone, orderId, name) => {
    let cleanPhone = (phone || '').replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    if (!cleanPhone) return;
    const msg = `Halo Kak ${name || ''}, kami dari rybelflorist ingin mengonfirmasi pesanan #${orderId.slice(0, 8).toUpperCase()}...`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-charcoal">
          Daftar Pesanan Masuk
        </h2>
        <p className="text-charcoal/70 text-sm mt-1">
          Pesanan checkout via WhatsApp. Transisi <strong className="text-dusty-rose-dark font-semibold">pending → confirmed</strong> akan memotong stok otomatis secara atomik.
        </p>
      </div>

      {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm font-medium">{error}</p>}

      {!orders.length && !error && (
        <div className="p-12 text-center text-charcoal/50 bg-cream rounded-2xl border border-soft-brown/15">
          Belum ada pesanan yang masuk.
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const customerInfo = order.guestInfo || order.customer || {};
          const customerName = customerInfo.name || order.userName || 'Tamu';
          const customerPhone = customerInfo.phone || order.userPhone || '';
          const isPickup = customerInfo.method === 'pickup';

          return (
            <article
              key={order.id}
              className="p-6 bg-white rounded-2xl border border-soft-brown/15 text-charcoal space-y-4 shadow-sm"
            >
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-soft-brown/10">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-charcoal">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      order.orderStatus === 'confirmed'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : order.orderStatus === 'cancelled'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {order.orderStatus || 'pending'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-charcoal/80 mt-1">
                    {customerName} · {customerPhone || 'Tanpa no. HP'}
                  </p>
                  <p className="text-xs text-charcoal/60">
                    Metode: {isPickup ? 'Ambil di Toko' : 'Diantar'} · Tanggal: {customerInfo.requestedDate || '-'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {customerPhone && (
                    <button
                      type="button"
                      onClick={() => openWhatsAppCustomer(customerPhone, order.id, customerName)}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <MessageCircle size={16} /> Hubungi WhatsApp
                    </button>
                  )}
                  <select
                    aria-label="Status pesanan"
                    className="px-3 py-2 rounded-xl bg-cream text-charcoal border border-soft-brown/25 text-xs font-bold focus:outline-none"
                    value={order.orderStatus || order.status || 'pending'}
                    disabled={busy === order.id}
                    onChange={(e) => changeStatus(order, e.target.value)}
                  >
                    {statuses.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </header>

              {/* Items */}
              <div className="divide-y divide-soft-brown/10">
                {(order.items || []).map((item, i) => (
                  <div key={`${item.productId || item.name}-${i}`} className="py-2 flex justify-between text-sm">
                    <span className="text-charcoal/80">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-semibold text-dusty-rose-dark">
                      {formatPrice(Number(item.price) * Number(item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detail Penerima */}
              <div className="bg-cream p-3 rounded-xl text-xs space-y-1 text-charcoal/80 border border-soft-brown/10">
                {customerInfo.address && (
                  <p><strong className="text-charcoal">Alamat Kirim:</strong> {customerInfo.address}</p>
                )}
                {customerInfo.note && (
                  <p><strong className="text-charcoal">Catatan:</strong> {customerInfo.note}</p>
                )}
                {customerInfo.cardMessage && (
                  <p><strong className="text-charcoal">Kartu Ucapan:</strong> "{customerInfo.cardMessage}"</p>
                )}
              </div>

              {/* Totals */}
              <div className="pt-2 flex justify-between items-center text-sm font-bold border-t border-soft-brown/10">
                <span className="text-charcoal/60">Total Tagihan:</span>
                <span className="text-lg text-charcoal font-bold">
                  {formatPrice(order.total)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default AdminOrders;
