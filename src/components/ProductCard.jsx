import { useState } from 'react';
import { ExternalLink, Heart, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { useProductRating } from '../hooks/useProductRating';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { rating, reviewCount } = useProductRating(product.id);
  const [added, setAdded] = useState(false);
  const affiliate = product.productType === 'affiliate';
  const stock = Number(product.stock || 0);
  const unavailable = product.isActive === false || (!affiliate && stock < 1);
  const inCart = cartItems.find(item => item.id === product.id)?.quantity || 0;
  const image = product.image || product.images?.[0] || '/placeholder-buket.svg';
  const openAffiliate = e => { e.stopPropagation(); if (/^https:\/\//i.test(product.affiliateUrl || '')) window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer'); };
  const add = e => { e.stopPropagation(); if (!affiliate && !unavailable && inCart < stock) { addToCart(product); setAdded(true); setTimeout(()=>setAdded(false),1500); } };
  return <article onClick={()=>navigate(`/product/${product.id}`)} className="card h-full flex flex-col overflow-hidden cursor-pointer">
    <div className="relative h-56 bg-rose-50"><img src={image} alt={product.name} className="w-full h-full object-cover" onError={e=>{e.currentTarget.src='/placeholder-buket.svg';}}/>
      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 text-rose-800 text-xs font-semibold">{affiliate?'Affiliate Shopee':product.category}</span>
      {user && <button aria-label="Simpan ke favorit" onClick={e=>{e.stopPropagation();toggleWishlist(product.id);}} className="absolute top-3 right-3 rounded-full bg-white p-2 text-rose-600"><Heart size={18} fill={isWishlisted(product.id)?'currentColor':'none'}/></button>}
    </div>
    <div className="p-5 flex flex-col flex-1"><p className="text-sm text-rose-700">{product.category}</p><h3 className="font-bold text-xl mt-1">{product.name}</h3><p className="opacity-70 text-sm mt-2 line-clamp-2">{product.description}</p>
      {reviewCount>0 && <p className="text-sm mt-2">★ {rating.toFixed(1)} ({reviewCount} ulasan)</p>}
      <div className="mt-auto pt-4">{affiliate ? <><p className="text-xs text-rose-800 mb-3">Tautan affiliate — kami dapat menerima komisi tanpa biaya tambahan untuk Anda.</p><button onClick={openAffiliate} className="btn-primary w-full inline-flex items-center justify-center gap-2">Lihat di Shopee <ExternalLink size={16}/></button></> : <><div className="flex justify-between items-center mb-3"><strong className="text-xl text-rose-800">{formatPrice(product.price)}</strong><span className="text-sm opacity-70">{unavailable?'Stok habis':`Stok ${stock}`}</span></div><button onClick={add} disabled={unavailable||inCart>=stock} className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"><ShoppingCart size={17}/>{added?'Ditambahkan':unavailable?'Tidak tersedia':'Tambah ke Keranjang'}</button></>}</div>
    </div>
  </article>;
};
export default ProductCard;
