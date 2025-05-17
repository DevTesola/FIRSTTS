const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Videos to optimize
const videos = [
  { name: 's1.mp4', crf: 28, audioBitrate: 'none', targetSize: 5 },
  { name: 's2.mp4', crf: 28, audioBitrate: 'none', targetSize: 5 }
];

// Check if ffmpeg is installed
async function checkFfmpeg() {
  return new Promise((resolve) => {
    exec('ffmpeg -version', (error) => {
      resolve(!error);
    });
  });
}

// Create backup of original files
async function createBackup(fileName) {
  const source = path.join('public/ss', fileName);
  const backupDir = path.join('public/ss/backup');
  const backup = path.join(backupDir, fileName);
  
  try {
    await fs.mkdir(backupDir, { recursive: true });
    if (!await fs.access(backup).then(() => true).catch(() => false)) {
      await fs.copyFile(source, backup);
      console.log(`✅ Backed up: ${fileName}`);
    } else {
      console.log(`✅ Backup already exists: ${fileName}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to backup ${fileName}:`, error.message);
    return false;
  }
}

// Get file size in human readable format
async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const size = stats.size;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  } catch (error) {
    return 'Unknown';
  }
}

// Generate poster image (first frame)
async function generatePoster(videoName) {
  const videoPath = path.join('public/ss', videoName);
  const posterName = videoName.replace('.mp4', '_poster.jpg');
  const posterPath = path.join('public/ss', posterName);
  
  // Check if poster already exists
  if (await fs.access(posterPath).then(() => true).catch(() => false)) {
    console.log(`🖼️  Poster already exists: ${posterName}`);
    return;
  }
  
  return new Promise((resolve) => {
    const command = `ffmpeg -i "${videoPath}" -vframes 1 -q:v 2 "${posterPath}"`;
    exec(command, (error) => {
      if (error) {
        console.error(`❌ Failed to create poster for ${videoName}:`, error.message);
      } else {
        console.log(`✅ Created poster: ${posterName}`);
      }
      resolve();
    });
  });
}

// Optimize MP4 with proper settings for web and mobile
async function optimizeVideo({ name, crf, targetSize }) {
  const source = path.join('public/ss', name);
  const temp = path.join('public/ss', `temp_${name}`);
  const optimized = path.join('public/ss/optimized', name);
  const optimizedDir = path.join('public/ss/optimized');
  
  // Create optimized directory
  await fs.mkdir(optimizedDir, { recursive: true });
  
  // Create backup
  const backupSuccess = await createBackup(name);
  if (!backupSuccess) return;
  
  // Generate poster image
  await generatePoster(name);
  
  console.log(`\n🎬 Optimizing ${name}...`);
  
  // Get original file size
  const originalSize = await getFileSize(source);
  
  // FFmpeg command for web optimization (no audio for these videos)
  const command = `ffmpeg -i "${source}" \
    -c:v libx264 \
    -preset slower \
    -crf ${crf} \
    -profile:v baseline -level 3.1 \
    -vf "scale='min(640,iw)':'min(480,ih)':force_original_aspect_ratio=decrease" \
    -movflags +faststart \
    -pix_fmt yuv420p \
    -an \
    "${temp}" -y`;
  
  return new Promise((resolve) => {
    exec(command, async (error) => {
      if (error) {
        console.error(`❌ Failed to optimize ${name}:`, error.message);
        try {
          await fs.unlink(temp);
        } catch {}
        resolve();
        return;
      }
      
      try {
        // Move optimized file to optimized directory
        await fs.rename(temp, optimized);
        
        // Get new file size
        const newSize = await getFileSize(optimized);
        const ratio = await calculateSizeRatio(source, optimized);
        
        console.log(`✅ Optimized: ${name}`);
        console.log(`   Original: ${originalSize}`);
        console.log(`   Optimized: ${newSize} (${ratio}% of original)`);
        
        // If optimized file is larger or not significantly smaller, use original
        if (ratio > 90) {
          console.log(`   Using original (optimization didn't save much space)`);
          await fs.copyFile(source, optimized);
        }
      } catch (err) {
        console.error(`❌ Failed to finalize ${name}:`, err.message);
      }
      
      resolve();
    });
  });
}

// Calculate size ratio
async function calculateSizeRatio(originalPath, optimizedPath) {
  try {
    const originalStats = await fs.stat(originalPath);
    const optimizedStats = await fs.stat(optimizedPath);
    return Math.round((optimizedStats.size / originalStats.size) * 100);
  } catch {
    return 100;
  }
}

// Create a compression summary
async function createCompressionSummary() {
  const report = [];
  report.push('# Video Optimization Report\n');
  report.push('## Community Page Videos\n');
  
  for (const video of videos) {
    const original = path.join('public/ss', video.name);
    const optimized = path.join('public/ss/optimized', video.name);
    const poster = path.join('public/ss', video.name.replace('.mp4', '_poster.jpg'));
    
    const originalSize = await getFileSize(original);
    const optimizedSize = await getFileSize(optimized);
    const posterSize = await getFileSize(poster);
    const posterExists = await fs.access(poster).then(() => true).catch(() => false);
    
    report.push(`\n### ${video.name}`);
    report.push(`- Original: ${originalSize}`);
    report.push(`- Optimized: ${optimizedSize}`);
    report.push(`- Poster: ${posterExists ? posterSize : 'Not generated'}`);
  }
  
  const reportPath = path.join('public/ss', 'video-optimization-report.md');
  await fs.writeFile(reportPath, report.join('\n'));
  console.log(`\n📄 Created optimization report: ${reportPath}`);
}

// Main function
async function main() {
  console.log('🔧 Starting video optimization for community page...\n');
  
  // Check if ffmpeg is installed
  if (!await checkFfmpeg()) {
    console.error('❌ Error: ffmpeg is not installed or not in PATH');
    console.error('Please install ffmpeg first:');
    console.error('  Ubuntu/Debian: sudo apt install ffmpeg');
    console.error('  macOS: brew install ffmpeg');
    console.error('  Windows: Download from https://ffmpeg.org/download.html');
    process.exit(1);
  }
  
  // Optimize each video
  for (const video of videos) {
    await optimizeVideo(video);
  }
  
  // Create compression summary
  await createCompressionSummary();
  
  console.log('\n✨ Video optimization complete!');
  console.log('📁 Optimized files are in: public/ss/optimized/');
  console.log('🖼️  Poster images are in: public/ss/');
}

// Run the script
main().catch(console.error);