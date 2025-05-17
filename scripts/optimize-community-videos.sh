#!/bin/bash

# Optimize s1.mp4 and s2.mp4 videos for community page
echo "🎬 Optimizing community page videos..."

cd /home/tesola/ttss/tesolafixjs

# Create optimization directory
mkdir -p public/ss/optimized

# Optimize s1.mp4
echo "⏳ Optimizing s1.mp4..."
ffmpeg -i public/ss/s1.mp4 -c:v libx264 -preset medium -crf 22 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -movflags faststart -an -y public/ss/optimized/s1_optimized.mp4

# Optimize s2.mp4
echo "⏳ Optimizing s2.mp4..."
ffmpeg -i public/ss/s2.mp4 -c:v libx264 -preset medium -crf 22 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" -movflags faststart -an -y public/ss/optimized/s2_optimized.mp4

# Create low-quality versions
echo "⏳ Creating low-quality versions..."
ffmpeg -i public/ss/s1.mp4 -c:v libx264 -preset faster -crf 28 -vf "scale=1280:720:force_original_aspect_ratio=decrease" -movflags faststart -an -y public/ss/optimized/s1_low.mp4
ffmpeg -i public/ss/s2.mp4 -c:v libx264 -preset faster -crf 28 -vf "scale=1280:720:force_original_aspect_ratio=decrease" -movflags faststart -an -y public/ss/optimized/s2_low.mp4

# Update the main video files with optimized versions
echo "📁 Updating main video files..."
cp public/ss/optimized/s1_optimized.mp4 public/ss/s1.mp4
cp public/ss/optimized/s2_optimized.mp4 public/ss/s2.mp4

# Get file sizes
echo "📊 File size comparison:"
echo "Original s1.mp4: $(du -h public/ss/s1.mp4 | cut -f1)"
echo "Low quality s1: $(du -h public/ss/optimized/s1_low.mp4 | cut -f1)"
echo "Original s2.mp4: $(du -h public/ss/s2.mp4 | cut -f1)"
echo "Low quality s2: $(du -h public/ss/optimized/s2_low.mp4 | cut -f1)"

echo "✅ Video optimization complete!"
echo "📁 Files are in public/ss/ and public/ss/optimized/"