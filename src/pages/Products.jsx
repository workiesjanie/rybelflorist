import { useState, useEffect, Fragment } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Search, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';

const sortOptions = [
  { value: 'featured', label: 'Terbaru' },
  { value: 'price-low', label: 'Harga: Terendah' },
  { value: 'price-high', label: 'Harga: Tertinggi' },
];

const Products = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 2000000 },
    productType: 'all',
    inStockOnly: false,
    onSaleOnly: false,
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        const productsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setAllProducts(productsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to products:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredProducts = allProducts
    .filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        product.category === selectedCategory ||
        product.categoryId === selectedCategory;

      const matchesSearch =
        (product.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description || '').toLowerCase().includes(searchQuery.toLowerCase());

      const productPrice = Number(product.price) || 0;
      const matchesPrice =
        product.productType === 'affiliate' ||
        (productPrice >= (filters.priceRange?.min || 0) &&
          productPrice <= (filters.priceRange?.max || 2000000));

      const matchesType =
        !filters.productType ||
        filters.productType === 'all' ||
        (filters.productType === 'affiliate' && product.productType === 'affiliate') ||
        (filters.productType === 'store' && product.productType !== 'affiliate');

      const matchesStock =
        !filters.inStockOnly || product.productType === 'affiliate' || Number(product.stock) > 0;

      const matchesSale = !filters.onSaleOnly || product.discount > 0;

      return (
        product.isActive !== false &&
        matchesCategory &&
        matchesSearch &&
        matchesPrice &&
        matchesType &&
        matchesStock &&
        matchesSale
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0);
        case 'price-high':
          return (b.price || 0) - (a.price || 0);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-cream py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 md:mb-10 text-center">
          <span className="text-xs uppercase tracking-widest text-dusty-rose font-bold bg-dusty-rose/10 px-3 py-1 rounded-full border border-dusty-rose/20">
            Katalog Produk
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-charcoal mt-3">
            Buket & Perlengkapan <span className="text-dusty-rose">rybelflorist</span>
          </h1>
          <p className="text-charcoal/60 mt-2 text-sm sm:text-base max-w-xl mx-auto">
            Temukan buket siap kirim untuk momen spesial atau perlengkapan bahan buket untuk kreasi Anda sendiri.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8 max-w-xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-dusty-rose w-5 h-5" />
            <input
              type="text"
              placeholder="Cari buket wisuda, mawar, kertas cellophane, dll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-soft-brown/25 rounded-2xl text-charcoal placeholder-charcoal/40 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30 shadow-sm"
            />
          </div>
        </div>

        {/* Mobile Filter Drawer */}
        <FilterSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          products={allProducts}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onFilterChange={setFilters}
          mobileOnly={true}
        />

        {/* Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Filter */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <FilterSidebar
              isOpen={true}
              onClose={() => {}}
              products={allProducts}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              onFilterChange={setFilters}
            />
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6 bg-white p-3 sm:p-4 rounded-2xl border border-soft-brown/15 shadow-sm">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 bg-dusty-rose/10 text-dusty-rose-dark rounded-xl text-xs font-bold border border-dusty-rose/20"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filter</span>
              </button>

              <p className="text-xs sm:text-sm text-charcoal/70 font-medium">
                Menampilkan <strong className="text-dusty-rose-dark">{filteredProducts.length}</strong> produk
              </p>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs sm:text-sm bg-cream border border-soft-brown/20 text-charcoal rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-dusty-rose/30"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-dusty-rose"></div>
              </div>
            ) : (
              <Fragment>
                {filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredProducts.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-3xl border border-soft-brown/15 p-8">
                    <Search className="w-16 h-16 mx-auto text-dusty-rose/40 mb-3" />
                    <h3 className="text-xl font-bold text-charcoal mb-1">Produk Tidak Ditemukan</h3>
                    <p className="text-charcoal/60 text-sm">
                      Coba ganti kata kunci atau reset filter pencarian Anda.
                    </p>
                  </div>
                )}
              </Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
