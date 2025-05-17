const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, '../public');
const optimizedDir = path.join(publicDir, 'optimized');

// Create optimized directory if it doesn't exist
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Optimize single logo
async function optimizeLogo(inputPath, outputPath, targetWidth = 200) {
  try {
    const metadata = await sharp(inputPath).metadata();
    console.log(`Processing ${path.basename(inputPath)}: ${metadata.width}x${metadata.height}, ${metadata.format}`);
    
    let pipeline = sharp(inputPath);
    
    // Resize if larger than target
    if (metadata.width > targetWidth || metadata.height > targetWidth) {
      pipeline = pipeline.resize(targetWidth, targetWidth, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    // Convert to WebP
    await pipeline
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    const originalSize = (await fs.stat(inputPath)).size;
    const newSize = (await fs.stat(outputPath)).size;
    const reduction = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(`✅ Optimized: ${(originalSize/1024).toFixed(1)}KB → ${(newSize/1024).toFixed(1)}KB (${reduction}% reduction)`);
    
  } catch (error) {
    console.error(`Error optimizing ${inputPath}:`, error);
  }
}

async function main() {
  try {
    await ensureDir(optimizedDir);
    
    // Optimize Solflare logo
    const solflarePath = path.join(publicDir, 'solflare.jpg');
    const solflareOutputPath = path.join(optimizedDir, 'solflare.webp');
    
    await optimizeLogo(solflarePath, solflareOutputPath, 200);
    
    // Check if phantom needs optimization
    const phantomPath = path.join(publicDir, 'phantom.webp');
    const phantomOutputPath = path.join(optimizedDir, 'phantom.webp');
    
    // Copy phantom as it's already optimized
    const phantomStats = await fs.stat(phantomPath);
    if (phantomStats.size < 10000) { // Less than 10KB
      console.log(`Phantom logo already optimized: ${(phantomStats.size/1024).toFixed(1)}KB`);
      await fs.copyFile(phantomPath, phantomOutputPath);
    } else {
      await optimizeLogo(phantomPath, phantomOutputPath, 200);
    }
    
    console.log('\n✨ Wallet logos optimization complete!');
    console.log('Optimized files saved to:', optimizedDir);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

main();