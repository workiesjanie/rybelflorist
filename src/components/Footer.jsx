import { Link } from 'react-router-dom';
import { Flower2, Heart, MessageCircle } from 'lucide-react';

const Footer = () => (
  <footer className="mt-16 border-t border-soft-brown/20 bg-cream py-10">
    <div className="max-w-7xl mx-auto px-4 grid sm:grid-cols-3 gap-8">
      <div>
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-charcoal">
          <Flower2 className="text-dusty-rose" /> rybelflorist
        </Link>
        <p className="mt-3 text-charcoal/70 text-sm">
          Buket cantik dan perlengkapan buket pilihan untuk merayakan setiap momen istimewa Anda.
        </p>
      </div>
      <div>
        <h2 className="font-bold text-charcoal">Jelajahi</h2>
        <div className="mt-3 flex flex-col gap-2 text-charcoal/80 text-sm">
          <Link to="/products" className="hover:text-dusty-rose transition-colors">Katalog Buket & Perlengkapan</Link>
          <Link to="/cart" className="hover:text-dusty-rose transition-colors">Keranjang Belanja</Link>
          <Link to="/privacy" className="hover:text-dusty-rose transition-colors">Kebijakan Privasi</Link>
          <Link to="/terms_of_service" className="hover:text-dusty-rose transition-colors">Syarat Layanan</Link>
        </div>
      </div>
      <div>
        <h2 className="font-bold text-charcoal">Pemesanan Mudah</h2>
        <p className="mt-3 flex items-center gap-2 text-charcoal/70 text-sm">
          <MessageCircle size={18} className="text-dusty-rose flex-shrink-0" />
          Pemesanan langsung terhubung via WhatsApp tanpa perlu login/daftar akun.
        </p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 mt-8 pt-5 border-t border-soft-brown/20 text-sm text-charcoal/70 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Heart size={15} className="text-dusty-rose" /> © {new Date().getFullYear()} rybelflorist. All rights reserved.
      </div>
      <Link to="/admin" className="text-xs text-soft-brown/50 hover:text-charcoal transition-colors">Admin Area</Link>
    </div>
  </footer>
);

export default Footer;
