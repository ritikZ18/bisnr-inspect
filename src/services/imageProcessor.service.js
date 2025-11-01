import sharp from 'sharp';
import https from 'https';
import http from 'http';
import pLimit from 'p-limit';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



class ImageProcessorService {
  constructor() {
    this.limit = pLimit(5); // Process 5 images concurrently
  }

  async processImages(imageUrls) {
    const processedImages = await Promise.all(
      imageUrls.map(url => 
        this.limit(() => this.processImage(url))
      )
    );
    
    return processedImages;
  }

  async processImage(imageUrl) {
    try {
      // Download image
      const imageBuffer = await this.downloadImage(imageUrl);
      
      // Optimize image
      const optimized = await sharp(imageBuffer)
        .resize(800, 600, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 80,
          progressive: true 
        })
        .toBuffer();
      
      // Convert to base64 for embedding
      return `data:image/jpeg;base64,${optimized.toString('base64')}`;
    } catch (error) {
      console.error(`Failed to process image ${imageUrl}:`, error);
      return null; // Return null for failed images
    }
  }

  downloadImage(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      
      protocol.get(url, (response) => {
        const chunks = [];
        
        response.on('data', chunk => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }
}

export default ImageProcessorService;