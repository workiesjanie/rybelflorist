import { Link } from 'react-router-dom';
import { Flower2, Heart, MessageCircle } from 'lucide-react';

const Footer = () => <footer className="mt-16 border-t border-rose-200 bg-rose-50/80 py-10">
  <div className="max-w-7xl mx-auto px-4 grid sm:grid-cols-3 gap-8">
    <div><Link to="/" className="flex items-center gap-2 text-2xl font-bold text-rose-800"><Flower2/> Buket Bahagia</Link><p className="mt-3 text-rose-900/70">Buket dan hadiah kecil untuk merayakan cerita istimewa.</p></div>
    <div><h2 className="font-bold text-rose-900">Jelajahi</h2><div className="mt-3 flex flex-col gap-2"><Link to="/products">Katalog buket</Link><Link to="/orders">Pesanan saya</Link><Link to="/privacy">Kebijakan privasi</Link><Link to="/terms_of_service">Syarat layanan</Link></div></div>
    <div><h2 className="font-bold text-rose-900">Ada yang ingin ditanyakan?</h2><p className="mt-3 flex items-center gap-2 text-rose-900/70"><MessageCircle size={18}/> Hubungi kami saat checkout melalui WhatsApp.</p></div>
  </div><div className="max-w-7xl mx-auto px-4 mt-8 pt-5 border-t border-rose-200 text-sm text-rose-800/70 flex items-center gap-2"><Heart size={15}/> © {new Date().getFullYear()} Buket Bahagia</div>
</footer>;
export default Footer;
