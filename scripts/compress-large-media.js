#!/usr/bin/env node

const sharp = require('sharp');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// 압축할 대상 파일들
const IMAGES_TO_COMPRESS = [
  {
    src: 'public/elon.png',
    dest: 'public/elon.jpg',
    options: { quality: 85, mozjpeg: true }
  },
  {
    src: 'public/slr.png',
    dest: 'public/slr.jpg',
    options: { quality: 85, mozjpeg: true }
  },
  {
    src: 'public/stars3.jpg',
    dest: 'public/stars3.jpg',
    options: { quality: 85, mozjpeg: true }
  }
];

const VIDEOS_TO_COMPRESS = [
  { src: 'public/intro.mp4', dest: 'public/intro.mp4' },
  { src: 'public/dev.mp4', dest: 'public/dev.mp4' },
  { src: 'public/SOLARA.mp4', dest: 'public/SOLARA.mp4' }
];

async function createBackup(filePath) {
  const backupDir = 'public/backup';
  await fs.mkdir(backupDir, { recursive: true });
  
  const fileName = path.basename(filePath);
  const backupPath = path.join(backupDir, `${fileName}.backup`);
  
  try {
    await fs.copyFile(filePath, backupPath);
    console.log(`✅ Backed up: ${fileName}`);
  } catch (error) {
    console.error(`❌ Failed to backup ${fileName}:`, error.message);
  }
}

async function compressImage(config) {
  const { src, dest, options } = config;
  
  try {
    // 백업 생성
    await createBackup(src);
    
    // 이미지 압축
    if (src.endsWith('.png')) {
      // PNG to JPG conversion
      await sharp(src)
        .jpeg(options)
        .toFile(dest);
        
      // PNG 파일 삭제 (JPG로 변환된 경우)
      if (src !== dest) {
        await fs.unlink(src);
      }
    } else {
      // JPG 재압축
      await sharp(src)
        .jpeg(options)
        .toFile(dest + '.temp');
      
      // 임시 파일을 원본으로 이동
      await fs.rename(dest + '.temp', dest);
    }
    
    const srcStats = await fs.stat(src).catch(() => ({ size: 0 }));
    const destStats = await fs.stat(dest);
    const reduction = ((1 - destStats.size / srcStats.size) * 100).toFixed(1);
    
    console.log(`✅ Compressed: ${path.basename(src)} -> ${path.basename(dest)} (${reduction}% reduction)`);
  } catch (error) {
    console.error(`❌ Failed to compress ${src}:`, error.message);
  }
}

async function compressVideo(config) {
  const { src, dest } = config;
  
  try {
    // 백업 생성
    await createBackup(src);
    
    // 임시 파일명
    const tempFile = dest + '.temp.mp4';
    
    // FFmpeg 명령어: H.264 코덱, 적절한 비트레이트 설정
    const command = `ffmpeg -i ${src} -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 128k -movflags +faststart ${tempFile}`;
    
    await new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    
    // 원본 파일 교체
    await fs.rename(tempFile, dest);
    
    const srcStats = await fs.stat(src);
    const destStats = await fs.stat(dest);
    const reduction = ((1 - destStats.size / srcStats.size) * 100).toFixed(1);
    
    console.log(`✅ Compressed: ${path.basename(src)} (${reduction}% reduction)`);
  } catch (error) {
    console.error(`❌ Failed to compress ${src}:`, error.message);
  }
}

async function main() {
  console.log('🔧 Starting media optimization...\n');
  
  // 이미지 압축
  console.log('📸 Compressing images...');
  for (const config of IMAGES_TO_COMPRESS) {
    await compressImage(config);
  }
  
  console.log('\n🎬 Compressing videos...');
  
  // FFmpeg 확인
  await new Promise((resolve) => {
    exec('ffmpeg -version', (error) => {
      if (error) {
        console.log('⚠️ FFmpeg not found. Skipping video compression.');
        console.log('Install FFmpeg: sudo apt install ffmpeg (or brew install ffmpeg on macOS)');
        resolve();
        return;
      }
      
      // 비디오 압축 진행
      Promise.all(VIDEOS_TO_COMPRESS.map(compressVideo)).then(resolve);
    });
  });
  
  console.log('\n✨ Media optimization complete!');
}

main().catch(console.error);