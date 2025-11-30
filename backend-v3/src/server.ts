import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import 'express-async-errors';

import certificatesRouter from './routes/certificates';
import { AppError } from './utils/errors';
import { ErrorResponse } from './types/certificate.types';

// Cargar variables de entorno desde archivo .env
dotenv.config();

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3001;

// ========== MIDDLEWARES DE SEGURIDAD ==========

// Helmet: protege contra vulnerabilidades comunes (headers HTTP seguros)
app.use(helmet());

// CORS: permite solicitudes desde otros dominios
app.use(cors());

// Parser JSON: convierte cuerpo de solicitud a JSON (límite: 10MB)
app.use(express.json({ limit: '10mb' }));

// ========== RUTAS PÚBLICAS ==========

// Health check: verificar que el servidor esté funcionando
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',  // Estado del servidor
    timestamp: new Date().toISOString(),  // Marca de tiempo
    network: process.env.BSV_NETWORK || 'testnet'  // Red de Bitcoin SV
  });
});

// ========== RUTAS PRINCIPALES ==========

// Rutas de certificados: almacenar, recuperar, listar
app.use('/api/certificates', certificatesRouter);

// ========== MANEJADORES DE ERRORES ==========

// Middleware de error: procesa errores ocurridos en rutas
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);

  // Si es un AppError personalizado, enviar respuesta con código y estado HTTP específicos
  if (err instanceof AppError) {
    const errorResponse: ErrorResponse = {
      success: false,
      error: err.message,  // Mensaje de error
      code: err.code  // Código de error personalizado
    };
    return res.status(err.statusCode).json(errorResponse);
  }

  // Error genérico: si no es AppError, responder con error interno
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };
  res.status(500).json(errorResponse);
});

// ========== MANEJADOR 404 ==========

// Capturar rutas no encontradas
app.use((req, res) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND'
  };
  res.status(404).json(errorResponse);
});

// ========== INICIAR SERVIDOR ==========

// Escuchar en puerto especificado (por defecto 3001)
app.listen(PORT, () => {
  console.log(`
🚀 BSV Certificate Server running
📍 Port: ${PORT}
🌐 Network: ${process.env.BSV_NETWORK || 'testnet'}
🔒 Encryption: Enabled
⏰ Started: ${new Date().toISOString()}
  `);
});