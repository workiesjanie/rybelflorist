import { Link } from 'react-router-dom';
import { Flower2, Menu, ShoppingBag, ShoppingCart, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAdmin } from '../context/AdminContext';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { getCartItemsCount } = useCart();
  const { isAdmin } = useAdmin();
  const links = [{ to: '/', label: 'Beranda' }, { to: '/products', label: 'Katalog' }, ...(user ? [{ to: '/orders', label: 'Pesanan' }, { to: '/profile', label: 'Profil' }] : []), ...(isAdmin ? [{ to: '/admin/dashboard', label: 'Admin' }] : [])];
  return <header className="sticky top-0 z-50 border-b border-rose-200 bg-white/95 backdrop-blur">
    <nav className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-rose-800"><Flower2 className="text-rose-500"/>Buket Bahagia</Link>
      <div className="hidden md:flex items-center gap-6">{links.map(link=><Link key={link.to} to={link.to} className="text-rose-900 hover:text-rose-600">{link.label}</Link>)}</div>
      <div className="flex items-center gap-2"><Link to="/cart" aria-label="Keranjang" className="relative p-2 text-rose-800"><ShoppingCart/><span className="absolute -top-1 -right-1 rounded-full bg-rose-500 text-white text-xs px-1.5">{getCartItemsCount()}</span></Link>{user ? <button onClick={signOut} className="hidden sm:block text-sm text-rose-800">Keluar</button> : <Link to="/login" className="hidden sm:flex items-center gap-1 text-rose-800"><UserRound size={18}/> Masuk</Link>}<button className="md:hidden p-2" onClick={()=>setOpen(!open)} aria-label="Buka menu">{open?<X/>:<Menu/>}</button></div>
    </nav>
    {open && <div className="md:hidden border-t border-rose-100 bg-white p-4 flex flex-col gap-3">{links.map(link=><Link key={link.to} onClick={()=>setOpen(false)} to={link.to}>{link.label}</Link>)}{!user&&<Link to="/login" onClick={()=>setOpen(false)}>Masuk</Link>}{user&&<button className="text-left" onClick={signOut}>Keluar</button>}</div>}
  </header>;
};
export default Navbar;
