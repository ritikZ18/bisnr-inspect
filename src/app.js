import express from 'express';
import fs from 'fs';
import ReportController  from './controllers/reportController.js';
import { createLogger, format as _format, transports as _transports } from 'winston';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



// Configure logger
const logger = createLogger({
  level: 'info',
  format: _format.json(),
  transports: [
    new _transports.Console({
      format: _format.simple()
    }),
     new _transports.Console({ format: _format.simple() }),
    new _transports.File({ filename: 'error.log', level: 'error' }),
    new _transports.File({ filename: 'combined.log' })
  ]
});

global.logger = logger;

const app = express();
app.use(express.json());

app.use(express.static('public'));
app.use('/output', express.static(path.join(__dirname, '../output')));

// Routes
app.post('/generate-reports',(req,res) =>  ReportController.generateReports(req,res));
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info('To generate reports, POST to /generate-reports');
});