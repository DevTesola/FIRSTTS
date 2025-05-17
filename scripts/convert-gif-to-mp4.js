#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// GIF를 MP4로 변환하는 간단한 스크립트
// MP4는 GIF보다 훨씬 작고 성능이 좋음

const PUBLIC_DIR = path.join(__dirname, '../public');
const GIF_FILES = [
  '/ss/s1.gif',
  '/ss/s2.gif'
];

function convertGifToMp4(inputPath, outputPath) {
  try {
    // FFmpeg 명령어로 GIF를 MP4로 변환
    // -pix_fmt yuv420p: 호환성을 위한 픽셀 포맷
    // -vf scale: 크기가 홀수인 경우 짝수로 조정
    // -movflags +faststart: 웹 스트리밍에 최적화
    const command = `ffmpeg -i "${inputPath}" -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -movflags +faststart "${outputPath}" -y`;
    
    console.log(`Converting: ${inputPath} → ${outputPath}`);
    execSync(command, { stdio: 'inherit' });
    
    // 파일 크기 비교
    const gifSize = fs.statSync(inputPath).size / (1024 * 1024);
    const mp4Size = fs.statSync(outputPath).size / (1024 * 1024);
    const reduction = ((1 - mp4Size / gifSize) * 100).toFixed(1);
    
    console.log(`✅ Converted successfully!`);
    console.log(`   GIF size: ${gifSize.toFixed(2)}MB`);
    console.log(`   MP4 size: ${mp4Size.toFixed(2)}MB`);
    console.log(`   Reduction: ${reduction}%\n`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error converting ${inputPath}:`, error.message);
    return false;
  }
}

// FFmpeg 확인
try {
  execSync('ffmpeg -version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ FFmpeg is not installed.');
  console.log('Please install FFmpeg first:');
  console.log('Ubuntu/Debian: sudo apt-get install ffmpeg');
  console.log('macOS: brew install ffmpeg');
  process.exit(1);
}

console.log('🎬 Converting GIF files to MP4...\n');

// 변환 실행
GIF_FILES.forEach(gifPath => {
  const inputPath = path.join(PUBLIC_DIR, gifPath);
  const mp4Path = inputPath.replace('.gif', '.mp4');
  
  if (fs.existsSync(inputPath)) {
    convertGifToMp4(inputPath, mp4Path);
  } else {
    console.log(`⚠️  File not found: ${inputPath}`);
  }
});

console.log('✨ Conversion complete!');
console.log('\nNext steps:');
console.log('1. Update your components to use MP4 instead of GIF for animations');
console.log('2. Use <video> tag with autoplay, loop, and muted attributes');
console.log('3. Consider removing original GIF files after verification');