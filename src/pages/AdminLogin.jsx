import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Shield, ArrowLeft } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { user, isAdmin, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (authLoading) return;

        if (user) {
            if (isAdmin) {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        }
    }, [user, isAdmin, authLoading, navigate]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-cream flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-dusty-rose"></div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));

            if (!userDoc.exists()) {
                setError('Akun tidak ditemukan. Silakan hubungi support.');
                await auth.signOut();
                setLoading(false);
                return;
            }

            const userData = userDoc.data();

            if (userData.isAdmin !== true) {
                setError('Akses ditolak. Akun ini tidak memiliki hak akses admin.');
                await auth.signOut();
                setLoading(false);
                return;
            }
        } catch (err) {
            if (err.code === 'auth/invalid-credential') {
                setError('Email atau kata sandi salah. Silakan periksa kembali.');
            } else if (err.code === 'auth/user-not-found') {
                setError('Tidak ada akun terdaftar dengan email ini.');
            } else if (err.code === 'auth/wrong-password') {
                setError('Kata sandi salah. Silakan coba lagi.');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Terlalu banyak percobaan gagal. Silakan coba lagi nanti.');
            } else {
                setError(err.message || 'Terjadi kesalahan saat masuk.');
            }
            console.error('Admin login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-md w-full relative z-10">
                <div className="bg-white p-8 sm:p-10 animate-fade-in border border-soft-brown/15 rounded-3xl shadow-lg relative overflow-hidden">
                    {/* Header */}
                    <div className="text-center mb-8 relative z-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-dusty-rose/10 border border-dusty-rose/20 mb-4">
                            <Shield className="w-10 h-10 text-dusty-rose" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal mb-1">
                            Admin rybelflorist
                        </h2>
                        <p className="text-charcoal/60 text-sm font-medium">
                            Masuk untuk mengelola produk & pesanan
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in font-medium">
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-charcoal mb-1.5 uppercase tracking-wider">
                                Email Admin
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-soft-brown w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-cream border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all text-sm font-medium"
                                    placeholder="admin@rybelflorist.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-charcoal mb-1.5 uppercase tracking-wider">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-soft-brown w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-cream border border-soft-brown/20 rounded-xl text-charcoal placeholder-charcoal/40 focus:outline-none focus:border-dusty-rose focus:ring-2 focus:ring-dusty-rose/20 transition-all text-sm font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 text-center text-sm font-semibold rounded-xl"
                        >
                            {loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}
                        </button>
                    </form>

                    {/* Back to Home */}
                    <div className="text-center mt-6 relative z-10 pt-4 border-t border-soft-brown/10">
                        <Link
                            to="/"
                            className="inline-flex items-center space-x-2 text-sm text-soft-brown hover:text-charcoal font-semibold transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            <span>Kembali ke Beranda</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
