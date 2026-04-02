import { LogOut, Menu, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GIKACELogo } from '../Logo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { updateProfile, changeUserPassword } from '../../services/api';

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { user, logout, setAuth, token } = useAuth();
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [profileName, setProfileName] = useState(user?.name ?? '');
  const [profileEmail, setProfileEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleLogout = () => {
    setShowDropdown(false);
    logout();
    window.location.href = user?.role === 'admin' ? '/admin/login' : '/login';
  };

  const displayRole = (user?.role ?? '').replace(/\s+user$/i, '').trim() || '—';
  const displayRoleLabel = displayRole !== '—' ? displayRole.charAt(0).toUpperCase() + displayRole.slice(1).toLowerCase() : '—';

  const openSettings = () => {
    setShowDropdown(false);
    setShowSettings(true);
    setProfileName(user?.name ?? '');
    setProfileEmail(user?.email ?? '');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setProfileError('');
    setProfileSuccess('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    if (!profileName.trim() || !profileEmail.trim()) {
      setProfileError('Name and email are required.');
      return;
    }
    setSavingProfile(true);
    try {
      const updatedUser = await updateProfile({ name: profileName.trim(), email: profileEmail.trim() });
      if (token) setAuth(updatedUser, token);
      setProfileSuccess('Profile updated successfully.');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    setSavingPassword(true);
    try {
      await changeUserPassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Current password is incorrect or request failed.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
            title={t('common.dashboard')}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <GIKACELogo />
          <h1 className="text-xl font-semibold text-gray-800 capitalize">
            {user?.name || t('common.dashboard')}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {(user?.role === 'admin' || user?.role === 'student') && (
            <Link
              to={user?.role === 'admin' ? '/admin/alerts' : '/student/alerts'}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-900"
              title={user?.role === 'admin' ? t('navigation.adminAlerts') : t('navigation.studentAlerts')}
              aria-label="Alerts"
            >
              <Bell className="w-5 h-5" />
            </Link>
          )}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Account menu"
              aria-expanded={showDropdown}
              aria-haspopup="menu"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.email}</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-xs text-gray-500">{displayRoleLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { openSettings(); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  {t('auth.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Settings</h2>
              <button type="button" onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Credentials (role read-only) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Your credentials</h3>
                <div className="rounded-lg bg-gray-50 p-3 mb-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                  <p className="text-gray-900 font-medium">{displayRoleLabel}</p>
                </div>
                <p className="text-xs text-gray-500 mb-2">You can change your name and email below. Role cannot be changed.</p>
              </div>

              {/* Profile form */}
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Profile</h3>
                {profileError && <p className="text-sm text-red-600">{profileError}</p>}
                {profileSuccess && <p className="text-sm text-green-600">{profileSuccess}</p>}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <button type="submit" disabled={savingProfile} className="w-full py-2 bg-secondary text-white rounded-lg hover:bg-gold-dark disabled:opacity-50">
                  {savingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </form>

              {/* Change password form */}
              <form onSubmit={handleChangePassword} className="space-y-3 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">Change password</h3>
                {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-600">{passwordSuccess}</p>}
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingPassword ? 'Saving...' : 'Change password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
