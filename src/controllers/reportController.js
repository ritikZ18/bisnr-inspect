import JsonParserService from '../services/jsonParser.service.js';
import TrecReportService from '../services/trecReport.service.js';
import CustomReportService from '../services/customReport.service.js';
import { promises as fs } from 'fs';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportController {
  async generateReports(req, res) {
    const startTime = Date.now();
    
    try {
      const inputFile = req.body.inputFile || join(__dirname, '../../data/inspection.json');
      const generateCustom = req.body.generateCustom !== false;
      
      // Parse inspection data
      console.log('📊 Parsing inspection data...');
      const parser = new JsonParserService();
      const inspectionData = await parser.parseInspectionData(inputFile);
      
      // Generate TREC report
      console.log('📝 Generating TREC report...');
      const trecService = new TrecReportService();
      const trecPdf = await trecService.generateReport(inspectionData);
      await fs.writeFile(join(__dirname, '../../output/output_pdf.pdf'), trecPdf);
      
      // Generate custom report (bonus)
      let customGenerated = false;
      if (generateCustom) {
        console.log('🎨 Generating custom report...');
        const customService = new CustomReportService();
        const customPdf = await customService.generateReport(inspectionData);
        await fs.writeFile(join(__dirname, '../../output/bonus_pdf.pdf'), customPdf);
        customGenerated = true;
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Reports generated in ${duration}s`);
      
      res.json({ 
        success: true,
        duration: `${duration}s`,
        files: {
          trec: 'output/output_pdf.pdf',
          custom: customGenerated ? 'output/bonus_pdf.pdf' : null
        }
      });
      
    } catch (error) {
      console.error('Error generating reports:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

export default new ReportController();