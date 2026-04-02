import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getRandomBackgroundImage } from '../../utils/bgImages';
import {
  getGamificationMe,
  getGamificationLeaderboard,
  getGamificationPrivileges,
  redeemPrivilege,
} from '../../services/api';
import {
  GamificationMe,
  GamificationLeaderboard,
  RedeemablePrivilege,
} from '../../types';
import {
  Award,
  Flame,
  Trophy,
  Coins,
  Gift,
  TrendingUp,
  Star,
  Calendar,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  calendar: Calendar,
  trophy: Trophy,
  flame: Flame,
  award: Award,
};

export function StudentRewards() {
  const { t } = useTranslation();
  const [me, setMe] = useState<GamificationMe | null>(null);
  const [leaderboard, setLeaderboard] = useState<GamificationLeaderboard | null>(null);
  const [privileges, setPrivileges] = useState<RedeemablePrivilege[]>([]);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadData = async () => {
    setError('');
    try {
      const [meData, leaderboardData, privilegesData] = await Promise.all([
        getGamificationMe(),
        getGamificationLeaderboard(period),
        getGamificationPrivileges(),
      ]);
      setMe(meData);
      setLeaderboard(leaderboardData);
      setPrivileges(privilegesData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load rewards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!loading) {
      getGamificationLeaderboard(period).then(setLeaderboard).catch(() => {});
    }
  }, [period]);

  const handleRedeem = async (privilegeId: string) => {
    setRedeemingId(privilegeId);
    setError('');
    try {
      await redeemPrivilege(privilegeId);
      await loadData();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Redemption failed.');
    } finally {
      setRedeemingId(null);
    }
  };

  const sidebarLinks = [
    { label: t('navigation.studentDashboard'), href: '/student/dashboard' },
    { label: t('navigation.attendanceHistory'), href: '/student/history' },
    { label: t('navigation.studentSessions'), href: '/student/sessions' },
    { label: t('navigation.studentAlerts'), href: '/student/alerts' },
    { label: t('navigation.studentRewards') || 'Rewards', href: '/student/rewards' },
  ];

  if (loading) {
    return (
      <AppLayout sidebarLinks={sidebarLinks}>
        <div className="max-w-6xl mx-auto flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Award className="w-8 h-8 text-amber-500" />
          {t('navigation.studentRewards') || 'Rewards & Achievements'}
        </h1>
        <p className="text-gray-600 mb-8">
          {t('gamification.subtitle') || 'Earn points, unlock badges, and redeem rewards for perfect attendance.'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>
        )}

        {/* Points & Streaks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-100">
            <div className="flex items-center gap-3 mb-2">
              <Coins className="w-8 h-8 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">{t('gamification.points') || 'Points'}</span>
            </div>
            <p className="text-3xl font-bold text-amber-900">{me?.points_balance ?? 0}</p>
            <p className="text-xs text-amber-700 mt-1">{t('gamification.balance') || 'Available balance'}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-8 h-8 text-orange-600" />
              <span className="text-sm font-semibold text-orange-800">{t('gamification.weekStreak') || 'Week streak'}</span>
            </div>
            <p className="text-3xl font-bold text-orange-900">{me?.streaks?.current_week_streak ?? 0}</p>
            <p className="text-xs text-orange-700 mt-1">{t('gamification.consecutiveWeeks') || 'Consecutive perfect weeks'}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">{t('gamification.perfectWeeks') || 'Perfect weeks'}</span>
            </div>
            <p className="text-3xl font-bold text-emerald-900">{me?.streaks?.perfect_weeks ?? 0}</p>
          </div>
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-100">
            <div className="flex items-center gap-3 mb-2">
              <Trophy className="w-8 h-8 text-violet-600" />
              <span className="text-sm font-semibold text-violet-800">{t('gamification.perfectMonths') || 'Perfect months'}</span>
            </div>
            <p className="text-3xl font-bold text-violet-900">{me?.streaks?.perfect_months ?? 0}</p>
          </div>
        </div>

        {/* Badges / Achievements */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            {t('gamification.badges') || 'Badges & Achievements'}
          </h2>
          {me?.badges?.length ? (
            <div className="flex flex-wrap gap-4">
              {me.badges.map((b) => {
                const Icon = iconMap[b.icon] || Award;
                return (
                  <div
                    key={b.key}
                    className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-lg border border-amber-100"
                  >
                    <div className="p-2 bg-amber-100 rounded-full">
                      <Icon className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{b.label}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(b.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">{t('gamification.noBadgesYet') || 'Earn badges by checking in and building streaks!'}</p>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            {t('gamification.leaderboard') || 'Leaderboard'}
          </h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-lg font-medium ${period === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {t('gamification.thisWeek') || 'This week'}
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-lg font-medium ${period === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              {t('gamification.thisMonth') || 'This month'}
            </button>
          </div>
          {leaderboard?.leaderboard?.length ? (
            <ul className="space-y-2">
              {leaderboard.leaderboard.map((entry) => (
                <li
                  key={entry.rank}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg ${
                    entry.rank === leaderboard.my_rank ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-900">
                    #{entry.rank} {entry.label}
                    {entry.rank === leaderboard.my_rank && (
                      <span className="ml-2 text-blue-600 text-sm">(You)</span>
                    )}
                  </span>
                  <span className="font-semibold text-amber-600">{entry.points} pts</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">{t('gamification.noLeaderboardYet') || 'Check in to appear on the leaderboard!'}</p>
          )}
        </div>

        {/* Redeemable privileges */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Gift className="w-6 h-6 text-emerald-500" />
            {t('gamification.redeem') || 'Redeem rewards'}
          </h2>
          {privileges.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {privileges.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-emerald-200 bg-gray-50"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{p.name}</p>
                    {p.description && (
                      <p className="text-sm text-gray-600 mt-1">{p.description}</p>
                    )}
                    <p className="text-amber-600 font-medium mt-2">{p.points_cost} pts</p>
                  </div>
                  <button
                    onClick={() => handleRedeem(p.id)}
                    disabled={(me?.points_balance ?? 0) < p.points_cost || redeemingId === p.id}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {redeemingId === p.id ? (t('common.loading') || '...') : (t('gamification.redeemBtn') || 'Redeem')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">{t('gamification.noPrivileges') || 'No rewards available at the moment.'}</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
