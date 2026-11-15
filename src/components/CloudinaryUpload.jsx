import { useState } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle, CheckCircle } from 'lucide-react';

const CloudinaryUpload = ({ onUploadSuccess, currentImage }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage || '');
    const [error, setError] = useState('');

    const handleUpload = () => {
        setError('');

        if (!window.cloudinary) {
            setError('Cloudinary script tidak termuat. Silakan refresh halaman.');
            return;
        }

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

        if (!cloudName || !uploadPreset) {
            setError('Cloudinary belum dikonfigurasi. Periksa environment variables Anda.');
            return;
        }

        try {
            const widget = window.cloudinary.createUploadWidget(
                {
                    cloudName,
                    uploadPreset,
                    sources: ['local', 'camera'],
                    multiple: false,
                    maxFileSize: 5000000,
                    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                    maxImageWidth: 2000,
                    maxImageHeight: 2000,
                    cropping: true,
                    croppingAspectRatio: 1,
                    folder: 'e-commerce/products',
                    resourceType: 'image',
                    showSkipCropButton: true,
                    croppingShowDimensions: true
                },
                (error, result) => {
                    if (error) {
                        setError(`Upload gagal: ${error.message || 'Error tidak diketahui'}`);
                        setUploading(false);
                        return;
                    }
                    if (result.event === 'success') {
                        const imageUrl = result.info.secure_url;
                        setPreview(imageUrl);
                        onUploadSuccess(imageUrl);
                        setUploading(false);
                        setError('');
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

    const clearImage = () => {
        setPreview('');
        onUploadSuccess('');
        setError('');
    };

    return (
        <div className="space-y-4">
            {/* Error State */}
            {error && (
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-red-700 text-sm">
                            Gagal Unggah
                        </p>
                        <p className="text-red-600 text-sm mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {preview ? (
                <div className="relative group rounded-2xl overflow-hidden border border-soft-brown/20 bg-cream">
                    <div className="relative z-10 flex items-center p-4 gap-5">
                        {/* Image Preview */}
                        <div className="w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-soft-brown/20 bg-white">
                            <img
                                src={preview}
                                alt="Product preview"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span className="text-green-700 text-sm font-bold uppercase tracking-wide">
                                    Gambar Siap
                                </span>
                            </div>
                            <p className="text-charcoal/80 text-xs font-semibold truncate">
                                {preview.split('/').pop()?.split('?')[0] || 'product-image'}
                            </p>
                            <p className="text-charcoal/50 text-xs mt-1">
                                Klik "Ganti Gambar" untuk mengganti
                            </p>
                        </div>

                        {/* Remove button */}
                        <button
                            type="button"
                            onClick={clearImage}
                            className="flex-shrink-0 p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 transition self-start"
                            title="Hapus gambar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ) : (
                /* Empty drop zone */
                <div
                    onClick={handleUpload}
                    className="relative rounded-2xl border-2 border-dashed border-soft-brown/25 hover:border-dusty-rose bg-cream hover:bg-cream/70 transition-all duration-300 cursor-pointer group"
                >
                    <div className="flex flex-col items-center justify-center py-10 px-6 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-white border border-soft-brown/20 group-hover:border-dusty-rose flex items-center justify-center mb-3 transition-transform group-hover:scale-105 shadow-sm">
                            <ImageIcon className="w-8 h-8 text-dusty-rose" />
                        </div>

                        <p className="font-bold text-charcoal text-base mb-1">
                            Belum Ada Gambar
                        </p>
                        <p className="text-xs text-charcoal/60">
                            Klik di sini untuk mengunggah foto produk
                        </p>
                    </div>
                </div>
            )}

            {/* Upload Button */}
            <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl border border-soft-brown/25 bg-white hover:bg-cream text-charcoal font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
                {uploading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-dusty-rose border-t-transparent rounded-full animate-spin"></div>
                        <span>Membuka Uploader...</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-4 h-4 text-dusty-rose" />
                        <span>{preview ? 'Ganti Gambar' : 'Unggah Gambar'}</span>
                    </>
                )}
            </button>

            {/* Format hint */}
            <p className="text-xs text-charcoal/50 text-center">
                Format didukung: JPG, PNG, WebP (Maks. 5MB)
            </p>
        </div>
    );
};

export default CloudinaryUpload;
