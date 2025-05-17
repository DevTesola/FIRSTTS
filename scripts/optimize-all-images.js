#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
    webpQuality: 85,    // WebP 품질 (85가 좋은 균형)
    pngQuality: '65-80' // PNG 품질 범위
  },
  jpg: {
    quality: 85,        // JPEG 품질
    webpQuality: 85     // WebP 품질
  },
  maxWidth: 2400,       // 최대 너비
  skipSize: 50 * 1024   // 50KB 이하는 건너뛰기
};

// 도구 확인
function checkTools() {
  const tools = {
    convert: 'ImageMagick (이미지 변환)',
    cwebp: 'WebP 도구 (PNG/JPG → WebP)',
    pngquant: 'PNG 압축 도구',
    jpegoptim: 'JPEG 최적화 도구'
  };

  let allInstalled = true;
  
  for (const [command, description] of Object.entries(tools)) {
    try {
      execSync(`which ${command}`, { stdio: 'ignore' });
      console.log(`✅ ${description} 설치됨`);
    } catch {
      console.error(`❌ ${description} 설치 필요`);
      allInstalled = false;
    }
  }

  if (!allInstalled) {
    console.log('\n설치 명령어:');
    console.log('Ubuntu/Debian: sudo apt-get install imagemagick webp pngquant jpegoptim');
    console.log('macOS: brew install imagemagick webp pngquant jpegoptim');
    console.log('\n또는 Node.js 패키지 사용:');
    console.log('npm install -g imagemin-cli imagemin-webp imagemin-pngquant');
    return false;
  }
  
  return true;
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// PNG 최적화
function optimizePNG(inputPath, outputPath) {
  try {
    // 1. PNG 압축 (pngquant)
    const tempPath = inputPath.replace('.png', '_temp.png');
    execSync(`pngquant --quality=${OPTIMIZATION_CONFIG.png.pngQuality} --speed=1 "${inputPath}" -o "${tempPath}" --force`, { stdio: 'ignore' });
    
    // 2. 크기 조정 (필요한 경우)
    execSync(`convert "${tempPath}" -resize "${OPTIMIZATION_CONFIG.maxWidth}>" "${outputPath}"`, { stdio: 'ignore' });
    
    // 3. 임시 파일 삭제
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    return true;
  } catch (error) {
    console.error(`PNG 최적화 실패: ${inputPath}`);
    return false;
  }
}

// PNG를 WebP로 변환
function convertPNGToWebP(inputPath, outputPath) {
  try {
    execSync(`cwebp -q ${OPTIMIZATION_CONFIG.png.webpQuality} "${inputPath}" -o "${outputPath}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error(`WebP 변환 실패: ${inputPath}`);
    return false;
  }
}

// JPEG 최적화
function optimizeJPEG(inputPath, outputPath) {
  try {
    // 1. 크기 조정 (필요한 경우)
    const tempPath = inputPath.replace(/\.(jpg|jpeg)$/i, '_temp.jpg');
    execSync(`convert "${inputPath}" -resize "${OPTIMIZATION_CONFIG.maxWidth}>" "${tempPath}"`, { stdio: 'ignore' });
    
    // 2. JPEG 최적화
    execSync(`jpegoptim --max=${OPTIMIZATION_CONFIG.jpg.quality} --strip-all --overwrite "${tempPath}"`, { stdio: 'ignore' });
    
    // 3. 파일 이동
    fs.renameSync(tempPath, outputPath);
    
    return true;
  } catch (error) {
    console.error(`JPEG 최적화 실패: ${inputPath}`);
    return false;
  }
}

// JPEG를 WebP로 변환
function convertJPEGToWebP(inputPath, outputPath) {
  try {
    execSync(`cwebp -q ${OPTIMIZATION_CONFIG.jpg.webpQuality} "${inputPath}" -o "${outputPath}"`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    console.error(`WebP 변환 실패: ${inputPath}`);
    return false;
  }
}

// 메인 최적화 함수
async function optimizeImages() {
  if (!checkTools()) {
    return;
  }

  console.log('\n🚀 이미지 최적화 시작...\n');

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  let processedCount = 0;

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
        continue;
      }

      const ext = path.extname(file).toLowerCase();
      const baseName = path.basename(file, ext);
      
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        console.log(`\n📁 처리 중: ${file}`);
        console.log(`   원본 크기: ${formatFileSize(stats.size)}`);
        
        totalOriginalSize += stats.size;
        
        // 최적화 디렉토리 생성
        const optimizedDir = path.join(dir, 'optimized');
        if (!fs.existsSync(optimizedDir)) {
          fs.mkdirSync(optimizedDir);
        }
        
        // PNG 처리
        if (ext === '.png') {
          // PNG 최적화
          const optimizedPNG = path.join(optimizedDir, file);
          if (optimizePNG(filePath, optimizedPNG)) {
            const optimizedStats = fs.statSync(optimizedPNG);
            console.log(`   PNG 최적화: ${formatFileSize(optimizedStats.size)} (${Math.round((1 - optimizedStats.size / stats.size) * 100)}% 감소)`);
            totalOptimizedSize += optimizedStats.size;
          }
          
          // WebP 변환
          const webpPath = path.join(optimizedDir, `${baseName}.webp`);
          if (convertPNGToWebP(filePath, webpPath)) {
            const webpStats = fs.statSync(webpPath);
            console.log(`   WebP 변환: ${formatFileSize(webpStats.size)} (${Math.round((1 - webpStats.size / stats.size) * 100)}% 감소)`);
          }
        }
        
        // JPEG 처리
        if (['.jpg', '.jpeg'].includes(ext)) {
          // JPEG 최적화
          const optimizedJPEG = path.join(optimizedDir, file);
          if (optimizeJPEG(filePath, optimizedJPEG)) {
            const optimizedStats = fs.statSync(optimizedJPEG);
            console.log(`   JPEG 최적화: ${formatFileSize(optimizedStats.size)} (${Math.round((1 - optimizedStats.size / stats.size) * 100)}% 감소)`);
            totalOptimizedSize += optimizedStats.size;
          }
          
          // WebP 변환
          const webpPath = path.join(optimizedDir, `${baseName}.webp`);
          if (convertJPEGToWebP(filePath, webpPath)) {
            const webpStats = fs.statSync(webpPath);
            console.log(`   WebP 변환: ${formatFileSize(webpStats.size)} (${Math.round((1 - webpStats.size / stats.size) * 100)}% 감소)`);
          }
        }
        
        processedCount++;
      }
    }
  }

  console.log('\n✨ 이미지 최적화 완료!\n');
  console.log(`처리된 파일: ${processedCount}개`);
  console.log(`원본 총 크기: ${formatFileSize(totalOriginalSize)}`);
  console.log(`최적화 후 크기: ${formatFileSize(totalOptimizedSize)}`);
  console.log(`총 절감: ${Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100)}%`);
  
  console.log('\n다음 단계:');
  console.log('1. optimized 폴더의 이미지들을 확인하세요');
  console.log('2. 품질이 만족스러우면 원본을 백업 후 교체하세요');
  console.log('3. Next.js Image 컴포넌트를 사용하여 자동 최적화를 활용하세요');
}

// 스크립트 실행
optimizeImages().catch(error => {
  console.error('최적화 중 오류 발생:', error);
  process.exit(1);
});