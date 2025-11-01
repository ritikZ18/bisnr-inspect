import express, { json, staticS } from 'express';
import path from 'path';
import fs from 'fs';
import { generateReports } from './controllers/reportController.js';
import { createLogger, format as _format, transports as _transports } from 'winston';

// Configure logger
const logger = createLogger({
  level: 'info',
  format: _format.json(),
  transports: [
    new _transports.Console({
      format: _format.simple()
    }),
    new _transports.File({ filename: 'error.log', level: 'error' }),
    new _transports.File({ filename: 'combined.log' })
  ]
});

global.logger = logger;

const app = express();
app.use(json());
app.use(staticS('public'));

// Routes
app.post('/generate-reports', generateReports);
app.get('/health', (req, res) => res.json({ status: 'healthy' }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info('To generate reports, POST to /generate-reports');
});