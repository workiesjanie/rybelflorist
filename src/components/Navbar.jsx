import { Link } from 'react-router-dom';
import { Flower2, Menu, ShoppingCart, X } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAdmin } from '../context/AdminContext';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { getCartItemsCount } = useCart();
  const { isAdmin } = useAdmin();

  const links = [
    { to: '/', label: 'Beranda' },
    { to: '/products', label: 'Katalog' },
    ...(isAdmin ? [{ to: '/admin/dashboard', label: 'Admin' }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-soft-brown/20 bg-cream/95 backdrop-blur">
      <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-charcoal">
          <Flower2 className="text-dusty-rose" />
          rybelflorist
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {links.map((link) => (
            <Link key={link.to} to={link.to} className="text-charcoal hover:text-dusty-rose font-medium transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/cart" aria-label="Keranjang" className="relative p-2 text-charcoal hover:text-dusty-rose transition-colors">
            <ShoppingCart />
            <span className="absolute -top-1 -right-1 rounded-full bg-dusty-rose text-white text-xs px-1.5 py-0.2">
              {getCartItemsCount()}
            </span>
          </Link>
          <button className="md:hidden p-2 text-charcoal" onClick={() => setOpen(!open)} aria-label="Buka menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="md:hidden border-t border-soft-brown/15 bg-cream p-4 flex flex-col gap-3">
          {links.map((link) => (
            <Link key={link.to} onClick={() => setOpen(false)} to={link.to} className="text-charcoal font-medium">
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};

export default Navbar;
