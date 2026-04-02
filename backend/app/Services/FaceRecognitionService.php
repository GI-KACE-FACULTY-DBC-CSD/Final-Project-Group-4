<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class FaceRecognitionService
{
    /**
     * Extract face features/embeddings from an image
     * For demo purposes, we'll use a simplified but more reliable approach
     */
    public function extractFaceFeatures(string $imageData): array
    {
        // Basic validation
        if (empty($imageData)) {
            throw new \InvalidArgumentException('Image data is empty');
        }

        if (strlen($imageData) < 100) {
            throw new \InvalidArgumentException('Image data is too small to be valid');
        }

        // Decode base64 image
        $imageData = str_replace('data:image/jpeg;base64,', '', $imageData);
        $imageData = str_replace('data:image/png;base64,', '', $imageData);

        if (!base64_decode($imageData, true)) {
            throw new \InvalidArgumentException('Invalid base64 image data');
        }

        $imageBinary = base64_decode($imageData);

        if (strlen($imageBinary) < 100) {
            throw new \InvalidArgumentException('Decoded image is too small to be valid');
        }

        // For demo purposes, create a deterministic feature vector from image content
        // This ensures the same image always produces the same features
        $features = [];

        // Use a portion of the image data to create stable features
        $sampleSize = min(4096, strlen($imageBinary)); // Use first 4KB
        $sample = substr($imageBinary, 0, $sampleSize);

        // Create features from chunks of the image data
        $chunkSize = 256;
        for ($i = 0; $i < $sampleSize; $i += $chunkSize) {
            $chunk = substr($sample, $i, $chunkSize);
            $hash = crc32($chunk);

            // Convert hash to 4 features
            $features[] = ($hash & 0xFF) / 255.0;
            $features[] = (($hash >> 8) & 0xFF) / 255.0;
            $features[] = (($hash >> 16) & 0xFF) / 255.0;
            $features[] = (($hash >> 24) & 0xFF) / 255.0;
        }

        // Add image metadata as features
        $imageSize = strlen($imageBinary);
        $features[] = ($imageSize % 10000) / 10000.0;

        // Create a unique signature for this specific image
        $uniqueSignature = md5($imageBinary);
        for ($i = 0; $i < 16; $i += 2) {
            $features[] = hexdec(substr($uniqueSignature, $i, 2)) / 255.0;
        }

        // Ensure we have exactly 64 features
        while (count($features) < 64) {
            $features[] = 0.5;
        }

        return array_slice($features, 0, 64);
    }

    /**
     * Compare two face feature vectors using cosine similarity
     */
    public function compareFaces(array $features1, array $features2): float
    {
        // Cosine similarity is better for face embeddings than Euclidean distance
        $dotProduct = 0;
        $norm1 = 0;
        $norm2 = 0;

        $minLen = min(count($features1), count($features2));

        for ($i = 0; $i < $minLen; $i++) {
            $dotProduct += $features1[$i] * $features2[$i];
            $norm1 += $features1[$i] * $features1[$i];
            $norm2 += $features2[$i] * $features2[$i];
        }

        if ($norm1 == 0 || $norm2 == 0) {
            return 0; // Avoid division by zero
        }

        $similarity = $dotProduct / (sqrt($norm1) * sqrt($norm2));

        // Ensure similarity is between 0 and 1
        return max(0, min(1, $similarity));
    }

    /**
     * Store face data for a student
     */
    public function storeFaceData(string $studentId, string $imageData): bool
    {
        try {
            $features = $this->extractFaceFeatures($imageData);
            $imageSignature = $this->createImageSignature($imageData);

            $student = \App\Models\Student::find($studentId);
            if (!$student) return false;

            $student->update([
                'biometric_type' => 'facial',
                'biometric_template' => json_encode([
                    'features' => $features,
                    'signature' => $imageSignature,
                    'registered_at' => now()->toISOString(),
                ]),
                'face_image' => $imageData
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Failed to store face data: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Create a unique signature for an image
     */
    private function createImageSignature(string $imageData): string
    {
        // Decode base64 image
        $imageData = str_replace('data:image/jpeg;base64,', '', $imageData);
        $imageData = str_replace('data:image/png;base64,', '', $imageData);
        $imageBinary = base64_decode($imageData);

        // Create a signature based on image content
        return hash('sha256', $imageBinary);
    }

    /**
     * Find the best matching student for given face features
     */
    public function findMatchingStudent(array $faceFeatures, float $threshold = 0.6): ?array
    {
        $students = \App\Models\Student::where('biometric_type', 'facial')
            ->whereNotNull('biometric_template')
            ->get();

        \Log::info('Face recognition search', [
            'students_with_biometrics' => $students->count(),
            'threshold' => $threshold,
        ]);

        if ($students->isEmpty()) {
            \Log::warning('No students with facial biometrics found');
            return null;
        }

        $bestMatch = null;
        $bestSimilarity = 0;

        foreach ($students as $student) {
            $storedData = json_decode($student->biometric_template, true);
            if (!$storedData || !isset($storedData['features'])) {
                \Log::warning('Invalid stored biometric data for student', ['student_id' => $student->id]);
                continue;
            }

            $storedFeatures = $storedData['features'];
            $similarity = $this->compareFaces($faceFeatures, $storedFeatures);

            \Log::info('Face comparison', [
                'student_id' => $student->id,
                'student_name' => $student->user->name ?? 'Unknown',
                'similarity' => $similarity,
                'above_threshold' => $similarity >= $threshold,
            ]);

            if ($similarity > $bestSimilarity && $similarity >= $threshold) {
                $bestSimilarity = $similarity;
                $bestMatch = [
                    'student' => $student,
                    'similarity' => $similarity
                ];
            }
        }

        if ($bestMatch) {
            \Log::info('Best match found', [
                'student_id' => $bestMatch['student']->id,
                'student_name' => $bestMatch['student']->user->name ?? 'Unknown',
                'similarity' => $bestMatch['similarity'],
            ]);
        } else {
            \Log::info('No match found above threshold', [
                'threshold' => $threshold,
                'best_similarity_found' => $bestSimilarity,
            ]);
        }

        return $bestMatch;
    }
}