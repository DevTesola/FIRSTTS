const sharp = require('sharp');

async function compressStars3() {
  try {
    await sharp('public/stars3.jpg')
      .jpeg({ quality: 75, mozjpeg: true })
      .toFile('public/stars3_optimized.jpg');
    
    console.log('stars3.jpg compressed successfully');
    
    // 복사된 파일을 원본으로 이동
    const fs = require('fs').promises;
    await fs.rename('public/stars3_optimized.jpg', 'public/stars3.jpg');
    
    console.log('File replaced successfully');
  } catch (error) {
    console.error('Error:', error);
  }
}

compressStars3();