import { promises as fs } from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


class JsonParserService {
  async parseInspectionData(filePath) {
    try {
      const rawData = await fs.readFile(filePath, 'utf8');
      const data = JSON.parse(rawData);
      return this.structureInspectionData(data);
    } catch (error) {
      throw new Error(`Failed to parse inspection data: ${error.message}`);
    }
  }

  structureInspectionData(data) {
    // Extract basic property info
    const property = {
      id: data.id,
      address: data.address || 'Data not found in test data',
      client: data.client || 'Data not found in test data',
      inspector: data.inspector || 'Data not found in test data',
      inspectionDate: data.inspection_date || new Date().toLocaleDateString(),
      propertyType: data.property_type || 'Single Family Home',
      yearBuilt: data.year_built || 'Data not found in test data',
      squareFootage: data.square_footage || 'Data not found in test data'
    };

    // Process sections with hierarchical structure
    const sections = this.processSections(data.sections || []);
    
    // Extract all media URLs for optimization
    const media = this.extractAllMedia(sections);

    return {
      property,
      sections,
      media,
      summary: this.generateSummary(sections),
      metadata: {
        totalSections: sections.length,
        totalIssues: this.countIssues(sections),
        totalImages: media.images.length,
        totalVideos: media.videos.length
      }
    };
  }

  processSections(sections) {
    return sections
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(section => ({
        id: section.id,
        name: section.name,
        order: section.order,
        lineItems: this.processLineItems(section.line_items || [])
      }));
  }

  processLineItems(lineItems) {
    return lineItems
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(item => ({
        id: item.id,
        name: item.name,
        order: item.order,
        status: this.determineStatus(item),
        comments: this.processComments(item.comments || [])
      }));
  }

  processComments(comments) {
    return comments
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(comment => ({
        id: comment.id,
        text: comment.text || '',
        severity: comment.severity || 'info',
        photos: comment.photos || [],
        videos: comment.videos || [],
        order: comment.order
      }));
  }

  determineStatus(item) {
    // Determine if item is Inspected, Not Inspected, or Deficient
    if (item.not_present) return 'NP';
    if (item.deficient) return 'D';
    if (item.not_inspected) return 'NI';
    return 'I';
  }

  extractAllMedia(sections) {
    const images = [];
    const videos = [];

    sections.forEach(section => {
      section.lineItems.forEach(item => {
        item.comments.forEach(comment => {
          if (comment.photos) images.push(...comment.photos);
          if (comment.videos) videos.push(...comment.videos);
        });
      });
    });

    return { images, videos };
  }

  generateSummary(sections) {
    let deficientCount = 0;
    let inspectedCount = 0;
    let notInspectedCount = 0;

    sections.forEach(section => {
      section.lineItems.forEach(item => {
        switch(item.status) {
          case 'D': deficientCount++; break;
          case 'I': inspectedCount++; break;
          case 'NI': notInspectedCount++; break;
        }
      });
    });

    return {
      deficientItems: deficientCount,
      inspectedItems: inspectedCount,
      notInspectedItems: notInspectedCount,
      totalItems: deficientCount + inspectedCount + notInspectedCount
    };
  }

  countIssues(sections) {
    return sections.reduce((total, section) => {
      return total + section.lineItems.filter(item => item.status === 'D').length;
    }, 0);
  }
}

export default JsonParserService;