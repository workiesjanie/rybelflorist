import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

/**
 * DeleteConfirmModal
 * Props:
 *   isOpen      {boolean}  - whether the modal is visible
 *   onClose     {fn}       - called when user cancels
 *   onConfirm   {fn}       - called when user confirms delete
 *   itemName    {string}   - name of the item being deleted (shown in modal)
 *   itemType    {string}   - "Product" | "Category" etc.
 *   isDeleting  {boolean}  - shows spinner while deletion is in progress
 */
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName, itemType = 'Item', isDeleting = false }) => {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === 'Escape' && !isDeleting) onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose, isDeleting]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={!isDeleting ? onClose : undefined}
            />

            {/* Modal */}
            <div
                className="relative w-full sm:max-w-md bg-white border border-soft-brown/20 overflow-hidden animate-fade-in rounded-t-2xl sm:rounded-2xl shadow-xl pb-safe"
            >
                {/* Red top bar accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-500"
                />

                {/* Mobile drag handle */}
                <div className="flex justify-center pt-3 sm:hidden">
                    <div className="w-10 h-1 bg-soft-brown/20 rounded-full" />
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    disabled={isDeleting}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1.5 text-charcoal/40 hover:text-charcoal hover:bg-cream rounded-full transition-all z-10 disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Content */}
                <div className="px-5 py-4 sm:p-8 relative z-10">
                    {/* Warning icon */}
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-red-50 border border-red-200">
                            <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-500" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl sm:text-2xl font-bold text-charcoal text-center mb-2">
                        Hapus {itemType}
                    </h2>

                    {/* Message */}
                    <p className="text-charcoal/70 text-center mb-2 font-medium text-sm sm:text-base">
                        Apakah Anda yakin ingin menghapus
                    </p>
                    <p className="text-charcoal text-center font-bold text-base sm:text-lg mb-4 sm:mb-6 px-3 sm:px-4 py-2 bg-cream rounded-xl border border-soft-brown/15 break-all">
                        "{itemName}"
                    </p>
                    <p className="text-charcoal/60 text-center text-xs sm:text-sm font-medium mb-5 sm:mb-8">
                        Tindakan ini <span className="text-red-600 font-semibold">tidak dapat dibatalkan</span>.
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch gap-3">
                        {/* Cancel */}
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 bg-cream hover:bg-soft-brown/10 text-charcoal font-semibold rounded-xl border border-soft-brown/25 transition-all disabled:opacity-50 text-sm sm:text-base"
                        >
                            Batal
                        </button>

                        {/* Confirm Delete */}
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-xl border border-red-300 transition-all disabled:opacity-50 text-sm sm:text-base"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                    <span>Menghapus...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                    <span>Hapus</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
