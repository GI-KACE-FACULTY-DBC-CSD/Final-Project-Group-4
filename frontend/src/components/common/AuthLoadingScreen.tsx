import { Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AuthLoadingScreenProps {
  /** Optional message; defaults to "Loading..." or i18n equivalent */
  message?: string;
  /** Use compact style (e.g. inside a card). Default is full-screen. */
  variant?: 'fullscreen' | 'inline' | 'overlay';
  /** Optional class for the container */
  className?: string;
}

/**
 * Shared loading UI for authentication flows:
 * - Initial auth check (ProtectedRoute reading localStorage)
 * - Can be reused for login overlay (variant="overlay") or inline states
 */
export function AuthLoadingScreen({
  message,
  variant = 'fullscreen',
  className = '',
}: AuthLoadingScreenProps) {
  const { t } = useTranslation();
  const label = message ?? t('common.loading');

  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center justify-center gap-2 py-4 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <Loader className="w-5 h-5 animate-spin text-blue-600" aria-hidden />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div
        className={`absolute inset-0 rounded-2xl bg-white/60 flex items-center justify-center z-20 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-10 h-10 animate-spin text-blue-600" aria-hidden />
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      </div>
    );
  }

  // fullscreen (default)
  return (
    <div
      className={`flex items-center justify-center min-h-screen ${className}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="text-center">
        <Loader
          className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4"
          aria-hidden
        />
        <p className="text-gray-600">{label}</p>
      </div>
    </div>
  );
}
