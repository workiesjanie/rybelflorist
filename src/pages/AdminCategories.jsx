import { useState, useEffect } from 'react';
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { logActivity } from '../utils/logActivity';
import { useAuth } from '../context/AuthContext';
import {
    Tag, Plus, Edit2, Trash2, Save, X, Search, Hash, Package, AlertTriangle
} from 'lucide-react';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const AdminCategories = () => {
    const { userProfile } = useAuth();
    const adminInfo = { uid: userProfile?.uid, name: userProfile?.displayName, email: userProfile?.email };
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [toast, setToast] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, catId: null, catName: '' });
    const [formData, setFormData] = useState({ name: '', description: '', color: '#D9A6A0' });
    const [saving, setSaving] = useState(false);

    // Brand preset colors
    const brandColors = [
        '#D9A6A0', '#A88972', '#C4908A', '#E8C5C0',
        '#8B6F5A', '#B07D76', '#39332F', '#F8F4EF'
    ];

    useEffect(() => {
        fetchCategories();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const snapshot = await getDocs(collection(db, 'categories'));
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showToast('Gagal memuat kategori', 'error');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', color: '#D9A6A0' });
        setEditingCategory(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            showToast('Nama kategori wajib diisi', 'error');
            return;
        }
        try {
            setSaving(true);
            if (editingCategory) {
                await updateDoc(doc(db, 'categories', editingCategory.id), {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    color: formData.color,
                    updatedAt: serverTimestamp()
                });
                await logActivity({
                    type: 'category', icon: 'Tag',
                    title: 'Category Updated',
                    description: `"${formData.name.trim()}" category updated`,
                    color: 'orange',
                    admin: adminInfo
                });
                showToast('Kategori berhasil diperbarui!', 'success');
            } else {
                await addDoc(collection(db, 'categories'), {
                    name: formData.name.trim(),
                    description: formData.description.trim(),
                    color: formData.color,
                    createdAt: serverTimestamp()
                });
                await logActivity({
                    type: 'category', icon: 'Tag',
                    title: 'Category Created',
                    description: `"${formData.name.trim()}" category added`,
                    color: 'orange',
                    admin: adminInfo
                });
                showToast('Kategori baru berhasil dibuat!', 'success');
            }
            resetForm();
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            showToast('Gagal menyimpan kategori', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addStarterCategories = async () => {
        const starters = [
            ['Buket Wisuda', 'Rangkaian spesial untuk merayakan kelulusan.'],
            ['Buket Ulang Tahun', 'Hadiah bunga untuk hari ulang tahun.'],
            ['Buket Romantis', 'Buket untuk menyampaikan kasih dan perhatian.'],
            ['Buket Artificial', 'Buket bunga artificial yang tahan lama.'],
            ['Perlengkapan Buket', 'Kertas, pita, dan perlengkapan merangkai buket.'],
        ];
        try {
            const existing = new Set(categories.map(category => category.name.toLowerCase()));
            for (const [name, description] of starters) {
                if (!existing.has(name.toLowerCase())) await addDoc(collection(db, 'categories'), { name, description, color: '#D9A6A0', createdAt: serverTimestamp() });
            }
            showToast('Kategori awal berhasil ditambahkan.');
            fetchCategories();
        } catch (error) {
            console.error('Error adding starter categories:', error);
            showToast('Gagal menambah kategori.', 'error');
        }
    };

    const startEdit = (cat) => {
        setEditingCategory(cat);
        setFormData({ name: cat.name, description: cat.description || '', color: cat.color || '#D9A6A0' });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const openDeleteModal = (catId) => {
        const catName = categories.find(c => c.id === catId)?.name || 'Category';
        setDeleteModal({ open: true, catId, catName });
    };

    const closeDeleteModal = () => {
        if (deletingId) return;
        setDeleteModal({ open: false, catId: null, catName: '' });
    };

    const handleDelete = async () => {
        const { catId, catName } = deleteModal;
        if (!catId) return;
        try {
            setDeletingId(catId);
            await deleteDoc(doc(db, 'categories', catId));
            await logActivity({
                type: 'category', icon: 'Tag',
                title: 'Category Deleted',
                description: `"${catName}" category removed`,
                color: 'red',
                admin: adminInfo
            });
            showToast('Kategori berhasil dihapus!', 'success');
            setDeleteModal({ open: false, catId: null, catName: '' });
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            showToast('Gagal menghapus kategori', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = categories.filter(c =>
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-cream">
                <div className="w-12 h-12 border-4 border-dusty-rose border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-charcoal font-semibold text-base">
                    Memuat Kategori...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <DeleteConfirmModal
                isOpen={deleteModal.open}
                onClose={closeDeleteModal}
                onConfirm={handleDelete}
                itemName={deleteModal.catName}
                itemType="Kategori"
                isDeleting={!!deletingId}
            />

            {toast && (
                <div className="fixed top-4 right-4 z-50">
                    <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border text-sm font-semibold ${
                        toast.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        <p>{toast.message}</p>
                        <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="hidden md:block bg-white rounded-2xl p-8 border border-soft-brown/15 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-dusty-rose/10 border border-dusty-rose/20 flex items-center justify-center">
                            <Tag className="w-8 h-8 text-dusty-rose" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-charcoal mb-1">
                                Kategori
                            </h1>
                            <p className="text-charcoal/60 text-sm font-medium">
                                {categories.length} Kategori Dikonfigurasi
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {['Buket Wisuda','Buket Ulang Tahun','Buket Romantis','Buket Artificial','Perlengkapan Buket'].some(name => !categories.some(category => category.name === name)) && (
                            <button
                                onClick={addStarterCategories}
                                className="px-4 py-2.5 rounded-full bg-cream border border-soft-brown/20 text-charcoal hover:bg-soft-brown/10 text-xs font-semibold transition"
                            >
                                Tambah 5 Kategori Rekomendasi
                            </button>
                        )}
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="btn-primary inline-flex items-center space-x-2 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Kategori Baru</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-soft-brown/15 p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center justify-between pb-5 border-b border-soft-brown/10 mb-6">
                        <h2 className="text-lg font-bold text-charcoal">
                            {editingCategory ? 'Edit Kategori' : 'Kategori Baru'}
                        </h2>
                        <button onClick={resetForm} className="p-2 text-charcoal/40 hover:text-charcoal rounded-full hover:bg-cream transition">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-charcoal mb-1.5 uppercase tracking-wider">
                                    Nama Kategori *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-4 py-3 bg-cream border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-dusty-rose text-sm font-medium"
                                    placeholder="Contoh: Buket Wisuda, Perlengkapan Buket..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-charcoal mb-1.5 uppercase tracking-wider">
                                    Aksen Warna
                                </label>
                                <div className="flex items-center space-x-3">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))}
                                        className="h-11 w-14 rounded-xl cursor-pointer border border-soft-brown/20 bg-cream"
                                    />
                                    <div className="flex space-x-2 flex-wrap gap-y-2">
                                        {brandColors.map(c => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, color: c }))}
                                                className="w-7 h-7 rounded-lg border-2 transition-transform hover:scale-110"
                                                style={{
                                                    backgroundColor: c,
                                                    borderColor: formData.color === c ? '#39332F' : 'transparent'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-charcoal mb-1.5 uppercase tracking-wider">
                                Deskripsi
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                                rows={3}
                                className="w-full px-4 py-3 bg-cream border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-dusty-rose text-sm font-medium resize-none"
                                placeholder="Deskripsi singkat mengenai kategori ini..."
                            />
                        </div>

                        <div className="flex items-center space-x-3 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary inline-flex items-center space-x-2 text-sm"
                            >
                                <Save className="w-4 h-4" />
                                <span>{saving ? 'Menyimpan...' : editingCategory ? 'Perbarui Kategori' : 'Simpan Kategori'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="btn-secondary text-sm"
                            >
                                Batal
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="bg-white rounded-2xl p-4 border border-soft-brown/15 shadow-sm">
                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-soft-brown" />
                    <input
                        type="text"
                        placeholder="Cari kategori..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-cream border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-dusty-rose text-sm font-medium"
                    />
                </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-soft-brown/15 p-16 text-center">
                    <Tag className="w-16 h-16 text-dusty-rose/40 mx-auto mb-3" />
                    <p className="text-charcoal font-bold text-base">
                        {searchQuery ? 'Tidak ada kategori yang cocok' : 'Belum ada kategori'}
                    </p>
                    <p className="text-xs text-charcoal/60 mt-1">
                        {searchQuery ? 'Coba gunakan kata kunci lain' : 'Klik "Kategori Baru" untuk menambahkan'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((cat) => {
                        const color = cat.color || '#D9A6A0';
                        return (
                            <div
                                key={cat.id}
                                className="bg-white rounded-2xl border border-soft-brown/15 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color }} />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: `${color}20` }}
                                        >
                                            <Tag className="w-5 h-5" style={{ color }} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-charcoal text-base leading-tight">
                                                {cat.name}
                                            </h3>
                                            <div className="flex items-center space-x-1 mt-0.5">
                                                <Hash className="w-3 h-3 text-charcoal/40" />
                                                <span className="text-xs text-charcoal/40 font-mono">
                                                    {cat.id.slice(0, 8)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10"
                                        style={{ backgroundColor: color }}
                                    />
                                </div>

                                <p className="text-charcoal/70 text-xs mb-5 min-h-[2.5rem] leading-relaxed">
                                    {cat.description || <span className="text-charcoal/40 italic">Tidak ada deskripsi</span>}
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-soft-brown/10">
                                    <div className="flex items-center space-x-1 text-xs text-charcoal/50">
                                        <Package className="w-3.5 h-3.5" />
                                        <span className="font-medium">Kategori</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => startEdit(cat)}
                                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-soft-brown/20 bg-cream text-charcoal hover:bg-soft-brown/15 transition"
                                        >
                                            <Edit2 className="w-3 h-3 text-soft-brown" />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => openDeleteModal(cat.id)}
                                            disabled={deletingId === cat.id}
                                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                        >
                                            {deletingId === cat.id ? (
                                                <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                            )}
                                            <span>Hapus</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminCategories;
