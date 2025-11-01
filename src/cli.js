#!/usr/bin/env node

import ReportController from './controllers/reportController.js';
import path, { join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateReportsFromCLI() {
  console.log('🚀 Starting Binsr Inspect Report Generation...\n');
  
  try {
    const inputFile = process.argv[2] || join(__dirname, '../data/inspection.json');
    
    console.log(`📂 Reading inspection data from: ${inputFile}`);
    
    // Mock request and response objects for CLI usage
    const req = { 
      body: { 
        inputFile,
        generateCustom: true 
      } 
    };
    
    const res = {
      json: (data) => {
        if (data.success) {
          console.log('\n✅ Reports generated successfully!');
          console.log('📄 TREC Report: ./output/output_pdf.pdf');
          console.log('📄 Custom Report: ./output/bonus_pdf.pdf');
        } else {
          console.error('❌ Error:', data.error);
        }
      },
      status: () => ({ json: (data) => console.error('❌ Error:', data.error) })
    };
    
    await ReportController.generateReports(req, res);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// // Run if called directly
// import { fileURLToPath } from 'url';
// import path from 'path';

// // Equivalent of __dirname and __filename in ESM
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Run only if executed directly from CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateReportsFromCLI();
}
export default generateReportsFromCLI;