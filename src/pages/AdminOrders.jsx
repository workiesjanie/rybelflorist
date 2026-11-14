import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCurrency } from '../context/CurrencyContext';

const statuses = ['pending','confirmed','processing','shipped','delivered','completed','cancelled'];
const AdminOrders = () => {
  const [orders,setOrders] = useState([]); const [error,setError] = useState(''); const [busy,setBusy] = useState(''); const {formatPrice} = useCurrency();
  useEffect(()=>onSnapshot(query(collection(db,'orders'),orderBy('createdAt','desc')),(snap)=>setOrders(snap.docs.map(d=>({id:d.id,...d.data()}))),(err)=>{console.error(err);setError('Tidak dapat memuat pesanan. Pastikan Anda masuk sebagai admin dan Firestore Rules terbaru sudah diterapkan.');}),[]);
  const changeStatus = async (order,status) => {
    setBusy(order.id); setError('');
    try {
      await runTransaction(db,async tx=>{
        const orderRef=doc(db,'orders',order.id); const currentSnap=await tx.get(orderRef);
        if(!currentSnap.exists()) throw new Error('Pesanan tidak ditemukan.');
        const current=currentSnap.data();
        if(current.orderStatus !== order.orderStatus) throw new Error('Status pesanan berubah. Muat ulang lalu coba kembali.');
        const orderItems=current.items||[];
        if(orderItems.some(item=>!Number.isInteger(Number(item.quantity))||Number(item.quantity)<1)) throw new Error('Pesanan memiliki kuantitas tidak valid. Periksa pesanan secara manual.');
        if(status==='confirmed'&&orderItems.some(item=>item.productType==='affiliate'||!item.productId)) throw new Error('Pesanan memiliki item affiliate atau data item tidak lengkap. Konfirmasi hanya item toko yang valid.');
        const productItems=[...(orderItems.filter(item=>item.productType!=='affiliate'&&item.productId).reduce((map,item)=>{
          const previous=map.get(item.productId)||{...item,quantity:0}; previous.quantity+=Number(item.quantity||0); map.set(item.productId,previous); return map;
        },new Map()).values())];
        if(status==='confirmed'&&current.orderStatus==='pending'){
          const productRefs=productItems.map(item=>doc(db,'products',item.productId));
          const productSnaps=[];
          for(const ref of productRefs) productSnaps.push(await tx.get(ref));
          productSnaps.forEach((snap,index)=>{
            if(!snap.exists()) throw new Error(`Produk ${productItems[index].name} sudah tidak tersedia.`);
            const stock=Number(snap.data().stock);
            if(!Number.isInteger(stock)||stock<productItems[index].quantity) throw new Error(`Stok ${productItems[index].name} tidak mencukupi.`);
          });
          productSnaps.forEach((snap,index)=>tx.update(productRefs[index],{stock:Number(snap.data().stock)-Number(productItems[index].quantity)}));
        }
        tx.update(orderRef,{orderStatus:status,status, ...(status==='confirmed'?{confirmedAt:serverTimestamp()}:{}), updatedAt:serverTimestamp()});
      });
    } catch(err){console.error(err);setError(err.message||'Gagal memperbarui status pesanan.');} finally{setBusy('');}
  };
  return <section className="space-y-5"><div><h2 className="text-2xl font-bold">Pesanan</h2><p className="opacity-70">Konfirmasi mengurangi stok toko secara atomik. Status hanya bisa diubah admin.</p></div>
    {error&&<p role="alert" className="p-3 rounded bg-red-100 text-red-900">{error}</p>}
    {!orders.length&&!error&&<div className="card p-8 text-center">Belum ada pesanan.</div>}
    <div className="space-y-4">{orders.map(order=><article key={order.id} className="card p-5"><header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><p className="font-bold">#{order.id.slice(0,8).toUpperCase()} · {order.customer?.name||order.userName}</p><p className="text-sm opacity-70">{order.customer?.phone||order.userEmail} · {order.customer?.method==='pickup'?'Ambil di toko':'Delivery'} · {order.customer?.requestedDate||'Tanggal belum dicatat'}</p></div><select aria-label="Status pesanan" className="input-field sm:max-w-52" value={order.orderStatus||order.status||'pending'} disabled={busy===order.id} onChange={e=>changeStatus(order,e.target.value)}>{statuses.map(status=><option key={status} value={status}>{status}</option>)}</select></header>
      <div className="mt-4 divide-y">{(order.items||[]).map((item,i)=><div key={`${item.productId||item.name}-${i}`} className="py-2 flex justify-between gap-3"><span>{item.name} × {item.quantity}</span><span>{formatPrice(Number(item.price)*Number(item.quantity))}</span></div>)}</div>
      {order.customer?.address&&<p className="mt-3 text-sm">Alamat: {order.customer.address}</p>}{order.customer?.note&&<p className="text-sm">Catatan: {order.customer.note}</p>}{order.customer?.cardMessage&&<p className="text-sm">Ucapan: {order.customer.cardMessage}</p>}
      <div className="mt-3 pt-3 border-t flex justify-between font-bold"><span>Total sementara</span><span>{formatPrice(order.total)}</span></div>
    </article>)}</div></section>;
};
export default AdminOrders;
