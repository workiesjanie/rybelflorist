import { useState } from 'react';
import { Upload, X, Plus, ImageIcon, AlertCircle } from 'lucide-react';

/**
 * CloudinaryMultiUpload
 * Props:
 *   images       {string[]}  - current array of image URLs
 *   onChange     {fn}        - called with the new images array on every change
 *   maxImages    {number}    - max allowed images (default 8)
 */
const CloudinaryMultiUpload = ({ images = [], onChange, maxImages = 8 }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const openWidget = () => {
        setError('');

        if (!window.cloudinary) {
            setError('Cloudinary script tidak termuat. Silakan refresh halaman.');
            return;
        }

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            setError('Cloudinary belum dikonfigurasi. Periksa environment variables.');
            return;
        }

        const remaining = maxImages - images.length;
        if (remaining <= 0) {
            setError(`Maksimal ${maxImages} gambar. Hapus gambar untuk menambah.`);
            return;
        }

        try {
            const baseImages = [...images];
            const sessionUploads = [];

            const widget = window.cloudinary.createUploadWidget(
                {
                    cloudName,
                    uploadPreset,
                    sources: ['local', 'camera'],
                    multiple: true,
                    maxFiles: remaining,
                    maxFileSize: 5000000,
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                    maxImageWidth: 2000,
                    maxImageHeight: 2000,
                    folder: 'e-commerce/products',
                    resourceType: 'image',
                    showSkipCropButton: true,
                    croppingShowDimensions: true
                },
                (err, result) => {
                    if (err) {
                        setError(`Upload gagal: ${err.message || 'Error tidak diketahui'}`);
                        setUploading(false);
                        return;
                    }
                    if (result.event === 'success') {
                        sessionUploads.push(result.info.secure_url);
                        onChange([...baseImages, ...sessionUploads]);
                    }
                    if (result.event === 'close') {
                        setUploading(false);
                    }
                }
            );
            setUploading(true);
            widget.open();
        } catch {
            setError('Gagal membuka upload widget. Silakan coba lagi.');
            setUploading(false);
        }
    };

    const removeImage = (index) => {
        const updated = images.filter((_, i) => i !== index);
        onChange(updated);
    };

    const moveImage = (from, to) => {
        if (to < 0 || to >= images.length) return;
        const updated = [...images];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        onChange(updated);
    };

    const canAdd = images.length < maxImages;

    return (
        <div className="space-y-4">
            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-red-700 text-sm">
                            Gagal Unggah
                        </p>
                        <p className="text-red-600 text-sm mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* Image grid */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((url, idx) => (
                        <div
                            key={url + idx}
                            className={`relative group rounded-xl overflow-hidden border aspect-square ${
                                idx === 0 ? 'border-dusty-rose ring-2 ring-dusty-rose/20' : 'border-soft-brown/20 hover:border-dusty-rose'
                            } transition-all bg-cream`}
                        >
                            <img
                                src={url}
                                alt={`Product image ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Main label badge */}
                            {idx === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-dusty-rose py-0.5 text-center">
                                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">
                                        Utama
                                    </span>
                                </div>
                            )}

                            {/* Overlay actions */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-1">
                                <div className="flex gap-1">
                                    <button
                                        type="button"
                                        onClick={() => moveImage(idx, idx - 1)}
                                        disabled={idx === 0}
                                        className="p-1 bg-white/90 border border-soft-brown/25 rounded text-charcoal hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                                        title="Pindah ke kiri"
                                    >←</button>
                                    <button
                                        type="button"
                                        onClick={() => moveImage(idx, idx + 1)}
                                        disabled={idx === images.length - 1}
                                        className="p-1 bg-white/90 border border-soft-brown/25 rounded text-charcoal hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold"
                                        title="Pindah ke kanan"
                                    >→</button>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition"
                                    title="Hapus gambar"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Image number badge */}
                            <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-white/90 border border-soft-brown/20 rounded-md flex items-center justify-center">
                                <span className="text-[10px] font-bold text-charcoal">{idx + 1}</span>
                            </div>
                        </div>
                    ))}

                    {/* Add more slot */}
                    {canAdd && (
                        <button
                            type="button"
                            onClick={openWidget}
                            disabled={uploading}
                            className="aspect-square rounded-xl border-2 border-dashed border-soft-brown/25 hover:border-dusty-rose bg-cream hover:bg-cream/70 transition-all flex flex-col items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            <Plus className="w-6 h-6 text-dusty-rose group-hover:scale-110 transition-transform" />
                            <span className="text-xs text-charcoal/60 group-hover:text-charcoal font-semibold transition-colors">
                                Tambah
                            </span>
                        </button>
                    )}
                </div>
            )}

            {/* Empty state */}
            {images.length === 0 && (
                <div
                    onClick={openWidget}
                    className="relative rounded-2xl border-2 border-dashed border-soft-brown/25 hover:border-dusty-rose bg-cream hover:bg-cream/70 transition-all duration-300 cursor-pointer group"
                >
                    <div className="flex flex-col items-center justify-center py-10 px-6 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-soft-brown/20 group-hover:border-dusty-rose flex items-center justify-center mb-3 transition-transform group-hover:scale-105 shadow-sm">
                            <ImageIcon className="w-8 h-8 text-dusty-rose" />
                        </div>
                        <p className="font-bold text-charcoal text-base mb-1">
                            Belum Ada Foto Produk
                        </p>
                        <p className="text-xs text-charcoal/60">
                            Klik untuk memilih dan mengunggah foto
                        </p>
                    </div>
                </div>
            )}

            {/* Upload button */}
            <button
                type="button"
                onClick={openWidget}
                disabled={uploading || !canAdd}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-soft-brown/25 bg-white hover:bg-cream text-charcoal font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                {uploading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-dusty-rose border-t-transparent rounded-full animate-spin" />
                        <span>Membuka Uploader...</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-4 h-4 text-dusty-rose" />
                        <span>
                            {!canAdd
                                ? `Maksimal ${maxImages} Foto Tercapai`
                                : images.length > 0
                                    ? `Tambah Foto (${images.length}/${maxImages})`
                                    : 'Unggah Foto Produk'}
                        </span>
                    </>
                )}
            </button>

            {/* Hints */}
            <div className="flex items-center justify-between text-xs text-charcoal/50">
                <span>JPG · PNG · WebP · Maks 5MB per file</span>
                <span className={images.length >= maxImages ? 'text-red-500 font-semibold' : ''}>
                    {images.length}/{maxImages} foto
                </span>
            </div>
            {images.length > 0 && (
                <p className="text-xs text-dusty-rose-dark">
                    * Foto pertama akan dijadikan foto sampul utama produk. Gunakan panah untuk mengatur urutan.
                </p>
            )}
        </div>
    );
};

export default CloudinaryMultiUpload;
