<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking facial biometric registrations...\n\n";

$students = \App\Models\Student::with('user')->where('biometric_type', 'facial')->get();
echo 'Students with facial biometrics: ' . $students->count() . "\n\n";

foreach ($students as $student) {
    echo 'ID: ' . $student->id . "\n";
    echo 'Name: ' . ($student->user->name ?? 'Unknown') . "\n";
    echo 'Student ID: ' . $student->student_id . "\n";

    if (!empty($student->biometric_template)) {
        $template = json_decode($student->biometric_template, true);
        if ($template) {
            echo 'Template Valid: ' . (isset($template['features']) && isset($template['signature']) ? 'Yes' : 'No') . "\n";
            echo 'Features Count: ' . (isset($template['features']) ? count($template['features']) : 0) . "\n";
            echo 'Has Signature: ' . (isset($template['signature']) ? 'Yes' : 'No') . "\n";
            echo 'Registered At: ' . ($template['registered_at'] ?? 'Unknown') . "\n";
        } else {
            echo 'Template JSON Invalid' . "\n";
        }
    } else {
        echo 'No biometric template' . "\n";
    }

    echo str_repeat('-', 50) . "\n";
}

echo "\nAll students in system:\n";
$allStudents = \App\Models\Student::with('user')->get();
foreach ($allStudents as $student) {
    echo 'ID: ' . $student->id . "\n";
    echo 'Name: ' . ($student->user->name ?? 'Unknown') . "\n";
    echo 'Student ID: ' . $student->student_id . "\n";
    echo 'Biometric Type: ' . ($student->biometric_type ?? 'None') . "\n";
    echo 'Has Template: ' . (!empty($student->biometric_template) ? 'Yes' : 'No') . "\n";
    echo 'Has Face Image: ' . (!empty($student->face_image) ? 'Yes' : 'No') . "\n";
    echo str_repeat('-', 50) . "\n";
}
$faceService = new \App\Services\FaceRecognitionService();

// Test with a dummy image data
$testImageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';

try {
    $features = $faceService->extractFaceFeatures($testImageData);
    echo 'Feature extraction successful: ' . count($features) . ' features' . "\n";

    $match = $faceService->findMatchingStudent($features, 0.7);
    echo 'Face matching result: ' . ($match ? 'Match found' : 'No match') . "\n";
    if ($match) {
        echo 'Matched Student: ' . ($match['student']->user->name ?? 'Unknown') . ' (Similarity: ' . $match['similarity'] . ')' . "\n";
    }
} catch (Exception $e) {
    echo 'Error: ' . $e->getMessage() . "\n";
}

echo "\nTesting face storage functionality...\n";
$student = \App\Models\Student::first();
if ($student) {
    echo 'Testing with student: ' . $student->id . ' (' . ($student->user->name ?? 'Unknown') . ')' . "\n";

    // Test face data storage
    $testFaceData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';

    $faceService = new \App\Services\FaceRecognitionService();
    $success = $faceService->storeFaceData($student->id, $testFaceData);

    echo 'Face storage result: ' . ($success ? 'SUCCESS' : 'FAILED') . "\n";

    // Check if biometric was saved
    $student->refresh();
    echo 'Student biometric type after: ' . ($student->biometric_type ?? 'None') . "\n";
    echo 'Has template: ' . (!empty($student->biometric_template) ? 'Yes' : 'No') . "\n";

    if (!empty($student->biometric_template)) {
        $template = json_decode($student->biometric_template, true);
        if ($template) {
            echo 'Template structure: ' . (isset($template['features']) ? 'Valid' : 'Invalid') . "\n";
        }
    }
} else {
    echo 'No students found to test with' . "\n";
}

echo "\nClearing test biometric data...\n";
$student = \App\Models\Student::first();
if ($student && $student->biometric_type) {
    $student->update([
        'biometric_type' => null,
        'biometric_template' => null,
        'face_image' => null
    ]);
    echo 'Test biometric data cleared for student: ' . ($student->user->name ?? 'Unknown') . "\n";
} else {
    echo 'No test data to clear' . "\n";
}