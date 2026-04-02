import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginUser } from '../services/api';
import { AlertCircle, Loader } from 'lucide-react';
import { GIKACELogo } from '../components/Logo';
import { AuthLoadingScreen } from '../components/common/AuthLoadingScreen';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth, isAuthenticated, user } = useAuth();
  const { t } = useTranslation();
  const vantaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (vantaRef.current && (window as any).VANTA) {
      (window as any).VANTA.RINGS({
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        backgroundColor: 0xffffff,
        color: 0x7aff00,
      });
    }
  }, []);

  if (isAuthenticated && user?.role !== 'admin') {
    const dashboardMap: Record<string, string> = {
      lecturer: '/lecturer/dashboard',
      student: '/student/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user?.role || 'student']} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await loginUser(email, password);

      if (response.user.role === 'admin') {
        // Don't reveal that this is an admin account, treat as invalid login
        setError(t('auth.invalidCredentials'));
        setLoading(false);
        return;
      }

      const token = response.plainTextToken || response.token;
      setAuth(response.user, token);

      const dashboardMap: Record<string, string> = {
        lecturer: '/lecturer/dashboard',
        student: '/student/dashboard',
      };
      navigate(dashboardMap[response.user.role] || '/student/dashboard', { replace: true });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || t('auth.invalidCredentials');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden auth-form">
      <div ref={vantaRef} className="absolute inset-0 z-0"></div>
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>
      <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 relative z-10">
        {loading && (
          <AuthLoadingScreen variant="overlay" message={t('auth.signingIn')} />
        )}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <GIKACELogo />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">GI-KACE</h1>
          <p className="text-sm text-gray-600 mt-1">{t('navigation.studentDashboard')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:bg-gray-50"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">{t('auth.password')}</label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:bg-gray-50"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {loading ? t('auth.signingIn') : t('auth.login')}
          </button>
        </form>
      </div>
    </div>
  );
}
