import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { auditRouter } from './server/routes/auditRoutes.ts';
import { authRouter } from './server/routes/authRoutes.ts';
import { complianceRouter } from './server/routes/complianceRoutes.ts';
import { dashboardRouter } from './server/routes/dashboardRoutes.ts';
import { scanRouter } from './server/routes/scanRoutes.ts';
import { settingsRouter } from './server/routes/settingsRoutes.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security headers compatible with embedded preview iframe & Vite dev client
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));

  // API v1 Routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/scan', scanRouter);
  app.use('/api/v1/audits', auditRouter);
  app.use('/api/v1/compliance', complianceRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/settings', settingsRouter);

  // Catch-all JSON 404 for unknown API paths
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Security, Privacy & Trust server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
