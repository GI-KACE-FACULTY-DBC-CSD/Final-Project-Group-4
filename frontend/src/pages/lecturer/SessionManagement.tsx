import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getSessions, getCurrentUser, getLecturers, getCourses, createSession } from '../../services/api';
import { ClassSession, Course } from '../../types';
import { Plus, Eye, X } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

const initialFormData = {
  name: '',
  course_id: '',
  start_datetime: '',
  end_datetime: '',
  location: '',
};

export function SessionManagement() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentLecturerId, setCurrentLecturerId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isCreateFormValid =
    (formData.name || '').trim() !== '' &&
    (formData.course_id || '').trim() !== '' &&
    (formData.start_datetime || '').trim() !== '' &&
    (formData.end_datetime || '').trim() !== '' &&
    (formData.location || '').trim() !== '';

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    const resolveLecturer = async () => {
      try {
        const [user, lecturersData, coursesData] = await Promise.all([
          getCurrentUser(),
          getLecturers(),
          getCourses(),
        ]);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
        if (user?.role === 'lecturer' && Array.isArray(lecturersData)) {
          const lecturer = lecturersData.find((l: { email?: string; id: string }) => (l.email || '').toLowerCase() === (user?.email || '').toLowerCase());
          if (lecturer) setCurrentLecturerId(lecturer.id);
        }
      } catch (err) {
        console.error('Failed to resolve lecturer/courses:', err);
      }
    };
    resolveLecturer();
  }, []);

  const handleCreateClick = () => {
    setFormError('');
    setFormData(initialFormData);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!currentLecturerId) {
      setFormError('Could not determine your lecturer account.');
      return;
    }
    if (!formData.name || !formData.course_id || !formData.start_datetime || !formData.end_datetime || !formData.location) {
      setFormError('All fields are required.');
      return;
    }
    const startDate = new Date(formData.start_datetime);
    const endDate = new Date(formData.end_datetime);
    if (startDate >= endDate) {
      setFormError('Start time must be before end time.');
      return;
    }
    setSubmitting(true);
    try {
      await createSession({
        name: formData.name,
        lecturer_id: currentLecturerId,
        course_id: formData.course_id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        location: formData.location,
      });
      setShowForm(false);
      setFormData(initialFormData);
      setLoading(true);
      await loadSessions();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Failed to create session.');
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const sidebarLinks = [
    { label: t('common.dashboard'), href: '/lecturer/dashboard' },
    { label: t('navigation.lecturerSessions'), href: '/lecturer/sessions' },
    { label: t('navigation.lecturerAttendance'), href: '/lecturer/attendance' },
    { label: t('navigation.lecturerPerformance'), href: '/lecturer/performance' },
  ];

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('pages.sessionManagement')}</h1>
          <button
            type="button"
            onClick={handleCreateClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('buttons.createSession')}
          </button>
        </div>

        {/* Create Session Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('buttons.createSession')}</h2>
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormError(''); }}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {formError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">{formError}</div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('sessions.sessionName')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('sessions.sessionName')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('sessions.course') || 'Course'} <span className="text-red-500">*</span></label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  title={t('sessions.course') || 'Select a course'}
                  required
                >
                  <option value="">{t('sessions.selectCourse') || 'Select a course'}</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('sessions.startTime') || 'Start Date & Time'} <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={formData.start_datetime}
                  onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  title={t('sessions.startTime') || 'Start Date & Time'}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('sessions.endTime') || 'End Date & Time'} <span className="text-red-500">*</span></label>
                <input
                  type="datetime-local"
                  value={formData.end_datetime}
                  onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  title={t('sessions.endTime') || 'End Date & Time'}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-900 mb-2">{t('sessions.location')} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder={t('sessions.location')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              <div className="md:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting || !isCreateFormValid}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  {submitting ? t('common.loading') || 'Saving...' : t('buttons.createSession')}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(''); }}
                  className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t('sessions.noSessionsFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('sessions.sessionName')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('table.time')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('sessions.location')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('sessions.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('sessions.attendance', 'Attendance')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {session.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(session.start_time).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{session.location}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            session.status === 'ongoing'
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'completed'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {session.attendance_count}/{session.total_students}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => navigate('/lecturer/attendance', { state: { sessionId: session.id } })}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                          {t('view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
