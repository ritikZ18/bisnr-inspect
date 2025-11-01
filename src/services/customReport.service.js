import { launch } from 'puppeteer';
import { render } from 'ejs';
import { promises as fs } from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname and __filename for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);




class CustomReportService {
  async generateReport(inspectionData) {
    try {
      // Analyze and enhance data for custom report
      const enhancedData = this.enhanceData(inspectionData);
      
      // Generate HTML
      const html = await this.renderTemplate(enhancedData);
      
      // Convert to PDF
      const pdf = await this.generatePDF(html);
      
      return pdf;
    } catch (error) {
      throw new Error(`Custom report generation failed: ${error.message}`);
    }
  }

  enhanceData(data) {
    // Add severity levels and categorization
    const severityCategories = {
      critical: [],
      major: [],
      minor: [],
      maintenance: []
    };

    data.sections.forEach(section => {
      section.lineItems.forEach(item => {
        if (item.status === 'D') {
          // Categorize based on section and comments
          const severity = this.determineSeverity(section.name, item);
          severityCategories[severity].push({
            section: section.name,
            item: item.name,
            comments: item.comments
          });
        }
      });
    });

    // Generate executive summary
    const executiveSummary = {
      propertyCondition: this.calculatePropertyCondition(data),
      majorConcerns: severityCategories.critical.concat(severityCategories.major),
      totalIssues: data.metadata.totalIssues,
      recommendedActions: this.generateRecommendations(severityCategories)
    };

    // Create charts data
    const chartData = {
      severityChart: {
        labels: ['Critical', 'Major', 'Minor', 'Maintenance'],
        data: [
          severityCategories.critical.length,
          severityCategories.major.length,
          severityCategories.minor.length,
          severityCategories.maintenance.length
        ]
      },
      sectionChart: {
        labels: data.sections.map(s => s.name),
        data: data.sections.map(s => 
          s.lineItems.filter(i => i.status === 'D').length
        )
      }
    };

    return {
      ...data,
      severityCategories,
      executiveSummary,
      chartData,
      tableOfContents: this.generateTableOfContents(data.sections)
    };
  }

  determineSeverity(sectionName, item) {
    // Logic to determine severity based on section and item
    const criticalSections = ['Structural Systems', 'Electrical Systems', 'Foundation'];
    const majorSections = ['Roofing System', 'HVAC Systems', 'Plumbing Systems'];
    
    if (criticalSections.includes(sectionName)) {
      return item.comments.some(c => c.text.toLowerCase().includes('safety')) 
        ? 'critical' 
        : 'major';
    }
    if (majorSections.includes(sectionName)) {
      return 'major';
    }
    return 'minor';
  }

  calculatePropertyCondition(data) {
    const score = 100 - (data.metadata.totalIssues * 2);
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Attention';
  }

  generateRecommendations(severityCategories) {
    const recommendations = [];
    
    if (severityCategories.critical.length > 0) {
      recommendations.push('Immediate attention required for critical safety issues');
    }
    if (severityCategories.major.length > 0) {
      recommendations.push('Schedule repairs for major deficiencies within 30 days');
    }
    if (severityCategories.minor.length > 0) {
      recommendations.push('Plan maintenance for minor issues within 90 days');
    }
    
    return recommendations;
  }

  generateTableOfContents(sections) {
    return sections.map((section, index) => ({
      number: index + 1,
      name: section.name,
      page: index + 3 // Assuming summary takes 2 pages
    }));
  }

  async renderTemplate(data) {
    const templatePath = join(__dirname, '../templates/custom/template.ejs');
    const template = await fs.readFile(templatePath, 'utf8');
    
    return render(template, { data });
  }

  async generatePDF(html) {
    const browser = await launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      const pdf = await page.pdf({
        format: 'Letter',
        printBackground: true,
        displayHeaderFooter: true,
        margin: {
          top: '1in',
          right: '0.5in',
          bottom: '1in',
          left: '0.5in'
        }
      });

      return pdf;
    } finally {
      await browser.close();
    }
  }
}

export default CustomReportService;