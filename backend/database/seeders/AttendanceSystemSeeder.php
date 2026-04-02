<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Student;
use App\Models\Lecturer;
use App\Models\ClassSession;
use App\Models\AttendanceRecord;
use App\Models\Alert;
use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AttendanceSystemSeeder extends Seeder
{
    public function run(): void
    {
        // Create GI-KACE core courses and modules
        $courses = [
            [
                'name' => 'Data Analytics (Power BI)',
                'code' => 'DA-PBI',
                'modules' => [
                    'Introduction to Data Analytics',
                    'SQL for Analytics',
                    'Power BI Desktop Basics',
                    'Data Modeling & DAX',
                    'Dashboarding & Visuals',
                    'Capstone Project',
                ],
            ],
            [
                'name' => 'Geographic Information Systems',
                'code' => 'GIS',
                'modules' => [
                    'Introduction to GIS',
                    'Remote Sensing Basics',
                    'Spatial Data Collection',
                    'GIS Analysis & Mapping',
                    'GIS Project',
                ],
            ],
            [
                'name' => 'Python',
                'code' => 'PY',
                'modules' => [
                    'Python Fundamentals',
                    'Data Structures & OOP',
                    'Pandas & NumPy',
                    'Web Scraping & APIs',
                    'Python Project',
                ],
            ],
            [
                'name' => 'PostgreSQL',
                'code' => 'PG',
                'modules' => [
                    'SQL Fundamentals',
                    'Advanced SQL',
                    'Database Design',
                    'Indexing & Performance',
                    'Backup & Restore',
                ],
            ],
            [
                'name' => 'JavaScript',
                'code' => 'JS',
                'modules' => [
                    'JavaScript Basics',
                    'DOM Manipulation & Events',
                    'ES6+ Features',
                    'Asynchronous JS & Fetch',
                    'Modern Framework Intro',
                ],
            ],
            [
                'name' => 'HTML & CSS',
                'code' => 'HTMLCSS',
                'modules' => [
                    'HTML Fundamentals',
                    'CSS Layouts & Flexbox',
                    'Responsive Design',
                    'Accessibility & Best Practices',
                    'Front-end Project',
                ],
            ],
            [
                'name' => 'GIT & Version Control',
                'code' => 'GIT',
                'modules' => [
                    'Version Control Basics',
                    'Branching & Merging',
                    'Collaborative Workflows',
                    'CI/CD Basics',
                ],
            ],
            [
                'name' => 'PHP Programming',
                'code' => 'PHP',
                'modules' => [
                    'PHP Fundamentals',
                    'Server-side Forms',
                    'Introduction to Laravel',
                    'Database Integration',
                ],
            ],
            [
                'name' => 'Digital Skills',
                'code' => 'DS',
                'modules' => [
                    'Computer Fundamentals',
                    'MS Office Basics',
                    'Internet & Email',
                    'Digital Safety',
                ],
            ],
        ];

        foreach ($courses as $courseData) {
            $course = Course::create([
                'name' => $courseData['name'],
                'code' => $courseData['code'],
            ]);

            $order = 1;
            foreach ($courseData['modules'] as $moduleName) {
                $course->modules()->create([
                    'name' => $moduleName,
                    'sort_order' => $order++,
                ]);
            }
        }

        // Map legacy course variables used by other seed data to representative GI-KACE courses
        $csCourse = Course::where('code', 'DA-PBI')->first();
        $itCourse = Course::where('code', 'PG')->first();

        // Create or update Admin User (safe to run seeder multiple times)
        $admin = User::firstOrCreate(
            ['email' => 'admin@university.edu'],
            [
                'name' => 'Admin User',
                'password' => 'password',
                'role' => 'admin',
            ]
        );
        $admin->password = 'password';
        $admin->save();

        // Create Students
        $student1 = User::create([
            'name' => 'Kwame Osei',
            'email' => 'student@university.edu',
            'password' => 'password', // The 'hashed' cast in User model will handle hashing
            'role' => 'student',
        ]);
        $student1Profile = Student::create([
            'user_id' => $student1->id,
            'student_id' => 'STU001',
            'course_id' => $csCourse->id,
            'accuracy' => 95,
            // Ensure unique non-null FACEIO enrollment IDs to satisfy SQL Server unique index
            'faceio_enrollment_id' => 'DEV-FACEIO-STU001',
        ]);

        // Register facial biometric for student 1
        $faceService = new \App\Services\FaceRecognitionService();
        $mockFaceData1 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';
        $faceService->storeFaceData($student1Profile->id, $mockFaceData1);

        $student2 = User::create([
            'name' => 'Ama Boateng',
            'email' => 'jane.smith@university.edu',
            'password' => 'password', // The 'hashed' cast in User model will handle hashing
            'role' => 'student',
        ]);
        $student2Profile = Student::create([
            'user_id' => $student2->id,
            'student_id' => 'STU002',
            'course_id' => $csCourse->id,
            'accuracy' => 88,
            'faceio_enrollment_id' => 'DEV-FACEIO-STU002',
        ]);

        // Register facial biometric for student 2
        $faceService = new \App\Services\FaceRecognitionService();
        $mockFaceData2 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';
        $faceService->storeFaceData($student2Profile->id, $mockFaceData2);

        $student3 = User::create([
            'name' => 'Kofi Mensah',
            'email' => 'bob.wilson@university.edu',
            'password' => 'password', // The 'hashed' cast in User model will handle hashing
            'role' => 'student',
        ]);
        $student3Profile = Student::create([
            'user_id' => $student3->id,
            'student_id' => 'STU003',
            'course_id' => $itCourse->id,
            'accuracy' => 92,
            'faceio_enrollment_id' => 'DEV-FACEIO-STU003',
        ]);

        // Register facial biometric for student 3
        $mockFaceData3 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Zb';
        $faceService->storeFaceData($student3Profile->id, $mockFaceData3);

        // Create Lecturers
        $lecturer1 = User::create([
            'name' => 'Dr. Abena Asante',
            'email' => 'lecturer@university.edu',
            'password' => 'password', // The 'hashed' cast in User model will handle hashing
            'role' => 'lecturer',
        ]);
        $lecturer1Profile = Lecturer::create([
            'user_id' => $lecturer1->id,
            'lecturer_id' => 'LEC001',
            'department' => 'Computer Science',
            'courses' => ['CS101', 'CS201', 'CS301'],
        ]);

        $lecturer2 = User::create([
            'name' => 'Prof. Yaw Owusu',
            'email' => 'prof.johnson@university.edu',
            'password' => 'password', // The 'hashed' cast in User model will handle hashing
            'role' => 'lecturer',
        ]);
        $lecturer2Profile = Lecturer::create([
            'user_id' => $lecturer2->id,
            'lecturer_id' => 'LEC002',
            'department' => 'Information Technology',
            'courses' => ['IT101', 'IT202'],
        ]);

        // Create Class Sessions
        $session1 = ClassSession::create([
            'name' => 'Introduction to Programming',
            'lecturer_id' => $lecturer1Profile->id,
            'start_time' => now()->setTime(9, 0),
            'end_time' => now()->setTime(11, 0),
            'location' => 'Room 101',
            'course_id' => $csCourse->id,
            'status' => 'ongoing',
            'attendance_count' => 2,
            'total_students' => 30,
        ]);

        $session2 = ClassSession::create([
            'name' => 'Data Structures',
            'lecturer_id' => $lecturer1Profile->id,
            'start_time' => now()->setTime(14, 0),
            'end_time' => now()->setTime(16, 0),
            'location' => 'Room 205',
            'course_id' => $csCourse->id,
            'status' => 'upcoming',
            'attendance_count' => 0,
            'total_students' => 28,
        ]);

        $session3 = ClassSession::create([
            'name' => 'Database Systems',
            'lecturer_id' => $lecturer2Profile->id,
            'start_time' => now()->subDay()->setTime(10, 0),
            'end_time' => now()->subDay()->setTime(12, 0),
            'location' => 'Lab 3',
            'course_id' => $itCourse->id,
            'status' => 'completed',
            'attendance_count' => 1,
            'total_students' => 25,
        ]);

        // Create Attendance Records
        AttendanceRecord::create([
            'student_id' => $student1Profile->id,
            'session_id' => $session1->id,
            'timestamp' => now()->setTime(9, 5),
            'time_in' => now()->setTime(9, 5),
            'status' => 'present',
            'accuracy' => 95,
            'biometric_type' => 'facial',
        ]);

        AttendanceRecord::create([
            'student_id' => $student2Profile->id,
            'session_id' => $session1->id,
            'timestamp' => now()->setTime(9, 15),
            'time_in' => now()->setTime(9, 15),
            'status' => 'late',
            'accuracy' => 88,
            'biometric_type' => 'fingerprint',
        ]);

        AttendanceRecord::create([
            'student_id' => $student3Profile->id,
            'session_id' => $session3->id,
            'timestamp' => now()->subDay()->setTime(10, 2),
            'time_in' => now()->subDay()->setTime(10, 2),
            'time_out' => now()->subDay()->setTime(11, 58),
            'status' => 'present',
            'accuracy' => 92,
            'biometric_type' => 'facial',
        ]);

        // Create Alerts
        Alert::create([
            'type' => 'late_arrival',
            'message' => 'Ama Boateng arrived 15 minutes late to Introduction to Programming',
            'student_id' => $student2Profile->id,
            'session_id' => $session1->id,
            'timestamp' => now()->setTime(9, 15),
            'severity' => 'warning',
            'read' => false,
        ]);

        Alert::create([
            'type' => 'system',
            'message' => 'System maintenance scheduled for tomorrow at 2 AM',
            'timestamp' => now()->setTime(8, 0),
            'severity' => 'info',
            'read' => true,
        ]);
    }
}
