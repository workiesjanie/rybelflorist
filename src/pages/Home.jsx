import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, limit, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight, Sparkles, HeartHandshake, MessageCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      where('isFeatured', '==', true),
      limit(12)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productsData = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter((product) => product.isActive !== false);
        setFeaturedProducts(productsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching featured products:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const scroll = (direction) => {
    if (sliderRef.current) {
      const { scrollLeft, clientWidth } = sliderRef.current;
      const scrollTo =
        direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;

      sliderRef.current.scrollTo({
        left: scrollTo,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 md:py-28 bg-gradient-to-b from-dusty-rose/10 via-cream to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left space-y-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-dusty-rose/20 text-charcoal">
                <Sparkles size={14} className="text-dusty-rose" /> Florist & Bucket Specialist
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-charcoal leading-tight">
                Rangkai Momen Indah Bersama <span className="text-dusty-rose">rybelflorist</span>
              </h1>
              <p className="text-base sm:text-lg text-charcoal/70 leading-relaxed max-w-xl mx-auto md:mx-0">
                Pilihan buket wisuda, ulang tahun, buket artificial, serta rekomendasi perlengkapan buket terbaik dengan pemesanan praktis langsung via WhatsApp.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start pt-2">
                <Link
                  to="/products"
                  className="btn-primary inline-flex items-center justify-center gap-2 py-3 px-6 text-base"
                >
                  <span>Pilih Buket Sekarang</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/cart"
                  className="px-6 py-3 rounded-full border border-soft-brown text-charcoal font-bold hover:bg-soft-brown/10 transition text-center text-base"
                >
                  Cek Keranjang
                </Link>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white aspect-square">
                <img
                  src="/placeholder-buket.svg"
                  alt="Koleksi buket rybelflorist"
                  className="w-full h-full object-cover p-6 bg-cream"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Keunggulan Toko */}
      <section className="py-12 border-y border-soft-brown/15 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="p-3 bg-dusty-rose/10 text-dusty-rose rounded-2xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-bold text-charcoal text-base">Buket Handmade Berkualitas</h3>
              <p className="text-xs text-charcoal/60 mt-1">Dibuat teliti dengan bahan pilihan dan kerapian terjamin.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="p-3 bg-dusty-rose/10 text-dusty-rose rounded-2xl">
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 className="font-bold text-charcoal text-base">Checkout Cepat via WhatsApp</h3>
              <p className="text-xs text-charcoal/60 mt-1">Tanpa perlu akun atau login, langsung konfirmasi dengan penjual.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <div className="p-3 bg-dusty-rose/10 text-dusty-rose rounded-2xl">
              <HeartHandshake size={24} />
            </div>
            <div>
              <h3 className="font-bold text-charcoal text-base">Bahan & Perlengkapan Buket</h3>
              <p className="text-xs text-charcoal/60 mt-1">Rekomendasi kertas cellophane, artificial, dan boneka via Shopee.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-xs uppercase tracking-widest text-dusty-rose font-bold bg-dusty-rose/10 px-3 py-1 rounded-full border border-dusty-rose/20">
              Pilihan Favorit
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal mt-2">
              Buket Unggulan <span className="text-dusty-rose">rybelflorist</span>
            </h2>
            <p className="text-charcoal/60 text-sm sm:text-base mt-2 max-w-lg mx-auto">
              Rangkaian buket favorit yang paling banyak dipesan untuk momen berharga Anda.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-dusty-rose"></div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="relative group">
              {featuredProducts.length >= 4 && (
                <>
                  <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-20 p-3 bg-white border border-soft-brown/25 text-charcoal rounded-full shadow-lg hover:bg-cream transition hidden md:flex items-center justify-center"
                    aria-label="Scroll kiri"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-20 p-3 bg-white border border-soft-brown/25 text-charcoal rounded-full shadow-lg hover:bg-cream transition hidden md:flex items-center justify-center"
                    aria-label="Scroll kanan"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <div
                ref={sliderRef}
                className="flex items-stretch gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory"
              >
                {featuredProducts.map((product) => (
                  <div key={product.id} className="w-64 sm:w-72 md:w-80 flex-shrink-0 snap-center">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  to="/products"
                  className="btn-primary inline-flex items-center justify-center gap-2 py-3 px-8 text-sm"
                >
                  <span>Lihat Semua Katalog</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-soft-brown/15 p-8">
              <ShoppingBag className="w-16 h-16 mx-auto text-dusty-rose/40 mb-3" />
              <h3 className="text-xl font-bold text-charcoal mb-1">Koleksi Buket Segera Hadir</h3>
              <p className="text-charcoal/60 text-sm">
                Produk buket dapat ditambahkan kapan saja dari halaman admin.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-dusty-rose to-dusty-rose-dark text-white text-center px-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-black">Pesan Buket Impian Anda Sekarang</h2>
          <p className="text-white/80 text-sm sm:text-base leading-relaxed">
            Ingin custom buket atau butuh perlengkapan membuat buket sendiri? Langsung pilih produk dan hubungi kami via WhatsApp.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-white text-dusty-rose px-8 py-3.5 rounded-full font-bold hover:bg-cream transition shadow-lg text-sm sm:text-base"
            >
              <span>Mulai Belanja</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
