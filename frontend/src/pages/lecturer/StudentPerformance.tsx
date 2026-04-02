import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getStudents, getCourses } from '../../services/api';
import { Student } from '../../types';
import { TrendingUp } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

function toPct(accuracy: number | undefined): number | null {
  if (accuracy == null) return null;
  const n = Number(accuracy);
  return Math.min(100, Math.max(0, n > 1 ? n : n * 100));
}

export function StudentPerformance() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsData, coursesData] = await Promise.all([
          getStudents(),
          getCourses(),
        ]);
        setStudents(studentsData);
        setCourses(coursesData || []);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const sidebarLinks = [
    { label: t('common.dashboard'), href: '/lecturer/dashboard' },
    { label: t('navigation.lecturerSessions'), href: '/lecturer/sessions' },
    { label: t('navigation.lecturerAttendance'), href: '/lecturer/attendance' },
    { label: t('navigation.lecturerPerformance'), href: '/lecturer/performance' },
  ];

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          {t('pages.studentPerformance')}
        </h1>

        {/* Students Performance Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-gray-500">{t('pages.noStudentsFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('users.student') || 'Student'}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('table.course')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('table.biometricAccuracy')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      {t('table.status')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const pct = toPct(student.accuracy);
                    return (
                      <tr key={student.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {student.name || student.email || (student as any).studentId || student.student_id || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {(student as any).courseName || student.courseName || courses.find(c => c.id === (student.course_id || (student as any).courseId))?.name || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {pct != null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    pct >= 90 ? 'bg-green-600' : pct >= 70 ? 'bg-blue-600' : 'bg-yellow-600'
                                  }`}
                                  role="progressbar"
                                  aria-label={`Performance: ${Math.round(pct)}%`}
                                  aria-valuenow={String(Math.round(pct))}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                  style={{ width: `${pct}%` }}
                                ></div>
                              </div>
                              <span className="text-gray-600">
                                {pct.toFixed(1)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => navigate('/lecturer/attendance', { state: { studentId: student.id } })}
                            className="text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            {t('buttons.viewReport')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
