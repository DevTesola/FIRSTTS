const fs = require('fs');
const path = require('path');

const imageDir = path.join(__dirname, '../public/zz');
const backupDir = path.join(imageDir, 'backup');

// 백업 폴더에서 원본 파일 복원하고 최적화된 버전으로 교체
const files = fs.readdirSync(backupDir);

for (const file of files) {
  if (file.match(/\.(png|jpg)$/i)) {
    const backupPath = path.join(backupDir, file);
    const originalPath = path.join(imageDir, file);
    
    // PNG 파일은 JPG로 변경
    if (file.endsWith('.png')) {
      const newName = file.replace('.png', '.jpg');
      const newPath = path.join(imageDir, newName);
      
      // 백업에서 최적화된 파일 복사
      fs.copyFileSync(backupPath, newPath);
      console.log(`${file} -> ${newName}`);
      
      // 원본 PNG 삭제
      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }
    }
  }
}

console.log('이미지 교체 완료');

// evolution.js 파일 업데이트
const evolutionPath = path.join(__dirname, '../pages/evolution.js');
let evolutionContent = fs.readFileSync(evolutionPath, 'utf8');

// PNG를 JPG로 변경
evolutionContent = evolutionContent.replace(/beforeType: "png"/g, 'beforeType: "jpg"');

fs.writeFileSync(evolutionPath, evolutionContent);
console.log('evolution.js 업데이트 완료');