import { launch } from 'puppeteer';
import { render } from 'ejs';
import { promises as fs } from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';
import ImageProcessorService from './imageProcessor.service.js';

// Recreate __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



class TrecReportService {
  constructor() {
    this.imageProcessor = new ImageProcessorService();
  }

  async generateReport(inspectionData) {
    try {
      // Process images for embedding
      const processedData = await this.preprocessData(inspectionData);
      
      // Generate HTML from template
      const html = await this.renderTemplate(processedData);
      
      // Convert HTML to PDF
      const pdf = await this.generatePDF(html);
      
      return pdf;
    } catch (error) {
      throw new Error(`TREC report generation failed: ${error.message}`);
    }
  }

  async preprocessData(data) {
    // Process and optimize images
    const processedSections = await Promise.all(
      data.sections.map(async section => ({
        ...section,
        lineItems: await Promise.all(
          section.lineItems.map(async item => ({
            ...item,
            comments: await this.processItemComments(item.comments)
          }))
        )
      }))
    );

    return {
      ...data,
      sections: processedSections
    };
  }

  async processItemComments(comments) {
    return Promise.all(
      comments.map(async comment => {
        if (comment.photos && comment.photos.length > 0) {
          // For now, we'll use URLs directly
          // In production, you'd download and optimize these
          return comment;
        }
        return comment;
      })
    );
  }

  async renderTemplate(data) {
    const templatePath = join(__dirname, '../templates/trec/template.ejs');
    const template = await fs.readFile(templatePath, 'utf8');
    
    return render(template, { 
      data,
      formatDate: this.formatDate,
      getCheckboxClass: this.getCheckboxClass
    });
  }

  async generatePDF(html) {
    const browser = await launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // Set content with styles
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Generate PDF
      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `,
        margin: {
          top: '0.75in',
          right: '0.5in',
          bottom: '0.75in',
          left: '0.5in'
        }
      });

      return pdf;
    } finally {
      await browser.close();
    }
  }

  formatDate(date) {
    if (!date) return 'Data not found in test data';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getCheckboxClass(status, checkType) {
    if (checkType === 'I' && status === 'I') return 'checked';
    if (checkType === 'NI' && status === 'NI') return 'checked';
    if (checkType === 'NP' && status === 'NP') return 'checked';
    if (checkType === 'D' && status === 'D') return 'checked';
    return '';
  }
}

export default TrecReportService;