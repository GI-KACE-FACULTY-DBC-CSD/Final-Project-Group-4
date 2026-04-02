import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { ConfirmModal } from '../../components/ConfirmModal';
import { getSessions, getCourses, getLecturers, createSession, updateSession, deleteSession } from '../../services/api';
import { ClassSession, Course, Lecturer } from '../../types';
import { Calendar, Plus, Edit2, Trash2, Clock, MapPin, Search } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

function formatSessionDate(value: string | undefined): string {
  if (!value) return 'N/A';
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
  } catch {
    return 'N/A';
  }
}

export function AdminSessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    lecturer_id: '',
    start_datetime: '',
    end_datetime: '',
    location: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase().trim();
    return sessions.filter((session) => {
      const sessionName = (session.name || '').toLowerCase();
      const courseName = (courses.find((c) => c.id === session.course_id)?.name || '').toLowerCase();
      const courseCode = (courses.find((c) => c.id === session.course_id)?.code || '').toLowerCase();
      const lecturerName = (lecturers.find((l) => l.id === session.lecturer_id)?.name || lecturers.find((l) => l.id === session.lecturer_id)?.user?.name || '').toLowerCase();
      const location = (session.location || '').toLowerCase();
      return (
        sessionName.includes(q) ||
        courseName.includes(q) ||
        courseCode.includes(q) ||
        lecturerName.includes(q) ||
        location.includes(q)
      );
    });
  }, [sessions, searchQuery, courses, lecturers]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sessionsData, coursesData, lecturersData] = await Promise.all([
        getSessions(),
        getCourses(),
        getLecturers(),
      ]);
      setSessions(Array.isArray(sessionsData) ? sessionsData : []);
      setCourses(Array.isArray(coursesData) ? coursesData : []);
      setLecturers(Array.isArray(lecturersData) ? lecturersData : []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load data');
      setSessions([]);
      setCourses([]);
      setLecturers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.name || !formData.course_id || !formData.lecturer_id || !formData.start_datetime || !formData.end_datetime || !formData.location) {
      setError('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        course_id: formData.course_id,
        lecturer_id: formData.lecturer_id,
        start_time: new Date(formData.start_datetime).toISOString(),
        end_time: new Date(formData.end_datetime).toISOString(),
        location: formData.location,
      };

      if (editId) {
        const updated = await updateSession(editId, payload);
        setSessions(sessions.map((s) => (s.id === editId ? updated : s)));
      } else {
        const created = await createSession(payload);
        setSessions([...sessions, created]);
      }

      setShowForm(false);
      setFormData({
        name: '',
        course_id: '',
        lecturer_id: '',
        start_datetime: '',
        end_datetime: '',
        location: '',
      });
      setEditId(null);
    } catch (err: any) {
      console.error('Failed to save session:', err);
      setError(err.response?.data?.message || 'Failed to save session');
    } finally {
      setSubmitting(false);
    }
  };

  // Validate times: start must be before end
  const startDate = formData.start_datetime ? new Date(formData.start_datetime) : null;
  const endDate = formData.end_datetime ? new Date(formData.end_datetime) : null;
  const timeError = startDate && endDate && startDate >= endDate ? 'Start time must be before end time' : '';

  const isFormValid =
    !!formData.name?.trim() &&
    !!formData.course_id &&
    !!formData.lecturer_id &&
    !!formData.start_datetime &&
    !!formData.end_datetime &&
    !!formData.location?.trim() &&
    !timeError;

  const handleEdit = (session: ClassSession) => {
    setEditId(session.id);
    let startStr = '';
    let endStr = '';
    try {
      if (session.start_time) { const d = new Date(session.start_time); if (!isNaN(d.getTime())) startStr = d.toISOString().slice(0, 16); }
      if (session.end_time) { const d = new Date(session.end_time); if (!isNaN(d.getTime())) endStr = d.toISOString().slice(0, 16); }
    } catch (_) {}
    setFormData({
      name: session.name || '',
      course_id: session.course_id || '',
      lecturer_id: session.lecturer_id || '',
      start_datetime: startStr,
      end_datetime: endStr,
      location: session.location || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteSessionId(id);
  };

  const doDeleteSession = async () => {
    if (!deleteSessionId) return;
    setDeleteLoading(true);
    try {
      await deleteSession(deleteSessionId);
      setSessions(sessions.filter((s) => s.id !== deleteSessionId));
      setDeleteSessionId(null);
    } catch (err: any) {
      console.error('Failed to delete session:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete session.';
      setError(msg);
      setDeleteSessionId(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const sidebarLinks = [
    { label: t('navigation.adminDashboard'), href: '/admin/dashboard' },
    { label: t('navigation.adminStudents'), href: '/admin/students' },
    { label: t('navigation.adminLecturers'), href: '/admin/lecturers' },
    { label: t('navigation.adminCourses'), href: '/admin/courses' },
    { label: t('navigation.adminSessions'), href: '/admin/sessions' },
    { label: t('navigation.adminBiometricEnrollment'), href: '/admin/enrollment' },
    { label: t('navigation.adminReports'), href: '/admin/reports' },
  ];

  if (loading) {
    return (
      <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <ConfirmModal
        isOpen={!!deleteSessionId}
        title="Delete session"
        message={
          deleteSessionId
            ? `Are you sure you want to delete this session?${sessions.find((s) => s.id === deleteSessionId)?.name ? ` "${sessions.find((s) => s.id === deleteSessionId)?.name}" will be removed.` : ''} This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        isLoading={deleteLoading}
        onConfirm={doDeleteSession}
        onCancel={() => setDeleteSessionId(null)}
      />
      <div className="max-w-6xl mx-auto px-2">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => { setError(''); loadData(); }}
              className="text-sm font-semibold text-red-800 hover:underline shrink-0 ml-2"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-secondary rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
                <p className="text-sm text-gray-600 mt-1">Create and manage class sessions</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowForm(true);
                setEditId(null);
                setError('');
                setFormData({
                  name: '',
                  course_id: '',
                  lecturer_id: '',
                  start_datetime: '',
                  end_datetime: '',
                  location: '',
                });
              }}
              className="flex items-center gap-2 bg-secondary text-white px-6 py-3 rounded-lg hover:bg-gold-dark hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              New Session
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editId ? 'Edit Session' : 'Create New Session'}
            </h2>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            {timeError && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-100 text-amber-700 rounded">
                {timeError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Session Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Introduction to React"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.course_id}
                  onChange={(e) =>
                    setFormData({ ...formData, course_id: e.target.value })
                  }
                  aria-label="Select course"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all bg-gray-50"
                  required
                >
                  <option value="">Select a course</option>
                  {(courses || []).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Lecturer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.lecturer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, lecturer_id: e.target.value })
                  }
                  aria-label="Select lecturer"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all bg-gray-50"
                  required
                >
                  <option value="">Select a lecturer</option>
                  {(lecturers || []).map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name || (lecturer as any).user?.name || (lecturer as any).lecturerId || (lecturer as any).lecturer_id || 'Lecturer'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  placeholder="Select start date and time"
                  value={formData.start_datetime}
                  onChange={(e) =>
                    setFormData({ ...formData, start_datetime: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  End Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  placeholder="Select end date and time"
                  value={formData.end_datetime}
                  onChange={(e) =>
                    setFormData({ ...formData, end_datetime: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all bg-gray-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Room 101"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all bg-gray-50"
                  required
                />
              </div>

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || !isFormValid}
                  className="flex-1 bg-secondary text-white py-3 rounded-lg hover:bg-gold-dark transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Saving...' : editId ? 'Update Session' : 'Create Session'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions by name, course, lecturer, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent bg-white"
              aria-label="Search sessions"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-lg hover:bg-gold-dark transition-all font-semibold"
          >
            <Search className="w-5 h-5" />
            Search
          </button>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {(filteredSessions || []).length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">{(sessions || []).length === 0 ? 'No sessions yet' : 'No sessions match your search'}</p>
              <p className="text-sm text-gray-500 mt-2">{(sessions || []).length === 0 ? 'Create your first session to get started' : 'Try a different search term'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Session Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Lecturer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Date & Time
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(filteredSessions || []).map((session) => (
                    <tr key={session.id} className="hover:bg-gray-100 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <p className="font-semibold text-gray-900">{session.name || 'N/A'}</p>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {(courses || []).find((c) => c.id === session.course_id)?.name || 'N/A'}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {(courses || []).find((c) => c.id === session.course_id)?.code}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {(lecturers || []).find((l) => l.id === session.lecturer_id)?.name || (lecturers || []).find((l) => l.id === session.lecturer_id)?.user?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-start gap-2">
                          <Clock className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                          <div className="flex flex-col gap-0.5">
                            <span><strong>Start:</strong> {formatSessionDate(session.start_time)}</span>
                            <span><strong>End:</strong> {formatSessionDate(session.end_time)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-secondary" />
                          {session.location || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            session.status === 'ongoing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : session.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {session.status || 'scheduled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm flex gap-3">
                        <button
                          onClick={() => handleEdit(session)}
                          className="text-secondary hover:text-gold-dark hover:bg-gray-100 p-2 rounded-lg transition-all"
                          title="Edit"
                          aria-label="Edit session"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                          title="Delete"
                          aria-label="Delete session"
                        >
                          <Trash2 className="w-4 h-4" />
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
