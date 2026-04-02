import { useEffect, useState, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import {
  getStudents,
  getLecturers,
  getCourses,
  createStudent,
  createLecturer,
  updateStudent,
  updateLecturer,
  deleteStudent,
  deleteLecturer,
  enrollFaceBiometric,
} from '../../services/api';
import { faceApiService } from '../../services/faceApiService';
import { Student, Lecturer } from '../../types';
import { Plus, Edit2, Trash2, Users, Search, Loader, Camera } from 'lucide-react';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/Toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { getRandomBackgroundImage } from '../../utils/bgImages';

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
}

export function AdminUsers() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab: 'students' | 'lecturers' = location.pathname === '/admin/lecturers' ? 'lecturers' : 'students';
  const [students, setStudents] = useState<Student[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [enrollModalStudent, setEnrollModalStudent] = useState<Student | null>(null);
  const [faceApiInitialized, setFaceApiInitialized] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [enrollLoading, setEnrollLoading] = useState(false);
  const [enrollModalMessage, setEnrollModalMessage] = useState('');
  const [enrollModalMessageType, setEnrollModalMessageType] = useState<'success' | 'error' | ''>('');
  const enrollVideoRef = useRef<HTMLVideoElement>(null);

  const { toasts, success, error, removeToast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: activeTab === 'students' ? 'student' : 'lecturer',
    course_id: '',
    department: '',
    biometric_template: '',
    face_image: '',
  });

  const isFormValid = useMemo(() => {
    if (!formData.name.trim()) return false;
    if (!formData.email.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
    if (activeTab === 'lecturers' && !formData.department.trim()) return false;
    if (activeTab === 'students' && !formData.course_id) return false;
    // When creating: password is optional (defaults to "password"); if provided, must be 8+ chars
    if (!isEditing && formData.password.trim().length > 0 && formData.password.length < 8) return false;
    return true;
  }, [formData, activeTab, isEditing]);

  const loadData = async () => {
    try {
      const [studentsData, lecturersData, coursesData] = await Promise.all([
        getStudents(),
        getLecturers(),
        getCourses(),
      ]);
      setStudents(studentsData);
      setLecturers(lecturersData);
      setCourses(coursesData || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      error('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!enrollModalStudent) {
      if (enrollVideoRef.current?.srcObject) {
        const tracks = (enrollVideoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
      setCameraActive(false);
      return;
    }
    let cancelled = false;
    faceApiService.initialize().then(() => {
      if (!cancelled) setFaceApiInitialized(true);
    }).catch((err) => {
      if (!cancelled) {
        setEnrollModalMessage(err?.message || 'Failed to initialize face recognition');
        setEnrollModalMessageType('error');
      }
    });
    return () => { cancelled = true; };
  }, [enrollModalStudent]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      `${s.name || s.user?.name || ''}${s.email || s.user?.email || ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  const filteredLecturers = useMemo(() => {
    return lecturers.filter((l) =>
      `${l.name || l.user?.name || ''}${l.email || l.user?.email || ''}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [lecturers, searchQuery]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (formData.phone && !/^\d{7,}$/.test(formData.phone.replace(/\D/g, ''))) {
      errors.phone = 'Invalid phone number';
    }

    if (activeTab === 'lecturers' && !formData.department.trim()) {
      errors.department = 'Department is required';
    }
    

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      role: activeTab === 'students' ? 'student' : 'lecturer',
      course_id: '',
      department: '',
      biometric_template: '',
      face_image: '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (user: Student | Lecturer) => {
    setIsEditing(true);
    setEditingId(user.id);
    setFormData({
      name: user.name || (user as any).user?.name || '',
      email: user.email || (user as any).user?.email || '',
      password: '',
      phone: (user as any).phone || (user as any).user?.phone || '',
      role: activeTab === 'students' ? 'student' : 'lecturer',
      course_id: (user as Student).course_id || (user as Student).courseId || '',
      department: (user as Lecturer).department || '',
      biometric_template: (user as Student).biometric_template || '',
      face_image: (user as Student).face_image || '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      error('Please fix the errors in the form');
      return;
    }

    const password = formData.password?.trim() || 'password';
    if (!isEditing && password.length < 8) {
      setFormErrors((prev) => ({ ...prev, password: 'Password must be at least 8 characters' }));
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing && editingId) {
        if (activeTab === 'students') {
          await updateStudent(editingId, {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || undefined,
            course_id: formData.course_id || undefined,
          });
        } else {
          await updateLecturer(editingId, {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || undefined,
            department: formData.department.trim(),
          });
        }
        success(`${activeTab === 'students' ? 'Student' : 'Lecturer'} updated successfully!`);
        setShowForm(false);
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          role: activeTab === 'students' ? 'student' : 'lecturer',
          course_id: '',
          department: '',
          biometric_template: '',
          face_image: '',
        });
        setEditingId(null);
        await loadData();
      } else {
        if (activeTab === 'students') {
          const createdStudent = await createStudent({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password,
            course_id: formData.course_id,
          });
          success('Student created successfully!');
          setShowForm(false);
          setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            role: 'student',
            course_id: '',
            department: '',
            biometric_template: '',
            face_image: '',
          });
          setEditingId(null);
          await loadData();
          setEnrollModalMessage('');
          setEnrollModalMessageType('');
          setEnrollModalStudent(createdStudent);
        } else {
          await createLecturer({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password,
            department: formData.department.trim(),
          });
          success('Lecturer created successfully!');
          setShowForm(false);
          setFormData({
            name: '',
            email: '',
            password: '',
            phone: '',
            role: 'lecturer',
            course_id: '',
            department: '',
            biometric_template: '',
            face_image: '',
          });
          setEditingId(null);
          await loadData();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save. Please try again.';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;

    setSubmitting(true);
    try {
      if (activeTab === 'students') {
        await deleteStudent(deleteConfirm.id);
      } else {
        await deleteLecturer(deleteConfirm.id);
      }
      success(`${activeTab === 'students' ? 'Student' : 'Lecturer'} deleted successfully!`);
      setDeleteConfirm({ isOpen: false, id: null });
      await loadData();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete. Please try again.';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStudentDisplayName = (s: Student) => s.name || (s as any).user?.name || s.student_id || s.id || 'Student';

  const startEnrollCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (enrollVideoRef.current) {
        enrollVideoRef.current.srcObject = stream;
        setCameraActive(true);
        setEnrollModalMessage('Camera ready. Click "Enroll face" to register.');
        setEnrollModalMessageType('');
      }
    } catch (err) {
      setEnrollModalMessage('Unable to access camera. Please check permissions.');
      setEnrollModalMessageType('error');
    }
  };

  const stopEnrollCamera = () => {
    if (enrollVideoRef.current?.srcObject) {
      const tracks = (enrollVideoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      setCameraActive(false);
    }
  };

  const closeEnrollModal = () => {
    stopEnrollCamera();
    setEnrollModalStudent(null);
    setEnrollModalMessage('');
    setEnrollModalMessageType('');
  };

  const handleEnrollFace = async () => {
    if (!enrollModalStudent || !enrollVideoRef.current) return;
    setEnrollLoading(true);
    setEnrollModalMessage('');
    setEnrollModalMessageType('');
    try {
      const biometricData = await faceApiService.enrollFace(enrollVideoRef.current, enrollModalStudent.id);
      await enrollFaceBiometric(
        enrollModalStudent.id,
        biometricData.hash,
        biometricData.descriptor.toString(),
        biometricData.confidence
      );
      setEnrollModalMessage(`Face registered for ${getStudentDisplayName(enrollModalStudent)}. They can now check in with their face.`);
      setEnrollModalMessageType('success');
      setTimeout(() => {
        closeEnrollModal();
        loadData();
      }, 2000);
    } catch (err: any) {
      setEnrollModalMessage(err?.message || 'Face enrollment failed. Please try again.');
      setEnrollModalMessageType('error');
    } finally {
      setEnrollLoading(false);
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
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete User"
        message={`Are you sure you want to delete this ${activeTab === 'students' ? 'student' : 'lecturer'}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        isLoading={submitting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
      
      
      <div className="max-w-7xl mx-auto px-2">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary rounded-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                  <p className="text-sm text-gray-600 mt-1">{activeTab === 'students' ? 'Manage students' : 'Manage lecturers'}</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleAddClick}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark hover:shadow-lg transition-all font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add {activeTab === 'students' ? 'Student' : 'Lecturer'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          {/* Search Bar */}
          <div className="mb-4 relative">
            <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'students' ? 'students' : 'lecturers'} by name or email...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white`}
            />
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {isEditing ? 'Edit User Details' : `Add New ${activeTab === 'students' ? 'Student' : 'Lecturer'}`}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 border ${formErrors.name ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${formErrors.name ? 'focus:ring-red-500' : 'focus:ring-primary'} focus:border-transparent transition-all bg-gray-50`}
                />
                {formErrors.name && <p className="text-red-500 text-sm mt-2">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${formErrors.email ? 'focus:ring-red-500' : 'focus:ring-primary'} focus:border-transparent transition-all bg-gray-50`}
                />
                {formErrors.email && <p className="text-red-500 text-sm mt-2">{formErrors.email}</p>}
              </div>

              {!isEditing && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Min 8 characters (default: password)"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`w-full px-4 py-3 border ${formErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-gray-50`}
                  />
                  {formErrors.password && <p className="text-red-500 text-sm mt-2">{formErrors.password}</p>}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`w-full px-4 py-3 border ${formErrors.phone ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${formErrors.phone ? 'focus:ring-red-500' : 'focus:ring-primary'} focus:border-transparent transition-all bg-gray-50`}
                />
                {formErrors.phone && <p className="text-red-500 text-sm mt-2">{formErrors.phone}</p>}
              </div>

              {activeTab === 'lecturers' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter department name"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={`w-full px-4 py-3 border ${formErrors.department ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${formErrors.department ? 'focus:ring-red-500' : 'focus:ring-primary'} focus:border-transparent transition-all bg-gray-50`}
                  />
                  {formErrors.department && <p className="text-red-500 text-sm mt-2">{formErrors.department}</p>}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Course <span className="text-red-500">*</span></label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    aria-label="Select course"
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50`}
                  >
                    <option value="">Select course</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}{c.runSegment ? ` ${c.runSegment}` : ''})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2 flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || !isFormValid}
                  className={`flex-1 bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="flex-1 bg-gray-100 text-gray-900 py-3 rounded-lg hover:bg-gray-200 transition-all font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">Loading...</p>
              </div>
            </div>
          ) : activeTab === 'students' ? (
            <StudentTable
              students={filteredStudents}
              courses={courses}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ) : (
            <LecturerTable
              lecturers={filteredLecturers}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          )}
        </div>
      </div>

      {enrollModalStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" onClick={closeEnrollModal}>
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Register face for attendance</h2>
              <button type="button" onClick={closeEnrollModal} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Register a face for <strong>{getStudentDisplayName(enrollModalStudent)}</strong> so they can check in by scanning their face at sessions.
              </p>
              {enrollModalMessage && (
                <div className={`p-3 rounded-lg text-sm ${enrollModalMessageType === 'error' ? 'bg-red-50 text-red-700' : enrollModalMessageType === 'success' ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'}`}>
                  {enrollModalMessage}
                </div>
              )}
              {!faceApiInitialized ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader className="w-5 h-5 animate-spin" />
                  Initializing face recognition...
                </div>
              ) : (
                <>
                  <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={enrollVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!cameraActive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                        <div className="text-center">
                          <Camera className="w-12 h-12 mx-auto mb-2 opacity-70" />
                          <p className="text-sm">Camera off</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {!cameraActive ? (
                      <button type="button" onClick={startEnrollCamera} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                        Start camera
                      </button>
                    ) : (
                      <>
                        <button type="button" onClick={handleEnrollFace} disabled={enrollLoading} className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-gold-dark disabled:opacity-50 flex items-center gap-2">
                          {enrollLoading && <Loader className="w-4 h-4 animate-spin" />}
                          Enroll face
                        </button>
                        <button type="button" onClick={stopEnrollCamera} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                          Stop camera
                        </button>
                      </>
                    )}
                    <button type="button" onClick={closeEnrollModal} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                      Skip for now
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function StudentTable({
  students,
  courses,
  onEdit,
  onDelete,
}: {
  students: Student[];
  courses: any[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}) {
  if (students.length === 0) {
    return <div className="p-12 text-center text-gray-500">
      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="font-medium">No students found yet</p>
    </div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Email
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Course
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
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                {student.name || student.user?.name || `Student ${student.student_id || student.id}`}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{student.email || student.user?.email || '—'}</td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {student.courseName || courses.find(c => c.id === (student.course_id || student.courseId))?.name || student.courseCode || '—'}
              </td>
              <td className="px-6 py-4 text-sm">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 text-sm flex gap-3">
                <button
                  onClick={() => onEdit(student)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all"
                  aria-label="Edit student"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(student.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                  aria-label="Delete student"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LecturerTable({
  lecturers,
  onEdit,
  onDelete,
}: {
  lecturers: Lecturer[];
  onEdit: (lecturer: Lecturer) => void;
  onDelete: (id: string) => void;
}) {
  if (lecturers.length === 0) {
    return <div className="p-12 text-center text-gray-500">
      <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="font-medium">No lecturers found yet</p>
    </div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Name
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Email
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Department
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
          {lecturers.map((lecturer) => (
            <tr key={lecturer.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                {lecturer.name || lecturer.user?.name || `Lecturer ${lecturer.lecturer_id || lecturer.id}`}
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">{lecturer.email || lecturer.user?.email || '—'}</td>
              <td className="px-6 py-4 text-sm text-gray-600">{lecturer.department}</td>
              <td className="px-6 py-4 text-sm">
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Active
                </span>
              </td>
              <td className="px-6 py-4 text-sm flex gap-3">
                <button
                  onClick={() => onEdit(lecturer)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-all"
                  aria-label="Edit lecturer"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(lecturer.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-all"
                  aria-label="Delete lecturer"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
