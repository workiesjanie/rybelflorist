import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const OrderSuccess = () => {
  const { state } = useLocation(); const { formatPrice } = useCurrency();
  return <main className="max-w-2xl mx-auto px-4 py-16 text-center"><CheckCircle2 className="mx-auto text-emerald-600" size={64}/><h1 className="text-3xl font-bold mt-5">Pesanan berhasil dicatat</h1><p className="mt-3 opacity-75">Status pesanan saat ini <strong>pending</strong>. Admin akan memeriksa harga, stok, serta ongkir dan mengonfirmasi melalui WhatsApp.</p>{state?.orderId&&<div className="card p-5 mt-7 text-left"><p>Nomor pesanan: <strong>#{state.orderId.slice(0,8).toUpperCase()}</strong></p><p className="mt-2">Total sementara: <strong>{formatPrice(state.orderTotal)}</strong></p></div>}{state?.whatsappUrl&&<a href={state.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 mt-6"><MessageCircle size={18}/>Lanjutkan ke WhatsApp</a>}<p className="mt-5 flex justify-center items-center gap-2 text-sm opacity-70"><MessageCircle size={17}/> Jika tab WhatsApp tidak terbuka, gunakan tombol di atas.</p><div className="mt-8 flex justify-center gap-3"><Link to="/orders" className="btn-primary">Pesanan saya</Link><Link to="/products" className="btn-secondary px-5 py-3">Kembali ke katalog</Link></div></main>;
};
export default OrderSuccess;
