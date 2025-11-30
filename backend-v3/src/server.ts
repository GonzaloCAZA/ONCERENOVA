import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'express-async-errors';

import certificatesRouter from './routes/certificates';
import { AppError } from './utils/errors';
import { ErrorResponse } from './types/certificate.types';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    network: process.env.BSV_NETWORK || 'testnet'
  });
});

// Rutas
app.use('/api/certificates', certificatesRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: err.message,
      code: err.code
    };
    return res.status(err.statusCode).json(errorResponse);
  }

  // Error genérico
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
  res.status(500).json(errorResponse);
});

// 404 handler
app.use((req, res) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND'
  };
  res.status(404).json(errorResponse);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`
🚀 BSV Certificate Server running
📍 Port: ${PORT}
🌐 Network: ${process.env.BSV_NETWORK || 'testnet'}
🔒 Encryption: Enabled
⏰ Started: ${new Date().toISOString()}
  `);
});
