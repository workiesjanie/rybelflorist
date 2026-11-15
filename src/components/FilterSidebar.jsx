import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { X, Tag, DollarSign, Filter } from 'lucide-react';
import { useCurrency } from '../context/CurrencyContext';

const FilterSidebar = ({
  isOpen,
  onClose,
  products = [],
  onFilterChange,
  selectedCategory,
  onCategoryChange,
  mobileOnly = false,
}) => {
  const [categories, setCategories] = useState(['All']);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 2000000 });
  const [selectedPriceRange, setSelectedPriceRange] = useState({ min: 0, max: 2000000 });
  const [productType, setProductType] = useState('all'); // all, store, affiliate
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const fetched = snapshot.docs.map((d) => d.data().name).filter(Boolean);
        setCategories(['All', ...fetched]);
      },
      (error) => console.error('Error loading categories:', error)
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map((p) => Number(p.price) || 0).filter((p) => p > 0);
      if (prices.length > 0) {
        const minPrice = Math.floor(Math.min(...prices));
        const maxPrice = Math.ceil(Math.max(...prices));
        setPriceRange({ min: minPrice, max: maxPrice });
        setSelectedPriceRange({ min: minPrice, max: maxPrice });
      }
    }
  }, [products]);

  useEffect(() => {
    const filters = {
      priceRange: selectedPriceRange,
      productType,
      inStockOnly,
      onSaleOnly,
    };
    onFilterChange?.(filters);
  }, [selectedPriceRange, productType, inStockOnly, onSaleOnly]);

  const clearAllFilters = () => {
    setSelectedPriceRange(priceRange);
    setProductType('all');
    setInStockOnly(false);
    setOnSaleOnly(false);
    onCategoryChange?.('All');
  };

  const content = (
    <div className="bg-white rounded-2xl border border-soft-brown/15 p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-soft-brown/15">
        <div className="flex items-center gap-2 text-charcoal font-bold text-lg">
          <Filter className="w-5 h-5 text-dusty-rose" />
          <span>Filter Produk</span>
        </div>
        <button
          onClick={clearAllFilters}
          className="text-xs text-dusty-rose hover:text-dusty-rose-dark font-semibold transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Tipe Produk */}
      <div>
        <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider mb-3">Tipe Produk</h4>
        <div className="grid grid-cols-3 gap-1 bg-cream p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setProductType('all')}
            className={`py-1.5 rounded-lg transition ${
              productType === 'all' ? 'bg-white text-dusty-rose-dark shadow-sm' : 'text-charcoal/70'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setProductType('store')}
            className={`py-1.5 rounded-lg transition ${
              productType === 'store' ? 'bg-white text-dusty-rose-dark shadow-sm' : 'text-charcoal/70'
            }`}
          >
            Buket
          </button>
          <button
            type="button"
            onClick={() => setProductType('affiliate')}
            className={`py-1.5 rounded-lg transition ${
              productType === 'affiliate' ? 'bg-white text-dusty-rose-dark shadow-sm' : 'text-charcoal/70'
            }`}
          >
            Shopee
          </button>
        </div>
      </div>

      {/* Kategori */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-charcoal">
          <Tag className="w-4 h-4 text-dusty-rose" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Kategori</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onCategoryChange?.(category)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                selectedCategory === category
                  ? 'bg-dusty-rose text-white shadow-sm'
                  : 'bg-cream text-charcoal hover:bg-soft-brown/10'
              }`}
            >
              {category === 'All' ? 'Semua Kategori' : category}
            </button>
          ))}
        </div>
      </div>

      {/* Rentang Harga */}
      <div>
        <div className="flex items-center gap-2 mb-3 text-charcoal">
          <DollarSign className="w-4 h-4 text-dusty-rose" />
          <h4 className="text-xs font-bold uppercase tracking-wider">Maksimal Harga</h4>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold text-charcoal">
            <span>{formatPrice(priceRange.min)}</span>
            <span className="bg-cream px-2 py-1 rounded-md text-charcoal">{formatPrice(selectedPriceRange.max)}</span>
          </div>
          <input
            type="range"
            min={priceRange.min}
            max={priceRange.max || 1000000}
            step={5000}
            value={selectedPriceRange.max}
            onChange={(e) =>
              setSelectedPriceRange((prev) => ({
                ...prev,
                max: Number(e.target.value),
              }))
            }
            className="w-full accent-[#D9A6A0] cursor-pointer"
          />
        </div>
      </div>

      {/* Filter Cepat */}
      <div className="pt-4 border-t border-soft-brown/15 space-y-2">
        <label className="flex items-center justify-between text-xs font-semibold text-charcoal cursor-pointer p-2 rounded-lg hover:bg-cream">
          <span>Hanya Stok Tersedia</span>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded accent-[#D9A6A0] focus:ring-dusty-rose"
          />
        </label>
        <label className="flex items-center justify-between text-xs font-semibold text-charcoal cursor-pointer p-2 rounded-lg hover:bg-cream">
          <span>Sedang Diskon</span>
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={(e) => setOnSaleOnly(e.target.checked)}
            className="rounded accent-[#D9A6A0] focus:ring-dusty-rose"
          />
        </label>
      </div>
    </div>
  );

  if (mobileOnly) {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-50 flex lg:hidden bg-black/40 backdrop-blur-sm">
        <div className="w-4/5 max-w-xs bg-cream h-full p-4 overflow-y-auto shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-end mb-2">
              <button onClick={onClose} className="p-1 text-charcoal/60 hover:text-charcoal">
                <X className="w-6 h-6" />
              </button>
            </div>
            {content}
          </div>
          <button
            onClick={onClose}
            className="btn-primary w-full mt-4 py-2.5 text-center text-sm"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    );
  }

  return content;
};

export default FilterSidebar;
