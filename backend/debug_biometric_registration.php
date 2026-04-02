<?php

require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Student;
use App\Services\FaceRecognitionService;

echo "Testing biometric registration process...\n\n";

// Get a test student
$student = Student::first();
if (!$student) {
    echo "No students found in database\n";
    exit(1);
}

echo "Test student: {$student->user->name} (ID: {$student->id})\n\n";

// Test face data (base64 encoded small image)
$testFaceData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z';

echo "Testing FaceRecognitionService::storeFaceData...\n";

$faceService = new FaceRecognitionService();
$success = $faceService->storeFaceData($student->id, $testFaceData);

echo "storeFaceData result: " . ($success ? 'SUCCESS' : 'FAILED') . "\n\n";

if ($success) {
    // Refresh student data
    $student->refresh();

    echo "Student biometric data after registration:\n";
    echo "Biometric Type: " . ($student->biometric_type ?? 'null') . "\n";
    echo "Has Template: " . (!empty($student->biometric_template) ? 'Yes' : 'No') . "\n";
    echo "Has Face Image: " . (!empty($student->face_image) ? 'Yes' : 'No') . "\n";

    if (!empty($student->biometric_template)) {
        $template = json_decode($student->biometric_template, true);
        echo "Template structure: " . (is_array($template) ? 'Valid' : 'Invalid') . "\n";
        if (is_array($template)) {
            echo "Features count: " . (isset($template['features']) ? count($template['features']) : 'N/A') . "\n";
            echo "Has signature: " . (isset($template['signature']) ? 'Yes' : 'No') . "\n";
        }
    }
} else {
    echo "Face data storage failed\n";
}

// Test feature extraction
echo "\nTesting feature extraction...\n";
try {
    $features = $faceService->extractFaceFeatures($testFaceData);
    echo "Feature extraction successful: " . count($features) . " features\n";
} catch (Exception $e) {
    echo "Feature extraction failed: " . $e->getMessage() . "\n";
}