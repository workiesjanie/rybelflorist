import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot, collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowLeft, Package, ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Toast from '../components/Toast';
import { useCurrency } from '../context/CurrencyContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartItems } = useCart();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [toast, setToast] = useState(null);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    setLoading(true);
    const docRef = doc(db, 'products', id);

    const unsubscribe = onSnapshot(
      docRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() };
          setProduct(productData);

          if (productData.category) {
            try {
              const q = query(
                collection(db, 'products'),
                where('category', '==', productData.category),
                limit(4)
              );
              const querySnapshot = await getDocs(q);
              const related = querySnapshot.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((p) => p.id !== id);
              setRelatedProducts(related);
            } catch (err) {
              console.error('Error fetching related products:', err);
            }
          }
        } else {
          navigate('/products');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to product:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id, navigate]);

  useEffect(() => {
    setActiveImageIdx(0);
    setLightboxOpen(false);
  }, [id]);

  useEffect(() => {
    if (!product) return;
    const imgs = product.images?.length
      ? product.images
      : product.image
      ? [product.image]
      : ['/placeholder-buket.svg'];
    if (imgs.length <= 1) return;

    const handler = (e) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        return;
      }
      if (e.key === 'ArrowRight') {
        if (lightboxOpen) {
          setLightboxIdx((i) => Math.min(i + 1, imgs.length - 1));
        } else {
          setActiveImageIdx((i) => Math.min(i + 1, imgs.length - 1));
        }
      }
      if (e.key === 'ArrowLeft') {
        if (lightboxOpen) {
          setLightboxIdx((i) => Math.max(i - 1, 0));
        } else {
          setActiveImageIdx((i) => Math.max(i - 1, 0));
        }
      }
    };

    window.addEventListener('keydown', handler);
    if (lightboxOpen) document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, product]);

  const handleAddToCart = () => {
    if (product && product.productType !== 'affiliate' && product.isActive !== false) {
      const inCart = cartItems.find((item) => item.id === product.id)?.quantity || 0;
      if (inCart + quantity > (product.stock || 0)) {
        setToast({ message: 'Jumlah melebihi stok yang tersedia', type: 'warning' });
        return;
      }
      addToCart(product, quantity);
      setToast({ message: 'Produk berhasil ditambahkan ke keranjang!', type: 'success' });
    }
  };

  const calculateDiscountedPrice = () => {
    if (product?.discount) {
      return product.price * (1 - product.discount / 100);
    }
    return product?.price || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-cream">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-dusty-rose"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-cream">
        <Package className="w-20 h-20 text-dusty-rose/40 mb-4" />
        <h2 className="text-2xl font-bold text-charcoal mb-2">Produk Tidak Ditemukan</h2>
        <Link to="/products" className="btn-primary mt-4">
          Kembali ke Katalog
        </Link>
      </div>
    );
  }

  const isAffiliate = product.productType === 'affiliate';
  const stock = Number(product.stock || 0);
  const productImages = product.images?.length
    ? product.images
    : product.image
    ? [product.image]
    : ['/placeholder-buket.svg'];
  const safeIdx = Math.min(activeImageIdx, productImages.length - 1);

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="min-h-screen py-8 md:py-12 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-dusty-rose-dark hover:text-charcoal mb-6 font-semibold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Kembali</span>
          </button>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 bg-white p-6 sm:p-8 rounded-3xl border border-soft-brown/15 shadow-sm">
            {/* Gallery */}
            <div className="space-y-4">
              <div
                className="relative rounded-2xl overflow-hidden bg-cream border border-soft-brown/15 cursor-zoom-in group aspect-square flex items-center justify-center"
                onClick={() => {
                  setLightboxIdx(safeIdx);
                  setLightboxOpen(true);
                }}
              >
                <img
                  key={safeIdx}
                  src={productImages[safeIdx] || ''}
                  alt={`${product.name} - view ${safeIdx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-buket.svg';
                  }}
                />

                {product.discount > 0 && (
                  <div className="absolute top-4 left-4 bg-dusty-rose text-white px-3 py-1 rounded-full font-bold text-xs uppercase shadow">
                    Hemat {product.discount}%
                  </div>
                )}

                {productImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((i) => Math.max(i - 1, 0));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-charcoal flex items-center justify-center shadow"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx((i) => Math.min(i + 1, productImages.length - 1));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-charcoal flex items-center justify-center shadow"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
                      {safeIdx + 1} / {productImages.length}
                    </div>
                  </>
                )}
              </div>

              {productImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIdx(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                        idx === safeIdx ? 'border-dusty-rose ring-2 ring-dusty-rose/30' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex flex-col">
              <span className="inline-block self-start bg-dusty-rose/15 text-dusty-rose-dark px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                {isAffiliate ? 'Affiliate Shopee' : (product.category || 'Buket')}
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-charcoal mb-3">
                {product.name}
              </h1>

              {!isAffiliate && (
                <div className="mb-6 flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-charcoal">
                    {formatPrice(calculateDiscountedPrice())}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-lg text-charcoal/50 line-through">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              )}

              {!isAffiliate && (
                <div className="mb-6">
                  {stock > 0 ? (
                    <span className="inline-flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full text-xs font-semibold">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      Tersedia ({stock} stok)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 text-dusty-rose-dark bg-dusty-rose/15 border border-dusty-rose/30 px-3 py-1 rounded-full text-xs font-semibold">
                      Stok Habis
                    </span>
                  )}
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider mb-2">Deskripsi Produk</h3>
                <p className="text-charcoal/70 leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>

              <div className="mt-auto pt-6 border-t border-soft-brown/15">
                {isAffiliate ? (
                  <div className="space-y-3">
                    <p className="text-xs text-dusty-rose-dark bg-cream p-3 rounded-xl border border-soft-brown/15">
                      Produk ini adalah produk rekomendasi perlengkapan buket melalui Shopee. Klik tombol di bawah untuk membeli langsung di Shopee.
                    </p>
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3 text-base"
                    >
                      Beli di Shopee <ExternalLink size={18} />
                    </a>
                  </div>
                ) : (
                  <div>
                    {stock > 0 && (
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-semibold text-charcoal">Jumlah:</span>
                        <div className="flex items-center border border-soft-brown/20 rounded-xl overflow-hidden bg-cream">
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="px-3 py-1.5 text-charcoal hover:bg-soft-brown/15 font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="px-4 py-1.5 font-bold text-charcoal text-sm">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
                            className="px-3 py-1.5 text-charcoal hover:bg-soft-brown/15 font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={stock === 0}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span>{stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-charcoal mb-6">Produk Terkait</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (() => {
        const safeLbIdx = Math.min(lightboxIdx, productImages.length - 1);
        return (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxOpen(false)}
          >
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white"
              aria-label="Tutup"
            >
              <X className="w-8 h-8" />
            </button>

            {productImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(Math.max(safeLbIdx - 1, 0));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(Math.min(safeLbIdx + 1, productImages.length - 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
              <img
                src={productImages[safeLbIdx]}
                alt="Lightbox view"
                className="max-w-full max-h-[85vh] object-contain rounded-xl"
              />
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default ProductDetails;
