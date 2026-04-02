#!/bin/bash

# Download face-api.js models from CDN
# This script downloads the required models for face-api.js to work

MODELS_DIR="public/models"

echo "Downloading face-api.js models..."

# Models to download
declare -a MODELS=(
    "tiny_face_detector_model-weights_manifest.json"
    "tiny_face_detector_model-weights_shard1"
    "face_landmark_68_model-weights_manifest.json"
    "face_landmark_68_model-weights_shard1"
    "face_recognition_model-weights_manifest.json"
    "face_recognition_model-weights_shard1"
    "face_recognition_model-weights_shard2"
    "face_expression_model-weights_manifest.json"
    "face_expression_model-weights_shard1"
)

# CDN URL
CDN_URL="https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model"

for model in "${MODELS[@]}"; do
    echo "Downloading $model..."
    curl -o "$MODELS_DIR/$model" "$CDN_URL/$model"
done

echo "Models downloaded successfully!"
echo "Location: $MODELS_DIR"
