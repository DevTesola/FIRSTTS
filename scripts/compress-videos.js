const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const videos = [
  { name: 'intro.mp4', crf: 32, audioBitrate: '96k' },  // 더 많이 압축
  { name: 'dev.mp4', crf: 28, audioBitrate: '128k' },
  { name: 'SOLARA.mp4', crf: 28, audioBitrate: '128k' }
];

async function createBackup(fileName) {
  const backupDir = 'public/backup';
  await fs.mkdir(backupDir, { recursive: true });
  
  const source = path.join('public', fileName);
  const backup = path.join(backupDir, `${fileName}.backup`);
  
  try {
    await fs.copyFile(source, backup);
    console.log(`✅ Backed up: ${fileName}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to backup ${fileName}:`, error.message);
    return false;
  }
}

async function getFileSize(filePath) {
  const stats = await fs.stat(filePath);
  const size = stats.size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

async function compressVideo({ name, crf, audioBitrate }) {
  const source = path.join('public', name);
  const temp = path.join('public', `temp_${name}`);
  
  // 백업 생성
  const backupSuccess = await createBackup(name);
  if (!backupSuccess) return;
  
  console.log(`\n🎬 Compressing ${name}...`);
  
  const command = `ffmpeg -i "${source}" -c:v libx264 -preset slow -crf ${crf} -c:a aac -b:a ${audioBitrate} -movflags +faststart "${temp}" -y`;
  
  return new Promise((resolve) => {
    exec(command, async (error) => {
      if (error) {
        console.error(`❌ Failed to compress ${name}:`, error.message);
        try {
          await fs.unlink(temp);
        } catch {}
        resolve();
        return;
      }
      
      try {
        // 원본 파일 교체
        await fs.rename(temp, source);
        
        // 크기 비교
        const backupPath = path.join('public/backup', `${name}.backup`);
        const originalSize = await getFileSize(backupPath);
        const newSize = await getFileSize(source);
        
        console.log(`✅ Compressed: ${name} (${originalSize} → ${newSize})`);
      } catch (err) {
        console.error(`❌ Failed to replace ${name}:`, err.message);
      }
      
      resolve();
    });
  });
}

async function main() {
  console.log('🔧 Starting video compression...\n');
  
  for (const video of videos) {
    await compressVideo(video);
  }
  
  console.log('\n✨ Video compression complete!');
}

main().catch(console.error);