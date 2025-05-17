const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const imageDir = path.join(__dirname, '../public/zz');
const backupDir = path.join(imageDir, 'backup');

// 백업 폴더 생성
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// 이미지 최적화 함수
async function optimizeImage(inputPath, outputPath) {
  try {
    // 원본 백업
    const backupPath = path.join(backupDir, path.basename(inputPath));
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(inputPath, backupPath);
    }

    const metadata = await sharp(inputPath).metadata();
    const originalSize = fs.statSync(inputPath).size;

    let pipeline = sharp(inputPath);

    // 큰 이미지는 리사이즈
    const maxSize = 1920;
    if (metadata.width > maxSize || metadata.height > maxSize) {
      pipeline = pipeline.resize(maxSize, maxSize, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // PNG를 JPG로 변환하고 최적화
    if (path.extname(inputPath).toLowerCase() === '.png') {
      await pipeline
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);
    } else {
      // JPG 재압축
      await pipeline
        .jpeg({ quality: 85, progressive: true })
        .toFile(outputPath);
    }

    const newSize = fs.statSync(outputPath).size;
    const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
    
    console.log(`${path.basename(inputPath)}: ${(originalSize/1024).toFixed(1)}KB -> ${(newSize/1024).toFixed(1)}KB (${reduction}% 감소)`);
    
  } catch (error) {
    console.error(`Error processing ${inputPath}:`, error);
  }
}

// 이미지 처리
async function processImages() {
  const files = fs.readdirSync(imageDir);
  
  for (const file of files) {
    if (file.match(/\.(png|jpg|jpeg)$/i) && file !== 'backup') {
      const inputPath = path.join(imageDir, file);
      let outputPath;
      
      if (file.endsWith('.png')) {
        outputPath = path.join(imageDir, file.replace('.png', '_optimized.jpg'));
      } else {
        outputPath = path.join(imageDir, file.replace(/\.(jpg|jpeg)$/i, '_optimized.jpg'));
      }
      
      await optimizeImage(inputPath, outputPath);
    }
  }
  
  console.log('\n이미지 최적화 완료!');
  console.log('원본 파일은 backup 폴더에 저장되었습니다.');
}

processImages().catch(console.error);