import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Settings as SettingsIcon, Users, Mail, Crown, UserX, RefreshCw, Shield, Lock, Truck, Save, Image } from 'lucide-react';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { logActivity } from '../utils/logActivity';

const AdminSettings = () => {
    const [toast, setToast] = useState(null);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { userProfile } = useAuth();
    const adminInfo = { uid: userProfile?.uid, name: userProfile?.displayName, email: userProfile?.email };

    // Shipping settings
    const [shippingForm, setShippingForm] = useState({ flatFee: 0, freeThreshold: 0 });
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingSaving, setShippingSaving] = useState(false);

    // Footer settings
    const [footerForm, setFooterForm] = useState({
        description: 'Buket dan hadiah kecil untuk merayakan cerita istimewa.',
        address: 'Alamat toko belum diatur',
        phone: '',
        email: '',
        facebook: '',
        instagram: '',
        telegram: '',
        tiktok: ''
    });
    const [footerLoading, setFooterLoading] = useState(false);
    const [footerSaving, setFooterSaving] = useState(false);

    // Hero banner settings
    const [heroForm, setHeroForm] = useState({
        titleLine1: 'Rangkai Momen',
        titleLine2: 'Penuh Bahagia',
        subtitle: 'Buket istimewa untuk hari yang ingin dirayakan.',
        bgImageUrl: '',
        heroImageUrl: '/placeholder-buket.svg',
    });
    const [heroLoading, setHeroLoading] = useState(false);
    const [heroSaving, setHeroSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchShippingSettings();
        fetchFooterSettings();
        fetchHeroSettings();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true);
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersData);
        } catch (error) {
            console.error('Error fetching users:', error);
            setToast({ message: 'Gagal memuat pengguna', type: 'error' });
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchHeroSettings = async () => {
        setHeroLoading(true);
        try {
            const snap = await getDoc(doc(db, 'settings', 'hero'));
            if (snap.exists()) setHeroForm(prev => ({ ...prev, ...snap.data() }));
        } catch (e) {
            console.error('Failed to load hero settings:', e);
        } finally {
            setHeroLoading(false);
        }
    };

    const saveHeroSettings = async () => {
        setHeroSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'hero'), heroForm, { merge: true });
            await logActivity({
                type: 'settings', icon: 'Settings',
                title: 'Hero Banner Updated',
                description: 'Homepage hero banner content and images modified',
                color: 'cyan',
                admin: adminInfo
            });
            setToast({ message: 'Hero banner berhasil disimpan!', type: 'success' });
        } catch (e) {
            console.error('Failed to save hero settings:', e);
            setToast({ message: 'Gagal menyimpan hero banner', type: 'error' });
        } finally {
            setHeroSaving(false);
        }
    };

    const fetchFooterSettings = async () => {
        setFooterLoading(true);
        try {
            const snap = await getDoc(doc(db, 'settings', 'footer'));
            if (snap.exists()) {
                setFooterForm(prev => ({ ...prev, ...snap.data() }));
            }
        } catch (e) {
            console.error('Failed to load footer settings:', e);
        } finally {
            setFooterLoading(false);
        }
    };

    const saveFooterSettings = async () => {
        setFooterSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'footer'), footerForm, { merge: true });
            await logActivity({
                type: 'settings', icon: 'Settings',
                title: 'Footer Settings Updated',
                description: 'Footer brand info and contact details modified',
                color: 'magenta',
                admin: adminInfo
            });
            setToast({ message: 'Pengaturan footer berhasil disimpan!', type: 'success' });
        } catch (e) {
            console.error('Failed to save footer settings:', e);
            setToast({ message: 'Gagal menyimpan pengaturan footer', type: 'error' });
        } finally {
            setFooterSaving(false);
        }
    };

    const fetchShippingSettings = async () => {
        setShippingLoading(true);
        try {
            const snap = await getDoc(doc(db, 'settings', 'shipping'));
            if (snap.exists()) {
                const d = snap.data();
                setShippingForm({
                    flatFee: d.flatFee ?? 0,
                    freeThreshold: d.freeThreshold ?? 0,
                });
            }
        } catch (e) {
            console.error('Failed to load shipping settings:', e);
        } finally {
            setShippingLoading(false);
        }
    };

    const saveShippingSettings = async () => {
        const flatFee = parseFloat(shippingForm.flatFee);
        const freeThreshold = parseFloat(shippingForm.freeThreshold);
        if (isNaN(flatFee) || flatFee < 0) {
            setToast({ message: 'Biaya kirim harus berupa angka valid', type: 'error' });
            return;
        }
        if (isNaN(freeThreshold) || freeThreshold < 0) {
            setToast({ message: 'Batas gratis ongkir harus berupa angka valid', type: 'error' });
            return;
        }
        setShippingSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'shipping'), { flatFee, freeThreshold }, { merge: true });
            setShippingForm({ flatFee, freeThreshold });
            await logActivity({
                type: 'settings', icon: 'Settings',
                title: 'Shipping Settings Updated',
                description: `Biaya kirim: Rp${flatFee} · Gratis di atas Rp${freeThreshold}`,
                color: 'yellow',
                admin: adminInfo
            });
            setToast({ message: 'Pengaturan ongkir berhasil disimpan!', type: 'success' });
        } catch (e) {
            console.error('Failed to save shipping settings:', e);
            setToast({ message: 'Gagal menyimpan pengaturan ongkir', type: 'error' });
        } finally {
            setShippingSaving(false);
        }
    };

    const toggleAdminAccess = async (userId, currentStatus) => {
        try {
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, { isAdmin: !currentStatus });
            const targetUser = users.find(u => u.id === userId);
            setUsers(users.map(user =>
                user.id === userId ? { ...user, isAdmin: !currentStatus } : user
            ));
            await logActivity({
                type: 'settings', icon: 'Settings',
                title: !currentStatus ? 'Admin Access Granted' : 'Admin Access Revoked',
                description: `${targetUser?.displayName || targetUser?.email || userId} — admin ${!currentStatus ? 'granted' : 'revoked'}`,
                color: !currentStatus ? 'cyan' : 'red',
                admin: adminInfo
            });
            setToast({
                message: `Hak akses admin berhasil ${!currentStatus ? 'diberikan' : 'dicabut'}!`,
                type: 'success'
            });
        } catch (error) {
            console.error('Error updating admin access:', error);
            setToast({ message: 'Gagal memperbarui hak akses admin', type: 'error' });
        }
    };

    const filtered = users.filter(u =>
        u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const adminCount = users.filter(u => u.isAdmin).length;

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="space-y-4 md:space-y-6">
                {/* Header */}
                <div className="hidden md:block bg-white rounded-2xl p-8 border border-soft-brown/15 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 rounded-2xl bg-dusty-rose/10 border border-dusty-rose/20 flex items-center justify-center">
                                <SettingsIcon className="w-8 h-8 text-dusty-rose" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-extrabold text-charcoal mb-1">
                                    Pengaturan
                                </h1>
                                <p className="text-charcoal/60 text-sm font-medium">
                                    Manajemen Akses, Ongkos Kirim, dan Tampilan Toko
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={fetchUsers}
                            disabled={loadingUsers}
                            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-cream hover:bg-soft-brown/10 text-charcoal font-semibold rounded-xl border border-soft-brown/25 transition-all text-xs"
                        >
                            <RefreshCw className={`w-4 h-4 text-dusty-rose ${loadingUsers ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                    {[
                        { label: 'Total Pengguna', value: users.length },
                        { label: 'Admin', value: adminCount },
                        { label: 'Pelanggan', value: users.length - adminCount },
                    ].map(({ label, value }) => (
                        <div key={label} className="bg-white rounded-2xl p-5 border border-soft-brown/15 shadow-sm">
                            <p className="text-2xl md:text-3xl font-extrabold text-charcoal">
                                {value}
                            </p>
                            <p className="text-charcoal/60 text-xs font-semibold uppercase tracking-wider mt-1">
                                {label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* User Management Panel */}
                <div className="bg-white rounded-2xl border border-soft-brown/15 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-5 border-b border-soft-brown/10 bg-cream/50 gap-4">
                        <div className="flex items-center space-x-3">
                            <Shield className="w-5 h-5 text-dusty-rose" />
                            <h2 className="text-base font-bold text-charcoal">
                                Manajemen Pengguna & Hak Akses
                            </h2>
                        </div>

                        <div className="relative w-full sm:w-64">
                            <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-brown" />
                            <input
                                type="text"
                                placeholder="Cari pengguna..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-dusty-rose text-xs font-medium"
                            />
                        </div>
                    </div>

                    <div className="relative z-10">
                        {loadingUsers ? (
                            <div className="text-center py-16">
                                <div className="w-10 h-10 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-charcoal/60 text-xs font-semibold">
                                    Memuat Data Pengguna...
                                </p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-16">
                                <Users className="w-12 h-12 text-dusty-rose/40 mx-auto mb-3" />
                                <p className="text-charcoal font-semibold text-sm">
                                    {searchQuery ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full hidden md:table">
                                    <thead className="bg-cream border-b border-soft-brown/10">
                                        <tr>
                                            {['Pengguna', 'Email', 'Peran', 'Aksi'].map(h => (
                                                <th key={h} className="px-6 py-3.5 text-left text-xs font-bold text-charcoal/60 uppercase tracking-wider">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-soft-brown/10">
                                        {filtered.map((u) => {
                                            const isSelf = u.id === userProfile?.uid;
                                            return (
                                                <tr key={u.id} className="hover:bg-cream/40 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-9 h-9 rounded-xl bg-dusty-rose/15 text-dusty-rose-dark flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                                {u.displayName?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || 'U'}
                                                            </div>
                                                            <p className="font-semibold text-charcoal text-sm">
                                                                {u.displayName || <span className="text-charcoal/40 italic">Tanpa Nama</span>}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-2 text-xs text-charcoal/70">
                                                            <Mail className="w-4 h-4 text-soft-brown flex-shrink-0" />
                                                            <span>{u.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {u.isAdmin ? (
                                                            <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                                <Crown className="w-3 h-3" />
                                                                <span>Admin</span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-cream text-charcoal/60 border border-soft-brown/20">
                                                                Pelanggan
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => !isSelf && toggleAdminAccess(u.id, u.isAdmin)}
                                                            disabled={isSelf}
                                                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                                                                isSelf
                                                                    ? 'bg-cream text-charcoal/40 cursor-not-allowed'
                                                                    : u.isAdmin
                                                                    ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                                                    : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                                                            }`}
                                                        >
                                                            {isSelf ? (
                                                                <><Lock className="w-3.5 h-3.5" /><span>Anda</span></>
                                                            ) : u.isAdmin ? (
                                                                <><UserX className="w-3.5 h-3.5" /><span>Cabut Admin</span></>
                                                            ) : (
                                                                <><Crown className="w-3.5 h-3.5" /><span>Jadikan Admin</span></>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Mobile List */}
                                <div className="md:hidden divide-y divide-soft-brown/10">
                                    {filtered.map((u) => {
                                        const isSelf = u.id === userProfile?.uid;
                                        return (
                                            <div key={u.id} className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-semibold text-charcoal text-sm">
                                                            {u.displayName || <span className="text-charcoal/40 italic">Tanpa Nama</span>}
                                                        </p>
                                                        <p className="text-xs text-charcoal/60">{u.email}</p>
                                                    </div>
                                                    <div>
                                                        {u.isAdmin ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                                Admin
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cream text-charcoal/60 border border-soft-brown/20">
                                                                Customer
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => !isSelf && toggleAdminAccess(u.id, u.isAdmin)}
                                                    disabled={isSelf}
                                                    className={`w-full py-2 rounded-xl text-xs font-semibold ${
                                                        isSelf
                                                            ? 'bg-cream text-charcoal/40 cursor-not-allowed'
                                                            : u.isAdmin
                                                            ? 'bg-red-50 text-red-700 border border-red-200'
                                                            : 'bg-green-50 text-green-700 border border-green-200'
                                                    }`}
                                                >
                                                    {isSelf ? 'Anda (Akun Saat Ini)' : u.isAdmin ? 'Cabut Admin' : 'Jadikan Admin'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Shipping Settings */}
                <div className="bg-white rounded-2xl border border-soft-brown/15 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-soft-brown/10 bg-cream/50">
                        <div className="flex items-center space-x-3">
                            <Truck className="w-5 h-5 text-dusty-rose" />
                            <h2 className="text-base font-bold text-charcoal">
                                Pengaturan Ongkos Kirim
                            </h2>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {shippingLoading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                                            Biaya Kirim Tetap (Rupiah)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={shippingForm.flatFee}
                                            onChange={e => setShippingForm(prev => ({ ...prev, flatFee: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-cream border border-soft-brown/20 rounded-xl text-charcoal font-bold text-base focus:outline-none focus:border-dusty-rose"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
                                            Batas Gratis Ongkir (Rupiah, 0 = nonaktif)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={shippingForm.freeThreshold}
                                            onChange={e => setShippingForm(prev => ({ ...prev, freeThreshold: e.target.value }))}
                                            className="w-full px-4 py-2.5 bg-cream border border-soft-brown/20 rounded-xl text-charcoal font-bold text-base focus:outline-none focus:border-dusty-rose"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-cream rounded-xl border border-soft-brown/15 text-xs text-charcoal/70">
                                    <span className="font-bold text-charcoal">Pratinjau: </span>
                                    Ongkir sementara Rp{parseFloat(shippingForm.flatFee) || 0}. Gratis jika subtotal mencapai Rp{parseFloat(shippingForm.freeThreshold) || 0}.
                                </div>

                                <button
                                    onClick={saveShippingSettings}
                                    disabled={shippingSaving}
                                    className="btn-primary inline-flex items-center gap-2 text-xs"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{shippingSaving ? 'Menyimpan...' : 'Simpan Pengaturan Ongkir'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Footer Brand Info */}
                <div className="bg-white rounded-2xl border border-soft-brown/15 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-soft-brown/10 bg-cream/50">
                        <h2 className="text-base font-bold text-charcoal">
                            Informasi Kontak & Footer
                        </h2>
                    </div>

                    <div className="p-6 space-y-4">
                        {footerLoading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">
                                        Deskripsi Brand
                                    </label>
                                    <textarea
                                        value={footerForm.description}
                                        onChange={e => setFooterForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-cream border border-soft-brown/20 rounded-xl text-charcoal px-4 py-2.5 text-xs font-medium resize-none focus:outline-none focus:border-dusty-rose"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">Alamat Toko</label>
                                        <input
                                            type="text"
                                            value={footerForm.address}
                                            onChange={e => setFooterForm(prev => ({ ...prev, address: e.target.value }))}
                                            className="w-full bg-cream border border-soft-brown/20 rounded-xl text-charcoal px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">No. Telepon / WhatsApp</label>
                                        <input
                                            type="text"
                                            value={footerForm.phone}
                                            onChange={e => setFooterForm(prev => ({ ...prev, phone: e.target.value }))}
                                            className="w-full bg-cream border border-soft-brown/20 rounded-xl text-charcoal px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">Email Toko</label>
                                        <input
                                            type="email"
                                            value={footerForm.email}
                                            onChange={e => setFooterForm(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-cream border border-soft-brown/20 rounded-xl text-charcoal px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={saveFooterSettings}
                                    disabled={footerSaving}
                                    className="btn-primary inline-flex items-center gap-2 text-xs"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{footerSaving ? 'Menyimpan...' : 'Simpan Pengaturan Footer'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Hero Banner Settings */}
                <div className="bg-white rounded-2xl border border-soft-brown/15 shadow-sm overflow-hidden">
                    <div className="flex items-center space-x-3 px-6 py-5 border-b border-soft-brown/10 bg-cream/50">
                        <Image className="w-5 h-5 text-dusty-rose" />
                        <h2 className="text-base font-bold text-charcoal">
                            Banner Utama (Hero Banner)
                        </h2>
                    </div>

                    <div className="p-6 space-y-4">
                        {heroLoading ? (
                            <div className="text-center py-8">
                                <div className="w-8 h-8 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin mx-auto"></div>
                            </div>
                        ) : (
                            <>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">Judul Baris 1</label>
                                        <input
                                            type="text"
                                            value={heroForm.titleLine1}
                                            onChange={e => setHeroForm(prev => ({ ...prev, titleLine1: e.target.value }))}
                                            className="w-full bg-cream border border-soft-brown/20 rounded-xl text-charcoal px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">Judul Baris 2 (Sorotan)</label>
                                        <input
                                            type="text"
                                            value={heroForm.titleLine2}
                                            onChange={e => setHeroForm(prev => ({ ...prev, titleLine2: e.target.value }))}
                                            className="w-full bg-cream border border-soft-brown/20 rounded-xl text-charcoal px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">Deskripsi / Subtitle</label>
                                    <textarea
                                        value={heroForm.subtitle}
                                        onChange={e => setHeroForm(prev => ({ ...prev, subtitle: e.target.value }))}
                                        className="w-full bg-cream border border-soft-brown/20 rounded-xl text-charcoal px-4 py-2.5 text-xs font-medium resize-none focus:outline-none focus:border-dusty-rose"
                                        rows={2}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">URL Gambar Hero</label>
                                    <input
                                        type="text"
                                        value={heroForm.heroImageUrl}
                                        onChange={e => setHeroForm(prev => ({ ...prev, heroImageUrl: e.target.value }))}
                                        className="w-full bg-cream border border-soft-brown/20 rounded-xl text-charcoal px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                    />
                                </div>

                                <button
                                    onClick={saveHeroSettings}
                                    disabled={heroSaving}
                                    className="btn-primary inline-flex items-center gap-2 text-xs"
                                >
                                    <Save className="w-4 h-4" />
                                    <span>{heroSaving ? 'Menyimpan...' : 'Simpan Hero Banner'}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminSettings;
