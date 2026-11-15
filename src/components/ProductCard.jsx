import { useState } from 'react';
import { ExternalLink, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const { formatPrice } = useCurrency();
  const [added, setAdded] = useState(false);

  const affiliate = product.productType === 'affiliate';
  const stock = Number(product.stock || 0);
  const unavailable = product.isActive === false || (!affiliate && stock < 1);
  const inCart = cartItems.find((item) => item.id === product.id)?.quantity || 0;
  const image = product.image || product.images?.[0] || '/placeholder-buket.svg';

  const openAffiliate = (e) => {
    e.stopPropagation();
    if (/^https:\/\//i.test(product.affiliateUrl || '')) {
      window.open(product.affiliateUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const add = (e) => {
    e.stopPropagation();
    if (!affiliate && !unavailable && inCart < stock) {
      addToCart(product);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <article
      onClick={() => navigate(`/product/${product.id}`)}
      className="card h-full flex flex-col overflow-hidden cursor-pointer hover:shadow-lg transition duration-200 border border-soft-brown/15 rounded-2xl bg-white"
    >
      <div className="relative h-56 bg-cream">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = '/placeholder-buket.svg';
          }}
        />
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 text-charcoal text-xs font-semibold shadow-sm">
          {affiliate ? 'Affiliate Shopee' : (product.category || 'Buket')}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs uppercase tracking-wider font-semibold text-dusty-rose">{product.category}</p>
        <h3 className="font-bold text-lg text-charcoal mt-1 line-clamp-1">{product.name}</h3>
        <p className="text-charcoal/60 text-sm mt-2 line-clamp-2">{product.description}</p>

        <div className="mt-auto pt-4">
          {affiliate ? (
            <>
              <p className="text-[11px] text-soft-brown mb-3 bg-cream p-2 rounded-lg border border-soft-brown/15">
                Tautan Shopee — kami dapat menerima komisi tanpa biaya tambahan untuk Anda.
              </p>
              <button
                onClick={openAffiliate}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                Beli di Shopee <ExternalLink size={16} />
              </button>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-3">
                <strong className="text-xl font-bold text-charcoal">{formatPrice(product.price)}</strong>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${unavailable ? 'bg-dusty-rose/15 text-dusty-rose-dark' : 'bg-green-50 text-green-700'}`}>
                  {unavailable ? 'Habis' : `Stok: ${stock}`}
                </span>
              </div>
              <button
                onClick={add}
                disabled={unavailable || inCart >= stock}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingCart size={17} />
                {added ? 'Ditambahkan' : unavailable ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
