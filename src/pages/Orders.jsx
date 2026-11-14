import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';

const Orders = () => {
  const { user } = useAuth(); const { formatPrice } = useCurrency(); const [orders,setOrders]=useState([]); const [error,setError]=useState('');
  useEffect(()=>{if(!user)return; return onSnapshot(query(collection(db,'orders'),where('userId','==',user.uid)),(snap)=>setOrders(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0))),(err)=>{console.error(err);setError('Pesanan belum dapat dimuat. Coba lagi beberapa saat.');});},[user]);
  if(!user)return <main className="max-w-3xl mx-auto px-4 py-16 text-center"><h1 className="text-3xl font-bold">Masuk untuk melihat pesanan</h1><Link to="/login" className="btn-primary inline-block mt-5">Masuk</Link></main>;
  return <main className="max-w-4xl mx-auto px-4 py-10"><h1 className="text-3xl font-bold mb-6">Pesanan Saya</h1>{error&&<p role="alert">{error}</p>}{!orders.length&&!error&&<div className="card p-8 text-center">Belum ada pesanan. <Link className="text-rose-700 underline" to="/products">Lihat katalog</Link></div>}<div className="space-y-4">{orders.map(order=><article key={order.id} className="card p-5"><div className="flex justify-between gap-3"><div><p className="font-bold">#{order.id.slice(0,8).toUpperCase()}</p><p className="text-sm opacity-70">{order.customer?.requestedDate||'Tanggal belum tersedia'} · {order.customer?.method==='pickup'?'Ambil di toko':'Diantar'}</p></div><span className="rounded-full bg-rose-100 text-rose-900 px-3 py-1 h-fit text-sm">{order.orderStatus||order.status||'pending'}</span></div><div className="my-4 divide-y">{(order.items||[]).map((item,i)=><div key={`${item.productId||item.name}-${i}`} className="py-2 flex justify-between gap-3"><span>{item.name} × {item.quantity}</span><span>{formatPrice(Number(item.price)*Number(item.quantity))}</span></div>)}</div><p className="font-bold text-right">Total sementara: {formatPrice(order.total)}</p></article>)}</div></main>;
};
export default Orders;
