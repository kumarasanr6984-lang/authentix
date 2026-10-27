/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const distPath = path.resolve(__dirname, 'dist');

// Security headers & CORS handling
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Serve static compiled assets from dist
app.use(express.static(distPath, {
  maxAge: '1d',
  index: false,
}));

// Production SPA Fallback: Any subpath (e.g. /admin, /dashboard, /tracking)
// returns index.html so React Router browser history takes over without 404 errors
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Authentix Production SPA server running on http://0.0.0.0:${PORT}`);
  console.log(`Base URL configured: https://authentix-edu.in`);
});
