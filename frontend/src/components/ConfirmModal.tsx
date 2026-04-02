import { Trash2, AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto overflow-hidden"
        style={{ animation: 'scaleIn 0.2s ease-out' }}
      >
        {/* SweetAlert-style icon */}
        <div className="pt-8 pb-2 flex justify-center">
          <div
            className={`flex items-center justify-center w-16 h-16 rounded-full ${
              isDestructive ? 'bg-red-100' : 'bg-blue-100'
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-8 h-8 text-red-600" aria-hidden />
            ) : (
              <AlertCircle className="w-8 h-8 text-blue-600" aria-hidden />
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{title}</h3>
          <p className="text-gray-600 text-center text-sm leading-relaxed mb-6">{message}</p>

          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2.5 text-white rounded-xl font-medium transition-colors disabled:opacity-50 ${
                isDestructive
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isLoading ? 'Loading...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
