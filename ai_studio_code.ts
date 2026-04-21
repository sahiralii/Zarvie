import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './server/config/db.ts';
import authRoutes from './server/routes/authRoutes.ts';
import productRoutes from './server/routes/productRoutes.ts';

// Root-level relative path handling for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Connect to DB
  await connectDB();

  // Middleware
  app.use(express.json());
  app.use(cors());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);

  // Vite integration / Static File Serving
  const distPath = path.join(process.cwd(), 'dist');
  const isProd = fs.existsSync(path.join(distPath, 'index.html'));
  
  if (!isProd) {
    console.log('🏗️ Starting in Development Mode (Vite Middleware)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('🚀 Starting in Production Mode (Serving Static Files)');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();