#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MEDIA_DIR = path.join(__dirname, '../public/ss');
const OPTIMIZE_DIR = path.join(__dirname, '../public/ss');

// 변환 품질 설정
const GIF_TO_MP4_QUALITY = 23; // CRF value for H.264, lower = better quality, 18-28 is good range
const GIF_TO_WEBP_QUALITY = 80; // WebP quality, 75-85 is good for GIFs

// ffmpeg 설치 확인
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('❌ FFmpeg is not installed. Please install it first.');
    console.log('Ubuntu/Debian: sudo apt-get install ffmpeg');
    console.log('macOS: brew install ffmpeg');
    console.log('Windows: https://ffmpeg.org/download.html');
    return false;
  }
}

// WebP 도구 설치 확인
function checkWebP() {
  try {
    execSync('cwebp -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error('❌ WebP tools are not installed. Please install them first.');
    console.log('Ubuntu/Debian: sudo apt-get install webp');
    console.log('macOS: brew install webp');
    console.log('Windows: Download from https://developers.google.com/speed/webp/download');
    return false;
  }
}

// GIF를 MP4로 변환
function convertGifToMp4(inputPath, outputPath, quality = GIF_TO_MP4_QUALITY) {
  try {
    // FFmpeg 명령어로 GIF를 MP4로 변환
    // -movflags faststart: 웹 스트리밍 최적화
    // -pix_fmt yuv420p: 호환성 향상
    // -vf scale: 크기 조정 (2의 배수로)
    const command = `ffmpeg -i "${inputPath}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -c:v libx264 -crf ${quality} "${outputPath}" -y`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Converted to MP4: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath} to MP4:`, error.message);
    return false;
  }
}

// GIF를 WebP로 변환
function convertGifToWebP(inputPath, outputPath, quality = GIF_TO_WEBP_QUALITY) {
  try {
    // gif2webp 명령어로 GIF를 애니메이션 WebP로 변환
    const command = `gif2webp -q ${quality} "${inputPath}" -o "${outputPath}"`;
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Converted to WebP: ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath} to WebP:`, error.message);
    return false;
  }
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 메인 처리 함수
async function optimizeMediaFiles() {
  // 도구 확인
  if (!checkFFmpeg()) return;
  if (!checkWebP()) return;

  console.log('🚀 Starting media optimization...\n');

  // GIF 파일 찾기
  const files = fs.readdirSync(MEDIA_DIR);
  const gifFiles = files.filter(file => file.toLowerCase().endsWith('.gif'));

  if (gifFiles.length === 0) {
    console.log('No GIF files found to optimize.');
    return;
  }

  console.log(`Found ${gifFiles.length} GIF files to optimize:\n`);

  for (const gifFile of gifFiles) {
    const inputPath = path.join(MEDIA_DIR, gifFile);
    const baseName = path.basename(gifFile, '.gif');
    const mp4Path = path.join(OPTIMIZE_DIR, `${baseName}.mp4`);
    const webpPath = path.join(OPTIMIZE_DIR, `${baseName}.webp`);

    console.log(`\n📁 Processing: ${gifFile}`);
    
    // 파일 크기 확인
    const stats = fs.statSync(inputPath);
    console.log(`   Original size: ${formatFileSize(stats.size)}`);

    // MP4로 변환 (이미 존재하면 건너뛰기)
    if (!fs.existsSync(mp4Path)) {
      console.log('   Converting to MP4...');
      if (convertGifToMp4(inputPath, mp4Path)) {
        const mp4Stats = fs.statSync(mp4Path);
        console.log(`   MP4 size: ${formatFileSize(mp4Stats.size)} (${Math.round((1 - mp4Stats.size / stats.size) * 100)}% reduction)`);
      }
    } else {
      console.log('   MP4 already exists, skipping...');
    }

    // WebP로 변환 (이미 존재하면 건너뛰기)
    if (!fs.existsSync(webpPath)) {
      console.log('   Converting to WebP...');
      if (convertGifToWebP(inputPath, webpPath)) {
        const webpStats = fs.statSync(webpPath);
        console.log(`   WebP size: ${formatFileSize(webpStats.size)} (${Math.round((1 - webpStats.size / stats.size) * 100)}% reduction)`);
      }
    } else {
      console.log('   WebP already exists, skipping...');
    }
  }

  console.log('\n✨ Media optimization complete!');
  console.log('\nNext steps:');
  console.log('1. Test the optimized files in your blog pages');
  console.log('2. If everything works, you can optionally remove the original GIF files');
  console.log('3. Consider running this script periodically for new GIF files');
}

// 스크립트 실행
optimizeMediaFiles().catch(error => {
  console.error('Error during optimization:', error);
  process.exit(1);
});