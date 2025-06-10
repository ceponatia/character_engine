'use client';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  icon?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'warning' | 'error' | 'info' | 'success';
  showConfirmButton?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  icon = '⚠️',
  confirmLabel = 'Confirm',
  cancelLabel = 'Close',
  type = 'warning',
  showConfirmButton = true
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-600 hover:bg-red-700';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'info':
      default:
        return 'bg-blue-600 hover:bg-blue-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md mx-4">
        <div className="text-center">
          <div className="text-4xl mb-4">{icon}</div>
          <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
          <p className="text-slate-300 mb-6">{message}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              {cancelLabel}
            </button>
            {showConfirmButton && onConfirm && (
              <button
                onClick={onConfirm}
                className={`px-6 py-2 text-white rounded-lg transition-colors ${getButtonStyles()}`}
              >
                {confirmLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}