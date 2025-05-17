#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// 이미지 디렉토리 설정
const IMAGE_DIRS = [
  path.join(__dirname, '../public/ss'),
  path.join(__dirname, '../public/zz'),
  path.join(__dirname, '../public'),
  path.join(__dirname, '../public/nft-previews')
];

// 최적화 설정
const OPTIMIZATION_CONFIG = {
  png: {
    quality: 85,
    compressionLevel: 9,
    adaptiveFiltering: true,
    palette: true
  },
  jpg: {
    quality: 85,
    progressive: true,
    mozjpeg: true
  },
  webp: {
    quality: 85,
    effort: 6
  },
  maxWidth: 2400,
  skipSize: 50 * 1024 // 50KB 이하는 건너뛰기
};

// 파일 크기 포맷팅
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// 이미지 최적화
async function optimizeImage(inputPath, outputPath, format) {
  try {
    const sharpInstance = sharp(inputPath);
    const metadata = await sharpInstance.metadata();
    
    // 크기 조정 (필요한 경우)
    if (metadata.width > OPTIMIZATION_CONFIG.maxWidth) {
      sharpInstance.resize(OPTIMIZATION_CONFIG.maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
    }

    // 포맷별 최적화
    switch (format) {
      case 'png':
        await sharpInstance
          .png({
            quality: OPTIMIZATION_CONFIG.png.quality,
            compressionLevel: OPTIMIZATION_CONFIG.png.compressionLevel,
            adaptiveFiltering: OPTIMIZATION_CONFIG.png.adaptiveFiltering,
            palette: OPTIMIZATION_CONFIG.png.palette
          })
          .toFile(outputPath);
        break;
        
      case 'jpeg':
        await sharpInstance
          .jpeg({
            quality: OPTIMIZATION_CONFIG.jpg.quality,
            progressive: OPTIMIZATION_CONFIG.jpg.progressive,
            mozjpeg: OPTIMIZATION_CONFIG.jpg.mozjpeg
          })
          .toFile(outputPath);
        break;
        
      case 'webp':
        await sharpInstance
          .webp({
            quality: OPTIMIZATION_CONFIG.webp.quality,
            effort: OPTIMIZATION_CONFIG.webp.effort
          })
          .toFile(outputPath);
        break;
    }
    
    return true;
  } catch (error) {
    console.error(`최적화 실패 (${format}): ${inputPath}`, error.message);
    return false;
  }
}

// 메인 최적화 함수
async function optimizeImages() {
  console.log('🚀 이미지 최적화 시작...\n');

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;
  let skippedCount = 0;

  for (const dir of IMAGE_DIRS) {
    if (!fs.existsSync(dir)) {
      continue;
    }

    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      // 디렉토리나 작은 파일은 건너뛰기
      if (stats.isDirectory() || stats.size < OPTIMIZATION_CONFIG.skipSize) {
        if (!stats.isDirectory() && !['.js', '.json', '.css', '.md'].includes(path.extname(file))) {
          skippedCount++;
        }
        continue;
      }

      const ext = path.extname(file).toLowerCase();
      const baseName = path.basename(file, ext);
      
      if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
        console.log(`\n📁 처리 중: ${file}`);
        console.log(`   원본 크기: ${formatFileSize(stats.size)}`);
        
        totalOriginalSize += stats.size;
        
        // 최적화 디렉토리 생성
        const optimizedDir = path.join(dir, 'optimized');
        if (!fs.existsSync(optimizedDir)) {
          fs.mkdirSync(optimizedDir, { recursive: true });
        }
        
        // 원본 형식 최적화
        const optimizedPath = path.join(optimizedDir, file);
        let originalFormat = ext.substring(1);
        if (originalFormat === 'jpg') originalFormat = 'jpeg';
        
        // GIF는 현재 WebP로만 변환
        if (ext === '.gif') {
          const webpPath = path.join(optimizedDir, `${baseName}.webp`);
          const webpSuccess = await optimizeImage(filePath, webpPath, 'webp');
          
          if (webpSuccess && fs.existsSync(webpPath)) {
            const webpStats = fs.statSync(webpPath);
            console.log(`   WebP 변환: ${formatFileSize(webpStats.size)} (${Math.round((1 - webpStats.size / stats.size) * 100)}% 감소)`);
          }
        } else {
          // 다른 형식은 원본 형식 최적화 + WebP 변환
          const optimizeSuccess = await optimizeImage(filePath, optimizedPath, originalFormat);
          
          if (optimizeSuccess && fs.existsSync(optimizedPath)) {
            const optimizedStats = fs.statSync(optimizedPath);
            console.log(`   ${ext.toUpperCase()} 최적화: ${formatFileSize(optimizedStats.size)} (${Math.round((1 - optimizedStats.size / stats.size) * 100)}% 감소)`);
            totalOptimizedSize += optimizedStats.size;
          }
          
          // WebP 변환 (GIF 제외)
          if (ext !== '.webp') {
            const webpPath = path.join(optimizedDir, `${baseName}.webp`);
            const webpSuccess = await optimizeImage(filePath, webpPath, 'webp');
            
            if (webpSuccess && fs.existsSync(webpPath)) {
              const webpStats = fs.statSync(webpPath);
              console.log(`   WebP 변환: ${formatFileSize(webpStats.size)} (${Math.round((1 - webpStats.size / stats.size) * 100)}% 감소)`);
            }
          }
        }
        
        processedCount++;
      }
    }
  }

  console.log('\n✨ 이미지 최적화 완료!\n');
  console.log(`처리된 파일: ${processedCount}개`);
  console.log(`건너뛴 작은 파일: ${skippedCount}개`);
  console.log(`원본 총 크기: ${formatFileSize(totalOriginalSize)}`);
  console.log(`최적화 후 크기: ${formatFileSize(totalOptimizedSize)}`);
  
  if (totalOptimizedSize > 0) {
    console.log(`총 절감: ${Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100)}%`);
  }
  
  console.log('\n다음 단계:');
  console.log('1. 각 디렉토리의 optimized 폴더를 확인하세요');
  console.log('2. 품질이 만족스러우면 원본을 백업 후 교체하세요');
  console.log('3. BlogMedia 컴포넌트가 WebP 버전을 자동으로 사용할 수 있습니다');
}

// 스크립트 실행
optimizeImages().catch(error => {
  console.error('최적화 중 오류 발생:', error);
  process.exit(1);
});