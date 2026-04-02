# PowerShell script to download face-api.js models
# This script downloads the required models for face-api.js to work

$MODELS_DIR = "public\models"
$CDN_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"

# Create models directory if it doesn't exist
if (-not (Test-Path $MODELS_DIR)) {
    New-Item -ItemType Directory -Path $MODELS_DIR -Force
}

# Models to download
$models = @(
    "tiny_face_detector_model-weights_manifest.json",
    "tiny_face_detector_model-weights_shard1",
    "face_landmark_68_model-weights_manifest.json",
    "face_landmark_68_model-weights_shard1",
    "face_recognition_model-weights_manifest.json",
    "face_recognition_model-weights_shard1",
    "face_recognition_model-weights_shard2",
    "face_expression_model-weights_manifest.json",
    "face_expression_model-weights_shard1"
)

Write-Host "Downloading face-api.js models..."

foreach ($model in $models) {
    $url = "$CDN_URL/$model"
    $outputPath = Join-Path $MODELS_DIR $model
    
    Write-Host "Downloading $model..."
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $outputPath -ErrorAction Stop
        Write-Host "✓ $model downloaded successfully" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to download $model" -ForegroundColor Red
        Write-Host "Error: $_"
    }
}

Write-Host "`nModels download completed!"
Write-Host "Location: $(Resolve-Path $MODELS_DIR)"
