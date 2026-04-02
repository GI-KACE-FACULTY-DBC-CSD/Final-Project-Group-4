
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { ConfirmModal } from '../../components/ConfirmModal';
import { getCourses, getCourseModules, createCourseModule, deleteCourseModule, createCourse, deleteCourse, updateCourse } from '../../services/api';
import { Course, CourseModule } from '../../types';
import { Plus, Edit2, Trash2, BookOpen, ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

const DAYS = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
] as const;

export function AdminCourses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [courseModules, setCourseModules] = useState<Record<string, CourseModule[]>>({});
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState<string | null>(null);
  const [showAddModuleForm, setShowAddModuleForm] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    modules: [] as string[],
    scheduleDays: [] as string[],
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    code: '',
    modules: [] as string[],
    scheduleDays: [] as string[],
  });
  const [moduleFormData, setModuleFormData] = useState({ name: '' });
  const [newModuleName, setNewModuleName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<
    { kind: 'course'; id: string; name: string } | { kind: 'module'; id: string; courseId: string; name: string } | null
  >(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courses;
    const q = searchQuery.toLowerCase().trim();
    return courses.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.code || '').toLowerCase().includes(q)
    );
  }, [courses, searchQuery]);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
      setError('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const loadModules = async (courseId: string) => {
    try {
      const modules = await getCourseModules(courseId);
      setCourseModules((prev) => ({ ...prev, [courseId]: modules }));
    } catch (err) {
      console.error('Failed to load modules:', err);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code) return;

    setSubmitting(true);
    try {
      const payload: any = {
        name: formData.name,
        code: formData.code,
        schedule_days: formData.scheduleDays.length > 0 ? formData.scheduleDays : undefined,
      };
      if (formData.modules.length > 0) {
        payload.modules = formData.modules.map((name, i) => ({ name: name.trim(), sort_order: i })).filter((m) => m.name);
      }
      const newCourse = await createCourse(payload);
      setCourses([...courses, newCourse]);
      setFormData({ name: '', code: '', modules: [], scheduleDays: [] });
      setNewModuleName('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error('Failed to add course:', err);
      setError(err.response?.data?.message || 'Failed to add course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = (course: Course) => {
    setDeleteConfirm({ kind: 'course', id: course.id, name: course.name });
  };

  const doDeleteCourse = async () => {
    if (!deleteConfirm || deleteConfirm.kind !== 'course') return;
    setDeleteLoading(true);
    try {
      await deleteCourse(deleteConfirm.id);
      setCourses(courses.filter((c) => c.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Failed to delete course:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete course.';
      setError(msg);
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditCourse = (course: Course) => {
    const moduleNames = (course.modules || []).map((m) => (typeof m === 'string' ? m : m.name));
    setEditFormData({
      name: course.name,
      code: course.code || '',
      modules: moduleNames,
      scheduleDays: course.schedule_days || [],
    });
    setShowEditForm(course.id);
  };

  const handleSaveEdit = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.code) return;

    setSubmitting(true);
    try {
      const payload: any = {
        name: editFormData.name,
        code: editFormData.code,
        schedule_days: editFormData.scheduleDays,
        modules: editFormData.modules.map((name, i) => ({ name: name.trim(), sort_order: i })).filter((m) => m.name),
      };
      const updatedCourse = await updateCourse(courseId, payload);
      setCourses(courses.map((c) => (c.id === courseId ? updatedCourse : c)));
      setShowEditForm(null);
      setEditFormData({ name: '', code: '', modules: [], scheduleDays: [] });
    } catch (err: any) {
      console.error('Failed to update course:', err);
      setError(err.response?.data?.message || 'Failed to update course');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent, courseId: string) => {
    e.preventDefault();
    if (!moduleFormData.name) return;

    setSubmitting(true);
    try {
      const newModule = await createCourseModule(courseId, { name: moduleFormData.name, sort_order: 0 });
      setCourseModules((prev) => ({
        ...prev,
        [courseId]: [...(prev[courseId] || []), newModule],
      }));
      setModuleFormData({ name: '' });
      setShowAddModuleForm(null);
    } catch (err: any) {
      console.error('Failed to add module:', err);
      setError(err.response?.data?.message || 'Failed to add module');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = (moduleId: string, courseId: string) => {
    const name = courseModules[courseId]?.find((m) => m.id === moduleId)?.name ?? 'this module';
    setDeleteConfirm({ kind: 'module', id: moduleId, courseId, name });
  };

  const doDeleteModule = async () => {
    if (!deleteConfirm || deleteConfirm.kind !== 'module') return;
    setDeleteLoading(true);
    try {
      await deleteCourseModule(deleteConfirm.id);
      setCourseModules((prev) => ({
        ...prev,
        [deleteConfirm.courseId]: (prev[deleteConfirm.courseId] || []).filter((m) => m.id !== deleteConfirm.id),
      }));
      setDeleteConfirm(null);
    } catch (err: any) {
      console.error('Failed to delete module:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete module.';
      setError(msg);
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteConfirm?.kind === 'course') doDeleteCourse();
    else if (deleteConfirm?.kind === 'module') doDeleteModule();
  };

  const toggleExpand = async (courseId: string) => {
    if (expandedCourseId === courseId) {
      setExpandedCourseId(null);
    } else {
      if (!courseModules[courseId]) {
        await loadModules(courseId);
      }
      setExpandedCourseId(courseId);
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

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <ConfirmModal
        isOpen={!!deleteConfirm}
        title={deleteConfirm?.kind === 'course' ? 'Delete course' : 'Delete module'}
        message={
          deleteConfirm?.kind === 'course'
            ? `Are you sure you want to delete the course "${deleteConfirm.name}"? This action cannot be undone.`
            : deleteConfirm?.kind === 'module'
            ? `Are you sure you want to delete the module "${deleteConfirm.name}"? This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => { setDeleteConfirm(null); setError(''); }}
      />
      <div className="max-w-6xl mx-auto px-2">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-red-800 font-semibold hover:underline shrink-0 ml-2">Dismiss</button>
          </div>
        )}
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary rounded-lg">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Course Management</h1>
                <p className="text-sm text-gray-600 mt-1">Create and manage courses with modules</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Course
            </button>
          </div>
        </div>

        {/* Add Course Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">New Course</h2>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            <form onSubmit={handleAddCourse} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50"
                    placeholder="e.g., Introduction to React"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50"
                    placeholder="e.g., CS101"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Class days</label>
                <p className="text-xs text-gray-500 mb-2">Select the days this class will run (e.g. Mon–Fri)</p>
                <div className="flex flex-wrap gap-4">
                  {DAYS.map(({ value, label }) => (
                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.scheduleDays.includes(value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, scheduleDays: [...formData.scheduleDays, value] });
                          } else {
                            setFormData({ ...formData, scheduleDays: formData.scheduleDays.filter((d) => d !== value) });
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Modules</label>
                <p className="text-xs text-gray-500 mb-2">Add module names for this course (optional)</p>
                <div className="space-y-2">
                  {formData.modules.map((name, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 w-6">{i + 1}.</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          const next = [...formData.modules];
                          next[i] = e.target.value;
                          setFormData({ ...formData, modules: next });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Module name"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, modules: formData.modules.filter((_, j) => j !== i) })}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove module"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newModuleName}
                      onChange={(e) => setNewModuleName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newModuleName.trim()) {
                            setFormData({ ...formData, modules: [...formData.modules, newModuleName.trim()] });
                            setNewModuleName('');
                          }
                        }
                      }}
                      placeholder="Type module name and press Enter or click Add"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newModuleName.trim()) {
                          setFormData({ ...formData, modules: [...formData.modules, newModuleName.trim()] });
                          setNewModuleName('');
                        }
                      }}
                      className="px-4 py-2 bg-gray-100 text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || !formData.name || !formData.code}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={submitting}
                  className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
              placeholder="Search courses by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              aria-label="Search courses"
            />
          </div>
          <button
            type="button"
            onClick={() => setSearchQuery(searchQuery)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold"
          >
            <Search className="w-5 h-5" />
            Search
          </button>
        </div>

        {/* Courses List with Modules */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading courses...</p>
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium">{courses.length === 0 ? 'No courses found yet' : 'No courses match your search'}</p>
              <p className="text-sm mt-2">{courses.length === 0 ? 'Create one to get started' : 'Try a different search term'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredCourses.map((course) => (
                <div key={course.id} className="p-6 hover:bg-gray-100 transition-colors">
                  {/* Course Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <button
                        onClick={() => toggleExpand(course.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {expandedCourseId === course.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-600 flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-block px-2 py-1 bg-blue-100 text-primary rounded text-xs font-semibold">
                            {course.code}
                          </span>
                          {(course.schedule_days?.length ?? 0) > 0 && (
                            <span className="text-xs text-gray-500">
                              Days: {(course.schedule_days || []).map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCourse(course)}
                        className="text-primary hover:text-primary-dark hover:bg-gray-100 p-2 rounded-lg transition-all"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Edit Form */}
                  {showEditForm === course.id ? (
                    <form onSubmit={(e) => handleSaveEdit(e, course.id)} className="mt-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          placeholder="Course name"
                          required
                        />
                        <input
                          type="text"
                          value={editFormData.code}
                          onChange={(e) => setEditFormData((p) => ({ ...p, code: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                          placeholder="Course code"
                        />
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-600 block mb-2">Class days</span>
                        <div className="flex flex-wrap gap-3">
                          {DAYS.map(({ value, label }) => (
                            <label key={value} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editFormData.scheduleDays.includes(value)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setEditFormData((p) => ({ ...p, scheduleDays: [...p.scheduleDays, value] }));
                                  } else {
                                    setEditFormData((p) => ({ ...p, scheduleDays: p.scheduleDays.filter((d) => d !== value) }));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="text-xs text-gray-700">{label.slice(0, 3)}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-gray-600 block mb-2">Modules</span>
                        <div className="space-y-1.5">
                          {editFormData.modules.map((name, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                title="Course module name"
                                value={name}
                                onChange={(e) => {
                                  const next = [...editFormData.modules];
                                  next[i] = e.target.value;
                                  setEditFormData((p) => ({ ...p, modules: next }));
                                }}
                                className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setEditFormData((p) => ({ ...p, modules: p.modules.filter((_, j) => j !== i) }))
                                }
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                aria-label="Remove"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setEditFormData((p) => ({ ...p, modules: [...p.modules, ''] }))}
                            className="flex items-center gap-1 text-primary text-sm font-semibold hover:underline"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add module
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={submitting || !editFormData.name}
                          className="px-4 py-2 bg-primary text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEditForm(null);
                            setEditFormData({ name: '', code: '', modules: [], scheduleDays: [] });
                          }}
                          className="px-4 py-2 bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {/* Course Modules */}
                  {expandedCourseId === course.id && (
                    <div className="mt-6 pl-8 border-l-2 border-gray-300">
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Modules</h4>
                        {courseModules[course.id]?.length > 0 ? (
                          <div className="space-y-2">
                            {courseModules[course.id].map((module) => (
                              <div key={module.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{module.name}</p>
                                  <p className="text-xs text-gray-500">Order: {module.sort_order}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteModule(module.id, course.id)}
                                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded transition-all"
                                  title="Delete module"
                                  aria-label="Delete module"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No modules added yet</p>
                        )}
                      </div>

                      {/* Add Module Form */}
                      {showAddModuleForm === course.id ? (
                        <form onSubmit={(e) => handleAddModule(e, course.id)} className="flex gap-2">
                          <input
                            type="text"
                            value={moduleFormData.name}
                            onChange={(e) => setModuleFormData({ name: e.target.value })}
                            placeholder="Module name"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                          />
                          <button
                            type="submit"
                            disabled={submitting || !moduleFormData.name}
                            className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition-all disabled:opacity-50"
                          >
                            {submitting ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddModuleForm(null);
                              setModuleFormData({ name: '' });
                            }}
                            className="px-3 py-2 bg-gray-100 text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setShowAddModuleForm(course.id)}
                          className="flex items-center gap-1 text-primary hover:text-primary-dark text-sm font-semibold mt-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Module
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
