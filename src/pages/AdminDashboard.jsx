import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { logActivity } from '../utils/logActivity';
import CloudinaryMultiUpload from '../components/CloudinaryMultiUpload';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import AdminOrders from './AdminOrders';
import AdminSettings from './AdminSettings';
import AdminCategories from './AdminCategories';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Settings,
    LogOut,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Search,
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Menu,
    ChevronLeft,
    Image as ImageIcon,
    Tag,
    Banknote,
    Star
} from 'lucide-react';

const isValidAffiliateUrl = (value) => {
    try { return new URL(value).protocol === 'https:'; } catch { return false; }
};

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState(() => {
        const savedTab = localStorage.getItem('adminActiveTab');
        return ['dashboard', 'products', 'categories', 'orders', 'settings'].includes(savedTab) ? savedTab : 'dashboard';
    });
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '', action: null });
    const [recentActivity, setRecentActivity] = useState([]);
    const [showAllActivity, setShowAllActivity] = useState(false);
    const [categories, setCategories] = useState([]);
    const [dashboardStartTime] = useState(Date.now());
    const [notificationSound] = useState(new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'));
    const [deleteModal, setDeleteModal] = useState({ open: false, productId: null, productName: '' });
    const [isDeletingProduct, setIsDeletingProduct] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discount: '',
        images: [],
        image: '',
        category: '',
        rating: '',
        reviews: '',
        stock: '',
        productType: 'store',
        affiliateUrl: '',
        affiliatePlatform: 'Shopee',
        categoryId: '',
        isActive: true,
        isFeatured: false
    });

    const mainRef = useRef(null);

    const { signOut, user, userProfile } = useAuth();
    const { formatPrice } = useCurrency();
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem('adminActiveTab', activeTab);
    }, [activeTab]);

    const showToast = (message, type = 'success', action = null) => {
        setToast({ show: true, message, type, action });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '', action: null });
        }, 10000);
    };

    // Real-time Order Listener for Notifications
    useEffect(() => {
        if (!user) return;

        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const order = change.doc.data();
                    const orderTime = order.createdAt?.toDate()?.getTime() || Date.now();

                    if (orderTime > dashboardStartTime) {
                        notificationSound.play().catch(e => console.log('Audio play blocked:', e));

                        if (typeof Notification !== 'undefined' && document.visibilityState === 'hidden' && Notification.permission === 'granted') {
                            new Notification('Pesanan Baru Diterima!', {
                                body: `${order.userName || 'Tamu'} memesan senilai ${formatPrice(order.total)}`,
                                icon: '/favicon-buket.svg'
                            });
                        }

                        showToast(
                            `Pesanan Baru! ${order.userName || 'Tamu'} — ${formatPrice(order.total)}`,
                            'success',
                            { label: 'LIHAT', onClick: () => setActiveTab('orders') }
                        );
                    }
                }
            });
        });

        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => unsubscribe();
    }, [user, dashboardStartTime, notificationSound]);

    // Real-time products listener
    useEffect(() => {
        setLoading(true);
        const unsubscribe = onSnapshot(
            collection(db, 'products'),
            (snapshot) => {
                const productsData = snapshot.docs.map(d => ({
                    id: d.id,
                    ...d.data()
                }));
                setProducts(productsData);
                setLoading(false);
            },
            (error) => {
                console.error('Error listening to products:', error);
                showToast('Gagal memuat produk', 'error');
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    // Real-time activity log listener
    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'activityLogs'),
            orderBy('createdAt', 'desc'),
            limit(100)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const logs = snapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
                timestamp: d.data().createdAt?.toDate?.()?.getTime() || Date.now()
            }));
            setRecentActivity(logs);
        }, (err) => console.error('Activity log error:', err));
        return () => unsubscribe();
    }, [user]);

    // Real-time categories listener
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'categories'),
            (snapshot) => {
                const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                setCategories(data);
            },
            (error) => {
                console.error('Error listening to categories:', error);
            }
        );
        return () => unsubscribe();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (formData.productType === 'affiliate' && !isValidAffiliateUrl(formData.affiliateUrl)) {
            showToast('Link affiliate harus berupa URL HTTPS yang valid', 'error'); return;
        }
        if (formData.productType === 'store' && (!Number.isFinite(Number(formData.price)) || Number(formData.price) <= 0 || !Number.isInteger(Number(formData.stock)) || Number(formData.stock) < 0)) {
            showToast('Produk toko harus memiliki harga positif dan stok bilangan bulat valid', 'error'); return;
        }
        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                discount: formData.discount ? parseInt(formData.discount) : 0,
                rating: formData.rating ? parseFloat(formData.rating) : 0,
                reviews: formData.reviews ? parseInt(formData.reviews) : 0,
                stock: formData.stock ? parseInt(formData.stock) : 0,
                productType: formData.productType || 'store',
                affiliateUrl: formData.productType === 'affiliate' ? formData.affiliateUrl.trim() : '',
                affiliatePlatform: formData.affiliatePlatform || 'Shopee',
                categoryId: categories.find(c => c.name === formData.category)?.id || '',
                isActive: formData.isActive !== false,
                images: formData.images,
                image: formData.images[0] || '',
            };

            await addDoc(collection(db, 'products'), productData);
            await logActivity({
                type: 'product', icon: 'Package',
                title: 'Produk Ditambahkan',
                description: `"${formData.name}" ditambahkan ke katalog`,
                color: 'cyan',
                admin: { uid: userProfile?.uid, name: userProfile?.displayName, email: userProfile?.email }
            });
            showToast('Produk berhasil ditambahkan!', 'success');
            setShowAddForm(false);
            resetForm();
        } catch (error) {
            console.error('Error adding product:', error);
            showToast('Gagal menambahkan produk', 'error');
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        if (formData.productType === 'affiliate' && !isValidAffiliateUrl(formData.affiliateUrl)) {
            showToast('Link affiliate harus berupa URL HTTPS yang valid', 'error'); return;
        }
        if (formData.productType === 'store' && (!Number.isFinite(Number(formData.price)) || Number(formData.price) <= 0 || !Number.isInteger(Number(formData.stock)) || Number(formData.stock) < 0)) {
            showToast('Produk toko harus memiliki harga positif dan stok bilangan bulat valid', 'error'); return;
        }
        try {
            const productData = {
                ...formData,
                price: parseFloat(formData.price),
                discount: formData.discount ? parseInt(formData.discount) : 0,
                rating: formData.rating ? parseFloat(formData.rating) : 0,
                reviews: formData.reviews ? parseInt(formData.reviews) : 0,
                stock: formData.stock ? parseInt(formData.stock) : 0,
                productType: formData.productType || 'store',
                affiliateUrl: formData.productType === 'affiliate' ? formData.affiliateUrl.trim() : '',
                affiliatePlatform: formData.affiliatePlatform || 'Shopee',
                categoryId: categories.find(c => c.name === formData.category)?.id || '',
                isActive: formData.isActive !== false,
                images: formData.images,
                image: formData.images[0] || '',
            };

            await updateDoc(doc(db, 'products', editingProduct.id), productData);
            await logActivity({
                type: 'product', icon: 'Package',
                title: 'Produk Diperbarui',
                description: `Detail "${formData.name}" diperbarui`,
                color: 'cyan',
                admin: { uid: userProfile?.uid, name: userProfile?.displayName, email: userProfile?.email }
            });
            showToast('Produk berhasil diperbarui!', 'success');
            setEditingProduct(null);
            resetForm();
        } catch (error) {
            console.error('Error updating product:', error);
            showToast('Gagal memperbarui produk', 'error');
        }
    };

    const openDeleteModal = (productId) => {
        const productName = products.find(p => p.id === productId)?.name || 'Product';
        setDeleteModal({ open: true, productId, productName });
    };

    const closeDeleteModal = () => {
        if (isDeletingProduct) return;
        setDeleteModal({ open: false, productId: null, productName: '' });
    };

    const handleDeleteProduct = async () => {
        const { productId, productName } = deleteModal;
        if (!productId) return;
        try {
            setIsDeletingProduct(true);
            await deleteDoc(doc(db, 'products', productId));
            await logActivity({
                type: 'product', icon: 'Package',
                title: 'Produk Dihapus',
                description: `"${productName}" dihapus dari katalog`,
                color: 'orange',
                admin: { uid: userProfile?.uid, name: userProfile?.displayName, email: userProfile?.email }
            });
            showToast('Produk berhasil dihapus!', 'success');
            setDeleteModal({ open: false, productId: null, productName: '' });
        } catch (error) {
            console.error('Error deleting product:', error);
            showToast('Gagal menghapus produk', 'error');
        } finally {
            setIsDeletingProduct(false);
        }
    };

    const handleToggleFeatured = async (product) => {
        try {
            const newStatus = !product.isFeatured;
            await updateDoc(doc(db, 'products', product.id), {
                isFeatured: newStatus
            });
            await logActivity({
                type: 'product', icon: 'Star',
                title: newStatus ? 'Produk Unggulan Ditambahkan' : 'Produk Unggulan Dihapus',
                description: `"${product.name}" ${newStatus ? 'ditandai sebagai' : 'dihapus dari'} produk unggulan`,
                color: 'yellow',
                admin: { uid: userProfile?.uid, name: userProfile?.displayName, email: userProfile?.email }
            });
            showToast(newStatus ? 'Produk dijadikan unggulan di Beranda!' : 'Produk dilepas dari unggulan', 'success');
        } catch (error) {
            console.error('Error toggling featured:', error);
            showToast('Gagal mengubah status unggulan', 'error');
        }
    };

    const startEdit = (product) => {
        setEditingProduct(product);
        const existingImages = product.images?.length
            ? product.images
            : product.image
                ? [product.image]
                : [];
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price.toString(),
            discount: product.discount?.toString() || '',
            images: existingImages,
            image: existingImages[0] || '',
            category: product.category,
            rating: product.rating?.toString() || '',
            reviews: product.reviews?.toString() || '',
            stock: product.stock?.toString() || '',
            productType: product.productType || 'store',
            affiliateUrl: product.affiliateUrl || '',
            affiliatePlatform: product.affiliatePlatform || 'Shopee',
            categoryId: product.categoryId || '',
            isActive: product.isActive !== false,
            isFeatured: product.isFeatured || false
        });
        setShowAddForm(false);
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            discount: '',
            images: [],
            image: '',
            category: '',
            rating: '',
            reviews: '',
            stock: '',
            productType: 'store',
            affiliateUrl: '',
            affiliatePlatform: 'Shopee',
            categoryId: '',
            isActive: true,
            isFeatured: false
        });
    };

    const cancelEdit = () => {
        setEditingProduct(null);
        setShowAddForm(false);
        resetForm();
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/admin');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStockProducts = products.filter(p => p.stock < 10 && p.productType !== 'affiliate').length;

    const menuItems = [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'products', icon: Package, label: 'Produk' },
        { id: 'categories', icon: Tag, label: 'Kategori' },
        { id: 'orders', icon: ShoppingCart, label: 'Pesanan' },
        { id: 'settings', icon: Settings, label: 'Pengaturan' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream">
                <div className="w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <DeleteConfirmModal
                isOpen={deleteModal.open}
                onClose={closeDeleteModal}
                onConfirm={handleDeleteProduct}
                itemName={deleteModal.productName}
                itemType="Produk"
                isDeleting={isDeletingProduct}
            />

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border text-sm font-semibold ${
                        toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <p>{toast.message}</p>
                        {toast.action && (
                            <button
                                onClick={() => {
                                    toast.action.onClick();
                                    setToast({ show: false, message: '', type: '', action: null });
                                }}
                                className="ml-3 px-2.5 py-1 bg-white border border-soft-brown/20 rounded-lg text-xs font-bold text-charcoal hover:bg-cream transition"
                            >
                                {toast.action.label}
                            </button>
                        )}
                        <button
                            onClick={() => setToast({ show: false, message: '', type: '', action: null })}
                            className="ml-2 hover:opacity-70"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="flex h-screen bg-cream overflow-hidden relative">
                {/* Mobile overlay backdrop */}
                {mobileSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside className={`
                    fixed md:relative inset-y-0 left-0 z-50
                    ${sidebarOpen ? 'md:w-64' : 'md:w-20'}
                    ${mobileSidebarOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:translate-x-0'}
                    bg-white text-charcoal
                    transition-all duration-300 flex flex-col
                    border-r border-soft-brown/15 shadow-sm
                `}>
                    {/* Logo / Toggle */}
                    <div className={`flex items-center border-b border-soft-brown/10 p-4 ${sidebarOpen ? 'md:p-6 justify-between' : 'justify-center'}`}>
                        {sidebarOpen && (
                            <div className="hidden md:block">
                                <h1 className="text-xl font-extrabold text-charcoal leading-tight">rybelflorist</h1>
                                <p className="text-charcoal/50 text-xs font-medium">Panel Admin</p>
                            </div>
                        )}
                        <div className="md:hidden">
                            <h1 className="text-xl font-extrabold text-charcoal leading-tight">rybelflorist</h1>
                            <p className="text-charcoal/50 text-xs font-medium">Panel Admin</p>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="hidden md:flex p-2 hover:bg-cream rounded-xl transition text-charcoal/60 hover:text-charcoal"
                        >
                            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    localStorage.setItem('adminActiveTab', item.id);
                                    setMobileSidebarOpen(false);
                                }}
                                title={!sidebarOpen ? item.label : undefined}
                                className={`w-full flex items-center rounded-xl transition-all duration-200
                                    space-x-3 px-4 py-3 text-sm font-semibold
                                    ${!sidebarOpen ? 'md:justify-center md:px-0 md:space-x-0' : ''}
                                    ${activeTab === item.id
                                        ? 'bg-dusty-rose/15 text-dusty-rose-dark font-bold'
                                        : 'text-charcoal/70 hover:bg-cream hover:text-charcoal'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                <span className={`${!sidebarOpen ? 'md:hidden' : ''} inline`}>
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </nav>

                    {/* User Profile & Logout */}
                    <div className="p-4 border-t border-soft-brown/10">
                        <div className="bg-cream rounded-xl p-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-dusty-rose/20 text-dusty-rose-dark flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {userProfile?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className={`flex-1 min-w-0 ${!sidebarOpen ? 'md:hidden' : ''}`}>
                                <p className="text-charcoal font-bold text-xs truncate">
                                    {userProfile?.displayName || user?.email?.split('@')[0]}
                                </p>
                                <p className="text-charcoal/50 text-[10px] font-semibold">
                                    Admin
                                </p>
                            </div>
                            <button
                                onClick={handleLogout}
                                title="Keluar"
                                className="p-1.5 rounded-lg text-charcoal/40 hover:text-red-600 hover:bg-red-50 transition"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main ref={mainRef} className="flex-1 overflow-y-auto flex flex-col">
                    {/* Mobile top bar */}
                    <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-soft-brown/15 sticky top-0 z-30 shadow-sm">
                        <button
                            onClick={() => setMobileSidebarOpen(true)}
                            className="p-2 hover:bg-cream rounded-xl text-charcoal"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-base font-bold text-charcoal">
                            {menuItems.find(m => m.id === activeTab)?.label || 'Admin'}
                        </h1>
                        <div className="w-8 h-8 rounded-lg bg-dusty-rose/15 text-dusty-rose-dark flex items-center justify-center font-bold text-xs">
                            {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="p-4 md:p-8 pb-12">
                        {/* Dashboard View */}
                        {activeTab === 'dashboard' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="hidden md:block bg-white rounded-2xl p-8 border border-soft-brown/15 shadow-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-2xl bg-dusty-rose/10 border border-dusty-rose/20 flex items-center justify-center">
                                            <LayoutDashboard className="w-8 h-8 text-dusty-rose" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-extrabold text-charcoal mb-1">Dashboard</h1>
                                            <p className="text-charcoal/60 text-sm font-medium">Ringkasan Aktivitas & Katalog Toko</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                                    <div className="bg-white p-6 rounded-2xl border border-soft-brown/15 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-charcoal/60 text-xs font-bold uppercase tracking-wider">Total Produk</p>
                                                <h3 className="text-3xl font-extrabold mt-1 text-charcoal">{totalProducts}</h3>
                                            </div>
                                            <div className="p-3 bg-dusty-rose/10 rounded-2xl text-dusty-rose">
                                                <Package className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-soft-brown/15 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div className="min-w-0 flex-1 mr-2">
                                                <p className="text-charcoal/60 text-xs font-bold uppercase tracking-wider">Nilai Estimasi Stok</p>
                                                <h3 className="text-2xl font-extrabold mt-1 text-charcoal truncate">
                                                    {formatPrice(totalValue)}
                                                </h3>
                                            </div>
                                            <div className="p-3 bg-green-50 rounded-2xl text-green-700">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl border border-soft-brown/15 shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-charcoal/60 text-xs font-bold uppercase tracking-wider">Stok Menipis (&lt;10)</p>
                                                <h3 className="text-3xl font-extrabold mt-1 text-charcoal">{lowStockProducts}</h3>
                                            </div>
                                            <div className="p-3 bg-amber-50 rounded-2xl text-amber-700">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white rounded-2xl p-6 border border-soft-brown/15 shadow-sm">
                                    <h3 className="text-base font-bold text-charcoal mb-4">Aksi Cepat</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                                        <button
                                            onClick={() => {
                                                setActiveTab('products');
                                                setShowAddForm(true);
                                                resetForm();
                                            }}
                                            className="p-5 border border-soft-brown/20 rounded-2xl hover:bg-cream transition text-center group"
                                        >
                                            <Plus className="w-7 h-7 mx-auto mb-2 text-dusty-rose group-hover:scale-110 transition-transform" />
                                            <p className="font-semibold text-charcoal text-xs sm:text-sm">Tambah Produk</p>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('orders')}
                                            className="p-5 border border-soft-brown/20 rounded-2xl hover:bg-cream transition text-center group"
                                        >
                                            <ShoppingCart className="w-7 h-7 mx-auto mb-2 text-dusty-rose group-hover:scale-110 transition-transform" />
                                            <p className="font-semibold text-charcoal text-xs sm:text-sm">Kelola Pesanan</p>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('categories')}
                                            className="p-5 border border-soft-brown/20 rounded-2xl hover:bg-cream transition text-center group"
                                        >
                                            <Tag className="w-7 h-7 mx-auto mb-2 text-dusty-rose group-hover:scale-110 transition-transform" />
                                            <p className="font-semibold text-charcoal text-xs sm:text-sm">Kategori</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white rounded-2xl p-6 border border-soft-brown/15 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-bold text-charcoal">Aktivitas Terkini</h3>
                                        {recentActivity.length > 4 && (
                                            <button
                                                onClick={() => setShowAllActivity(prev => !prev)}
                                                className="text-xs font-semibold text-dusty-rose hover:text-dusty-rose-dark transition"
                                            >
                                                {showAllActivity ? 'Tampilkan Lebih Sedikit' : `Lihat Semua (${recentActivity.length})`}
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-2.5">
                                        {recentActivity.length > 0 ? (
                                            (showAllActivity ? recentActivity : recentActivity.slice(0, 4)).map((activity, index) => {
                                                const IconComponent = activity.icon === 'Package' ? Package :
                                                    activity.icon === 'ShoppingCart' ? ShoppingCart :
                                                        activity.icon === 'Banknote' ? Banknote : TrendingUp;

                                                const getTimeAgo = (timestamp) => {
                                                    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);
                                                    if (seconds < 60) return 'Baru saja';
                                                    if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
                                                    if (seconds < 86400) return `${Math.floor(seconds / 3600)}j lalu`;
                                                    return `${Math.floor(seconds / 86400)}h lalu`;
                                                };

                                                return (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3.5 p-3.5 bg-cream/70 rounded-xl border border-soft-brown/10 text-charcoal"
                                                    >
                                                        <div className="w-9 h-9 rounded-xl bg-white border border-soft-brown/20 flex items-center justify-center flex-shrink-0 text-dusty-rose">
                                                            <IconComponent className="w-4 h-4" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-xs sm:text-sm text-charcoal truncate">{activity.title}</p>
                                                            <p className="text-xs text-charcoal/60 truncate">{activity.description}</p>
                                                        </div>
                                                        <span className="text-[10px] text-charcoal/40 font-medium whitespace-nowrap">
                                                            {getTimeAgo(activity.timestamp)}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-charcoal/50 text-xs py-4 text-center">Belum ada aktivitas tercatat.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Products View */}
                        {activeTab === 'products' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="hidden md:block bg-white rounded-2xl p-8 border border-soft-brown/15 shadow-sm">
                                    <div className="flex items-center space-x-4">
                                        <div className="w-16 h-16 rounded-2xl bg-dusty-rose/10 border border-dusty-rose/20 flex items-center justify-center">
                                            <Package className="w-8 h-8 text-dusty-rose" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-extrabold text-charcoal mb-1">Katalog Produk</h1>
                                            <p className="text-charcoal/60 text-sm font-medium">Manajemen Produk Toko & Affiliate Shopee</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Toolbar */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                                    <div className="relative w-full sm:flex-1 sm:max-w-md">
                                        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-soft-brown w-4 h-4" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama atau kategori produk..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                        />
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowAddForm(true);
                                            setEditingProduct(null);
                                            resetForm();
                                        }}
                                        className="btn-primary inline-flex items-center justify-center space-x-2 text-xs"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>Tambah Produk</span>
                                    </button>
                                </div>

                                {/* Add/Edit Form */}
                                {(showAddForm || editingProduct) && (
                                    <div className="bg-white rounded-2xl p-6 sm:p-8 border border-soft-brown/15 shadow-sm space-y-6 animate-fade-in">
                                        <div className="flex justify-between items-center pb-4 border-b border-soft-brown/10">
                                            <h3 className="text-lg font-bold text-charcoal">
                                                {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                                            </h3>
                                            <button onClick={cancelEdit} className="p-1.5 text-charcoal/40 hover:text-charcoal rounded-full hover:bg-cream transition">
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <form onSubmit={editingProduct ? handleUpdateProduct : handleAddProduct} className="space-y-6">
                                            {/* Basic Information */}
                                            <div className="bg-cream/60 p-5 rounded-2xl border border-soft-brown/15 space-y-4">
                                                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                                                    Informasi Produk
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-charcoal mb-1">Tipe Produk *</label>
                                                        <select
                                                            name="productType"
                                                            value={formData.productType || 'store'}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                                        >
                                                            <option value="store">Buket Milik Toko</option>
                                                            <option value="affiliate">Affiliate Shopee (Perlengkapan Buket)</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-charcoal mb-1">Nama Produk *</label>
                                                        <input
                                                            type="text"
                                                            name="name"
                                                            value={formData.name}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                                            placeholder="Contoh: Buket Mawar Merah Elegant"
                                                            required
                                                        />
                                                    </div>

                                                    {formData.productType === 'affiliate' && (
                                                        <>
                                                            <div>
                                                                <label className="block text-xs font-bold text-charcoal mb-1">Platform Affiliate</label>
                                                                <input
                                                                    name="affiliatePlatform"
                                                                    value={formData.affiliatePlatform || 'Shopee'}
                                                                    onChange={handleInputChange}
                                                                    className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                                                />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-bold text-charcoal mb-1">Link Affiliate (HTTPS) *</label>
                                                                <input
                                                                    type="url"
                                                                    name="affiliateUrl"
                                                                    value={formData.affiliateUrl || ''}
                                                                    onChange={handleInputChange}
                                                                    className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                                                    placeholder="https://shopee.co.id/..."
                                                                    required
                                                                />
                                                            </div>
                                                        </>
                                                    )}

                                                    <div>
                                                        <label className="block text-xs font-bold text-charcoal mb-1">Kategori *</label>
                                                        <select
                                                            name="category"
                                                            value={formData.category}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                                            required
                                                        >
                                                            <option value="">Pilih Kategori</option>
                                                            {categories.map(cat => (
                                                                <option key={cat.id} value={cat.name}>
                                                                    {cat.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-charcoal mb-1">Deskripsi Produk *</label>
                                                        <textarea
                                                            name="description"
                                                            value={formData.description}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 text-xs font-medium resize-none focus:outline-none focus:border-dusty-rose"
                                                            rows="4"
                                                            placeholder="Jelaskan detail buket, bunga, bahan, dan kemasan..."
                                                            required
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pricing Section */}
                                            <div className="bg-cream/60 p-5 rounded-2xl border border-soft-brown/15 space-y-4">
                                                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                                                    Harga & Diskon
                                                </h4>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-charcoal mb-1">Harga (Rupiah) *</label>
                                                        <input
                                                            type="number"
                                                            name="price"
                                                            value={formData.price}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                                            placeholder="0"
                                                            min="0"
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-charcoal mb-1">Diskon (%)</label>
                                                        <input
                                                            type="number"
                                                            name="discount"
                                                            value={formData.discount}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                                            placeholder="0"
                                                            min="0"
                                                            max="100"
                                                        />
                                                    </div>
                                                    {formData.price && (
                                                        <div className="md:col-span-2 p-3 bg-white rounded-xl border border-soft-brown/15 text-xs text-charcoal/70">
                                                            <span>Harga setelah diskon: </span>
                                                            <strong className="text-charcoal font-bold">
                                                                {formatPrice(Number(formData.price) * (1 - Number(formData.discount || 0) / 100))}
                                                            </strong>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Images */}
                                            <div className="bg-cream/60 p-5 rounded-2xl border border-soft-brown/15 space-y-3">
                                                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                                                    Foto Produk
                                                </h4>
                                                <CloudinaryMultiUpload
                                                    images={formData.images || []}
                                                    onChange={(urls) => {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            images: urls,
                                                            image: urls[0] || ''
                                                        }));
                                                    }}
                                                    maxImages={8}
                                                />
                                            </div>

                                            {/* Stock & Status */}
                                            <div className="bg-cream/60 p-5 rounded-2xl border border-soft-brown/15 space-y-4">
                                                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider">
                                                    Stok & Ketersediaan
                                                </h4>
                                                <div className="max-w-xs">
                                                    <label className="block text-xs font-bold text-charcoal mb-1">
                                                        Stok {formData.productType === 'affiliate' ? '(opsional)' : '*'}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        name="stock"
                                                        value={formData.stock}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3.5 py-2.5 bg-white border border-soft-brown/20 rounded-xl text-charcoal text-xs font-medium focus:outline-none focus:border-dusty-rose"
                                                        placeholder="0"
                                                        min="0"
                                                        required={formData.productType !== 'affiliate'}
                                                    />
                                                </div>
                                                <label className="flex items-center gap-2 text-xs font-bold text-charcoal cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        name="isActive"
                                                        checked={formData.isActive !== false}
                                                        onChange={handleInputChange}
                                                        className="accent-[#D9A6A0]"
                                                    />
                                                    Produk aktif dan tampil di katalog
                                                </label>
                                            </div>

                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    type="submit"
                                                    className="btn-primary inline-flex items-center space-x-2 text-xs font-semibold"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    <span>{editingProduct ? 'Perbarui Produk' : 'Simpan Produk'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={cancelEdit}
                                                    className="btn-secondary text-xs"
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* Products Table / Cards */}
                                <div className="bg-white rounded-2xl border border-soft-brown/15 shadow-sm overflow-hidden">
                                    {filteredProducts.length === 0 ? (
                                        <div className="p-12 text-center text-charcoal/50 text-xs">
                                            {searchQuery ? 'Tidak ada produk yang cocok dengan pencarian.' : 'Belum ada produk. Tambahkan produk pertama Anda!'}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="hidden md:block overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-cream border-b border-soft-brown/10">
                                                        <tr>
                                                            {['Foto', 'Nama', 'Kategori', 'Harga', 'Stok', 'Aksi'].map(h => (
                                                                <th key={h} className="px-6 py-3.5 text-left text-xs font-bold text-charcoal/60 uppercase tracking-wider">
                                                                    {h}
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-soft-brown/10">
                                                        {filteredProducts.map((p) => (
                                                            <tr key={p.id} className="hover:bg-cream/40 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <img src={p.image || '/placeholder-buket.svg'} alt={p.name} className="w-14 h-14 object-cover rounded-xl border border-soft-brown/20 bg-cream" />
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-charcoal text-sm">{p.name}</div>
                                                                    <div className="text-xs text-charcoal/50 line-clamp-1">{p.description}</div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="px-2.5 py-1 bg-dusty-rose/15 text-dusty-rose-dark rounded-full text-xs font-semibold">
                                                                        {p.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-charcoal text-sm">{formatPrice(p.price)}</div>
                                                                    {p.discount > 0 && <div className="text-[11px] text-red-500 font-semibold">-{p.discount}%</div>}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`font-semibold text-xs ${p.stock > 10 ? 'text-green-700' : 'text-amber-700'}`}>
                                                                        {p.productType === 'affiliate' ? 'Shopee' : p.stock || 0}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex space-x-1.5">
                                                                        <button
                                                                            onClick={() => handleToggleFeatured(p)}
                                                                            className={`p-2 rounded-lg border transition ${p.isFeatured ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-charcoal/30 border-soft-brown/20 hover:text-amber-500'}`}
                                                                            title={p.isFeatured ? 'Batal jadikan unggulan' : 'Jadikan unggulan di Beranda'}
                                                                        >
                                                                            <Star className={`w-4 h-4 ${p.isFeatured ? 'fill-amber-500' : ''}`} />
                                                                        </button>
                                                                        <button onClick={() => startEdit(p)} className="p-2 text-soft-brown hover:text-charcoal hover:bg-cream rounded-lg border border-soft-brown/20 transition" title="Edit">
                                                                            <Edit2 className="w-4 h-4" />
                                                                        </button>
                                                                        <button onClick={() => openDeleteModal(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition" title="Hapus">
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobile Cards */}
                                            <div className="md:hidden divide-y divide-soft-brown/10">
                                                {filteredProducts.map((p) => (
                                                    <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-cream/40 transition">
                                                        <img src={p.image || '/placeholder-buket.svg'} alt={p.name} className="w-14 h-14 object-cover rounded-xl border border-soft-brown/20 flex-shrink-0 bg-cream" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-charcoal text-sm truncate">{p.name}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] px-2 py-0.5 bg-dusty-rose/15 text-dusty-rose-dark rounded-full font-semibold">{p.category}</span>
                                                                <span className="font-bold text-charcoal text-xs">{formatPrice(p.price)}</span>
                                                            </div>
                                                            <p className={`text-[11px] mt-1 font-semibold ${p.stock > 10 ? 'text-green-700' : 'text-amber-700'}`}>
                                                                Stok: {p.productType === 'affiliate' ? 'Shopee' : p.stock || 0}
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                                                            <button onClick={() => handleToggleFeatured(p)} className={`p-1.5 rounded-lg border ${p.isFeatured ? 'text-amber-500 bg-amber-50 border-amber-200' : 'text-charcoal/30 border-soft-brown/20'}`}>
                                                                <Star className={`w-3.5 h-3.5 ${p.isFeatured ? 'fill-amber-500' : ''}`} />
                                                            </button>
                                                            <button onClick={() => startEdit(p)} className="p-1.5 text-soft-brown hover:text-charcoal rounded-lg border border-soft-brown/20">
                                                                <Edit2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button onClick={() => openDeleteModal(p.id)} className="p-1.5 text-red-600 rounded-lg border border-red-200">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Categories View */}
                        {activeTab === 'categories' && (
                            <div className="animate-fade-in">
                                <AdminCategories />
                            </div>
                        )}

                        {/* Orders View */}
                        {activeTab === 'orders' && (
                            <div className="animate-fade-in">
                                <AdminOrders />
                            </div>
                        )}

                        {/* Settings View */}
                        {activeTab === 'settings' && (
                            <div className="animate-fade-in">
                                <AdminSettings />
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
};

export default AdminDashboard;
