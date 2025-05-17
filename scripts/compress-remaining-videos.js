const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const videos = [
  // zz 폴더 영상들
  { name: 'zz/0873.mp4', crf: 28, audioBitrate: '128k' },
  { name: 'zz/0873z.mp4', crf: 28, audioBitrate: '128k' },
  
  // nft-previews 폴더 영상들
  { name: 'nft-previews/0625.mp4', crf: 28, audioBitrate: '128k' },
  { name: 'nft-previews/tsts.mp4', crf: 28, audioBitrate: '128k' },
  { name: 'nft-previews/0113.mp4', crf: 28, audioBitrate: '128k' }
];

async function createBackup(fileName) {
  const backupDir = 'public/backup';
  await fs.mkdir(backupDir, { recursive: true });
  
  const source = path.join('public', fileName);
  const backup = path.join(backupDir, `${fileName.replace(/\//g, '_')}.backup`);
  
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
  const dir = path.dirname(source);
  const baseName = path.basename(name, '.mp4');
  const temp = path.join(dir, `temp_${baseName}.mp4`);
  
  // 백업 생성
  const backupSuccess = await createBackup(name);
  if (!backupSuccess) return;
  
  console.log(`\n🎬 Compressing ${name}...`);
  
  const command = `ffmpeg -i "${source}" -c:v libx264 -preset slow -crf ${crf} -c:a aac -b:a ${audioBitrate} -movflags +faststart "${temp}" -y`;
  
  return new Promise((resolve) => {
    const startTime = Date.now();
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
        const backupPath = path.join('public/backup', `${name.replace(/\//g, '_')}.backup`);
        const originalSize = await getFileSize(backupPath);
        const newSize = await getFileSize(source);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log(`✅ Compressed: ${name} (${originalSize} → ${newSize}) in ${duration}s`);
      } catch (err) {
        console.error(`❌ Failed to replace ${name}:`, err.message);
      }
      
      resolve();
    });
  });
}

async function main() {
  console.log('🔧 Starting video compression for remaining files...\n');
  
  for (const video of videos) {
    await compressVideo(video);
  }
  
  console.log('\n✨ All video compression complete!');
  
  // 최종 결과 요약
  console.log('\n📊 Final Summary:');
  for (const video of videos) {
    const source = path.join('public', video.name);
    const backup = path.join('public/backup', `${video.name.replace(/\//g, '_')}.backup`);
    
    try {
      const originalSize = await getFileSize(backup);
      const newSize = await getFileSize(source);
      console.log(`  ${video.name}: ${originalSize} → ${newSize}`);
    } catch (error) {
      console.log(`  ${video.name}: Error getting size info`);
    }
  }
}

main().catch(console.error);