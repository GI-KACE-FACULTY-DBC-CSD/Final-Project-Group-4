import { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertCircle, Loader, Camera, Search, Trash2 } from 'lucide-react';
import { getStudents, enrollFaceBiometric, getFaceEnrollmentStatus, revokeBiometricEnrollment } from '../../services/api';
import { faceApiService } from '../../services/faceApiService';
import { Student } from '../../types';
import { AppLayout } from '../../components/layout/AppLayout';
import { ConfirmModal } from '../../components/ConfirmModal';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function AdminBiometricEnrollment() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | ''>('');
  const [faceApiInitialized, setFaceApiInitialized] = useState(false);
  const [enrollmentStatuses, setEnrollmentStatuses] = useState<Record<string, boolean>>({});
  const [revokeConfirm, setRevokeConfirm] = useState<{ isOpen: boolean; student: Student | null; loading: boolean }>({
    isOpen: false,
    student: null,
    loading: false,
  });

  const getStudentDisplayName = (s: Student) => {
    return s.user?.name || s.name || s.student_id || s.id;
  };

  useEffect(() => {
    const initializeAndLoadData = async () => {
      try {
        // Initialize face-api
        await faceApiService.initialize();
        setFaceApiInitialized(true);

        // Load students
        try {
          const studentsList = await getStudents();
          setStudents(studentsList);

          // Check enrollment status for each student
          const statuses: Record<string, boolean> = {};
          for (const student of studentsList) {
            try {
              const status = await getFaceEnrollmentStatus(student.id);
              statuses[student.id] = status.enrolled || false;
            } catch (err) {
              statuses[student.id] = false;
            }
          }
          setEnrollmentStatuses(statuses);
        } catch (err: any) {
          console.error('Failed to load students:', err);
          const errorMsg = err?.response?.data?.message || err?.message || 'Failed to load students. Please try again.';
          setMessage(`Failed to load students: ${errorMsg}`);
          setMessageType('error');
        }
      } catch (err: any) {
        console.error('System initialization error:', err);
        const errorMsg = err?.message || 'Failed to initialize facial recognition system';
        setMessage(errorMsg);
        setMessageType('error');
      }
    };

    initializeAndLoadData();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setMessage('Camera ready. Select a student and click "Enroll Face"');
        setMessageType('info');
      }
    } catch (err) {
      setMessage('Unable to access camera. Please check permissions.');
      setMessageType('error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      setCameraActive(false);
    }
  };

  const enrollStudentFace = async () => {
    if (!selectedStudent) {
      setMessage('Please select a student first');
      setMessageType('error');
      return;
    }

    if (!videoRef.current) return;

    setLoading(true);
    setMessage('');

    try {
      console.log(`Starting face enrollment for student ${selectedStudent.id}...`);

      // Perform face-api enrollment
      const biometricData = await faceApiService.enrollFace(videoRef.current, selectedStudent.id);
      console.log('Face enrollment successful:', biometricData);

      // Send to backend
      await enrollFaceBiometric(
        selectedStudent.id,
        biometricData.hash,
        biometricData.descriptor.toString(),
        biometricData.confidence
      );

      // Update enrollment status
      setEnrollmentStatuses((prev) => ({
        ...prev,
        [selectedStudent.id]: true,
      }));

      setMessage(`✓ ${getStudentDisplayName(selectedStudent)} enrolled successfully with facial biometric`);
      setMessageType('success');
      setSelectedStudent(null);

      // Auto-clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (err: any) {
      console.error('Enrollment error:', err);
      const errorMsg = err?.message || 'Face enrollment failed. Please try again.';
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const revokeEnrollment = async () => {
    const student = revokeConfirm.student;
    if (!student) return;

    setRevokeConfirm((prev) => ({ ...prev, loading: true }));
    try {
      await revokeBiometricEnrollment(student.id);
      setEnrollmentStatuses((prev) => ({
        ...prev,
        [student.id]: false,
      }));
      setMessage(`Enrollment revoked for ${getStudentDisplayName(student)}`);
      setMessageType('success');
      setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 3000);
    } catch (err: any) {
      setMessage('Failed to revoke enrollment');
      setMessageType('error');
    } finally {
      setRevokeConfirm({ isOpen: false, student: null, loading: false });
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      getStudentDisplayName(s).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.student_id || s.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.user?.email || s.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sidebarLinks = [
    { label: 'Admin Dashboard', href: '/admin/dashboard' },
    { label: 'Students', href: '/admin/students' },
    { label: 'Lecturers', href: '/admin/lecturers' },
    { label: 'Courses', href: '/admin/courses' },
    { label: 'Sessions', href: '/admin/sessions' },
    { label: 'Biometric Enrollment', href: '/admin/enrollment' },
    { label: 'Reports', href: '/admin/reports' },
  ];

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Biometric Enrollment</h1>
          <p className="text-gray-600 mt-2">Enroll students with facial biometric for attendance verification</p>
        </div>

        {/* Workflow Info */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900">
          <p className="text-sm">
            <strong>Workflow:</strong> Create students in the Users section first, then register their facial biometric here. Students must be enrolled before they can check in to class. Green badge = Enrolled, Yellow badge = Pending enrollment.
          </p>
        </div>

        {!faceApiInitialized ? (
          <div className="p-8 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
            <Loader className="w-6 h-6 animate-spin inline mr-3" />
            Initializing facial recognition system...
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Camera and Controls */}
            <div className="lg:col-span-2 space-y-6">
              {/* Camera Feed */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-black h-96 flex items-center justify-center relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!cameraActive && <Camera className="w-16 h-16 text-gray-600 absolute" />}
                </div>

                {/* Controls */}
                <div className="p-4 border-t border-gray-200 flex gap-3">
                  {!cameraActive ? (
                    <button
                      onClick={startCamera}
                      className="flex-1 bg-primary text-white py-2 px-4 rounded-md font-semibold hover:bg-primary-dark transition"
                    >
                      <Camera className="w-5 h-5 inline mr-2" />
                      Start Camera
                    </button>
                  ) : (
                    <button
                      onClick={stopCamera}
                      className="flex-1 bg-red-500 text-white py-2 px-4 rounded-md font-semibold hover:bg-red-600 transition"
                    >
                      Stop Camera
                    </button>
                  )}
                </div>
              </div>

              {/* Status Messages */}
              {message && (
                <div
                  className={`p-4 rounded-lg border flex items-start gap-3 ${
                    messageType === 'success'
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : messageType === 'error'
                      ? 'bg-red-50 border-red-200 text-red-800'
                      : 'bg-blue-50 border-blue-200 text-blue-800'
                  }`}
                >
                  {messageType === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : messageType === 'error' ? (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}

              {/* Student Selection */}
              {selectedStudent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-blue-600 font-semibold uppercase">Selected Student</p>
                      <p className="text-lg font-bold text-gray-900">{getStudentDisplayName(selectedStudent)}</p>
                      <p className="text-sm text-gray-600">{selectedStudent.user?.email || selectedStudent.email}</p>
                    </div>
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Change
                    </button>
                  </div>

                  <button
                    onClick={enrollStudentFace}
                    disabled={loading || !cameraActive}
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${
                      loading || !cameraActive
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        Enroll Face
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Student List */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Students</h2>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No students found</div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className={`p-3 cursor-pointer transition ${
                          selectedStudent?.id === student.id
                            ? 'bg-blue-50 border-l-4 border-blue-600'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedStudent(student)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-gray-900">{getStudentDisplayName(student)}</p>
                            <p className="text-xs text-gray-500">{student.student_id || '—'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {enrollmentStatuses[student.id] ? (
                              <>
                                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-semibold">
                                  <CheckCircle className="w-3 h-3" />
                                  Enrolled
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRevokeConfirm({ isOpen: true, student, loading: false });
                                  }}
                                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                                  title="Revoke enrollment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded font-semibold">
                                Pending
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {Object.values(enrollmentStatuses).filter(Boolean).length}
                    </p>
                    <p className="text-xs text-gray-600">Enrolled</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">
                      {students.length - Object.values(enrollmentStatuses).filter(Boolean).length}
                    </p>
                    <p className="text-xs text-gray-600">Pending</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={revokeConfirm.isOpen}
        title="Revoke biometric enrollment?"
        message={
          revokeConfirm.student
            ? `This will remove the facial biometric for ${getStudentDisplayName(revokeConfirm.student)}. They will not be able to check in with their face until you re-enroll them.`
            : ''
        }
        confirmText="Yes, revoke"
        cancelText="Cancel"
        isDestructive
        isLoading={revokeConfirm.loading}
        onConfirm={revokeEnrollment}
        onCancel={() => setRevokeConfirm({ isOpen: false, student: null, loading: false })}
      />
    </AppLayout>
  );
}

export default AdminBiometricEnrollment;
