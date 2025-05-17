#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 미디어 파일 최적화 스크립트
 * GIF -> WebP/MP4 변환
 * 이미지 압축
 * 비디오 최적화
 */

const PUBLIC_DIR = path.join(__dirname, '../public');
const MEDIA_DIRS = [
  path.join(PUBLIC_DIR, 'ss'),
  path.join(PUBLIC_DIR, 'nft-previews'),
  path.join(PUBLIC_DIR, 'zz')
];

// 최적화 설정
const OPTIMIZATION_CONFIG = {
  gif: {
    targetFormats: ['webp', 'mp4'],
    maxSize: 500 * 1024, // 500KB
    quality: 75
  },
  image: {
    targetFormats: ['webp'],
    quality: 85,
    maxWidth: 1200
  },
  video: {
    targetCodec: 'h264',
    crf: 23, // Quality (lower = better, higher file size)
    preset: 'medium'
  }
};

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// GIF -> WebP 변환
function convertGifToWebP(inputPath, outputPath, quality = 75) {
  try {
    // ffmpeg가 설치되어 있는지 확인
    execSync('which ffmpeg', { stdio: 'ignore' });
    
    const command = `ffmpeg -i "${inputPath}" -c:v libwebp -lossless 0 -compression_level 6 -q:v ${quality} -loop 0 -preset picture -an -vsync 0 "${outputPath}" -y`;
    execSync(command, { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error(`Failed to convert ${inputPath} to WebP:`, error.message);
    return false;
  }
}

// GIF -> MP4 변환
function convertGifToMp4(inputPath, outputPath, quality = 23) {
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    
    const command = `ffmpeg -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf ${quality} "${outputPath}" -y`;
    execSync(command, { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error(`Failed to convert ${inputPath} to MP4:`, error.message);
    return false;
  }
}

// 이미지 최적화
function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    // ImageMagick 사용 (convert 명령)
    execSync('which convert', { stdio: 'ignore' });
    
    const { quality = 85, maxWidth = 1200 } = options;
    const command = `convert "${inputPath}" -resize ${maxWidth}x> -quality ${quality} "${outputPath}"`;
    execSync(command, { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error(`Failed to optimize ${inputPath}:`, error.message);
    return false;
  }
}

// 비디오 최적화
function optimizeVideo(inputPath, outputPath, options = {}) {
  try {
    execSync('which ffmpeg', { stdio: 'ignore' });
    
    const { crf = 23, preset = 'medium' } = options;
    const command = `ffmpeg -i "${inputPath}" -c:v libx264 -crf ${crf} -preset ${preset} -c:a aac -b:a 128k -movflags +faststart "${outputPath}" -y`;
    execSync(command, { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error(`Failed to optimize ${inputPath}:`, error.message);
    return false;
  }
}

// 메인 최적화 함수
async function optimizeMediaFiles() {
  console.log('🚀 Starting media file optimization...\n');
  
  let totalSaved = 0;
  let filesProcessed = 0;
  
  for (const dir of MEDIA_DIRS) {
    if (!fileExists(dir)) {
      console.log(`Directory not found: ${dir}`);
      continue;
    }
    
    console.log(`\n📁 Processing directory: ${dir}`);
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const ext = path.extname(file).toLowerCase();
      const basename = path.basename(file, ext);
      
      // Skip if already optimized
      if (basename.includes('_optimized')) {
        continue;
      }
      
      const originalSize = getFileSize(filePath);
      console.log(`\n🔍 Processing: ${file} (${formatBytes(originalSize)})`);
      
      if (ext === '.gif') {
        // Convert GIF to WebP
        const webpPath = path.join(dir, `${basename}.webp`);
        if (!fileExists(webpPath)) {
          console.log('  Converting to WebP...');
          if (convertGifToWebP(filePath, webpPath, OPTIMIZATION_CONFIG.gif.quality)) {
            const webpSize = getFileSize(webpPath);
            const saved = originalSize - webpSize;
            console.log(`  ✅ WebP created: ${formatBytes(webpSize)} (saved ${formatBytes(saved)})`);
            totalSaved += saved;
            filesProcessed++;
          }
        }
        
        // Convert GIF to MP4 if it's large
        if (originalSize > OPTIMIZATION_CONFIG.gif.maxSize) {
          const mp4Path = path.join(dir, `${basename}.mp4`);
          if (!fileExists(mp4Path)) {
            console.log('  Converting to MP4...');
            if (convertGifToMp4(filePath, mp4Path)) {
              const mp4Size = getFileSize(mp4Path);
              const saved = originalSize - mp4Size;
              console.log(`  ✅ MP4 created: ${formatBytes(mp4Size)} (saved ${formatBytes(saved)})`);
              totalSaved += saved;
              filesProcessed++;
            }
          }
        }
      } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        // Optimize images
        const webpPath = path.join(dir, `${basename}.webp`);
        if (!fileExists(webpPath)) {
          console.log('  Converting to WebP...');
          if (optimizeImage(filePath, webpPath, OPTIMIZATION_CONFIG.image)) {
            const webpSize = getFileSize(webpPath);
            const saved = originalSize - webpSize;
            console.log(`  ✅ WebP created: ${formatBytes(webpSize)} (saved ${formatBytes(saved)})`);
            totalSaved += saved;
            filesProcessed++;
          }
        }
      } else if (['.mp4', '.webm'].includes(ext)) {
        // Optimize videos
        const optimizedPath = path.join(dir, `${basename}_optimized${ext}`);
        if (!fileExists(optimizedPath) && originalSize > 1024 * 1024) { // Only optimize if > 1MB
          console.log('  Optimizing video...');
          if (optimizeVideo(filePath, optimizedPath, OPTIMIZATION_CONFIG.video)) {
            const optimizedSize = getFileSize(optimizedPath);
            const saved = originalSize - optimizedSize;
            console.log(`  ✅ Video optimized: ${formatBytes(optimizedSize)} (saved ${formatBytes(saved)})`);
            totalSaved += saved;
            filesProcessed++;
          }
        }
      }
    }
  }
  
  console.log('\n\n✨ Optimization complete!');
  console.log(`Files processed: ${filesProcessed}`);
  console.log(`Total space saved: ${formatBytes(totalSaved)}`);
  console.log('\n📝 Next steps:');
  console.log('1. Update BlogMedia component to use optimized versions');
  console.log('2. Test the optimized files in the application');
  console.log('3. Consider removing original files after verification');
}

// 사용 가능한 도구 확인
function checkDependencies() {
  const dependencies = ['ffmpeg', 'convert'];
  const missing = [];
  
  for (const dep of dependencies) {
    try {
      execSync(`which ${dep}`, { stdio: 'ignore' });
    } catch (error) {
      missing.push(dep);
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required dependencies:', missing.join(', '));
    console.error('\nPlease install them first:');
    console.error('Ubuntu/Debian: sudo apt-get install ffmpeg imagemagick');
    console.error('macOS: brew install ffmpeg imagemagick');
    return false;
  }
  
  return true;
}

// 실행
if (require.main === module) {
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  optimizeMediaFiles().catch(console.error);
}

module.exports = {
  convertGifToWebP,
  convertGifToMp4,
  optimizeImage,
  optimizeVideo
};