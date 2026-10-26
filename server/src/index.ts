import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { DatabaseService } from './db.js';
import { createApiRouter } from './routes.js';
import { DEFAULT_CLEAN_PROJECT, DEFAULT_SAMPLE_PROJECT } from './sampleProject.js';

const PORT = parseInt(process.env.PORT || '8090', 10);
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize DB and seed clean starter project if empty
const db = new DatabaseService(DATA_DIR);
db.seedIfEmpty(DEFAULT_CLEAN_PROJECT);

// Register API Routes
app.use('/api', createApiRouter(db));

// Serve client static files if built
const clientDistCandidates = [
  path.join(process.cwd(), 'client', 'dist'),
  path.join(process.cwd(), '..', 'client', 'dist'),
  path.join(__dirname, '..', 'client', 'dist'),
  path.join(__dirname, '..', '..', 'client', 'dist'),
];

let clientDistPath = '';
for (const cand of clientDistCandidates) {
  if (fs.existsSync(cand) && fs.existsSync(path.join(cand, 'index.html'))) {
    clientDistPath = cand;
    break;
  }
}

if (clientDistPath) {
  console.log(`[Server] Serving frontend build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  console.log('[Server] No frontend client build found yet. API is available at /api');
  app.get('/', (req, res) => {
    res.json({
      name: 'Invisual Disparity Server',
      status: 'API running. Build the frontend client to view web UI.',
    });
  });
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 Invisual Disparity (Architecture & Modeling Suite)`);
  console.log(`📡 Server running on http://0.0.0.0:${PORT}`);
  console.log(`💾 Data stored at: ${DATA_DIR}`);
  console.log(`=======================================================`);
});

const gracefulShutdown = (signal: string) => {
  console.log(`[Server] ${signal} signal received: closing HTTP server`);
  server.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
