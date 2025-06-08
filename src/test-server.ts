/**
 * Minimal test server to debug startup issues
 */

import express from 'express';
import { logger } from './infrastructure/logging';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 4828;

app.listen(PORT, () => {
  logger.info(`Test server running on port ${PORT}`);
});
