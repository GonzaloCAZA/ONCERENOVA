import { Router } from 'express';
import Joi from 'joi';
import {DisabilityPdfGenerator } from "../utils/DisabilityPdfGenerator";
import { 
  SaveCertificateRequest, 
  RetrieveCertificateRequest,
  SaveCertificateResponse,
  RetrieveCertificateResponse,
  CertificateData 
} from '../types/certificate.types';
import { blockchainService } from '../services/blockchainService';
import { encryptionService } from '../services/encryptionService';
import { storageService } from '../services/storageService';
import { createError, errorCodes } from '../utils/errors';

const router = Router();

// Esquemas de validación actualizados
const certificateSchema = Joi.object<CertificateData>({
  firstName: Joi.string().required().min(1).max(100),
  lastName: Joi.string().required().min(1).max(100),
  documentId: Joi.string().required().min(7).max(15),
  phoneNumber: Joi.string().required().pattern(/^\+?[\d\s-()]+$/).min(9).max(20),
  
  disabilityType: Joi.string().valid('cognitiva', 'fisica', 'sensorial', 'psiquica', 'multiple').required(),
  disabilityPercentage: Joi.number().min(33).max(100).required(),
  disabilityDescription: Joi.string().required().max(1000),
  
  mobilityAids: Joi.array().items(Joi.string()).optional(),
  specialNeeds: Joi.string().optional().max(500),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    relationship: Joi.string().required()
  }).optional(),
  metadata: Joi.object().optional()
});

const retrieveSchema = Joi.object<RetrieveCertificateRequest>({
  txid: Joi.string().hex().length(64).required(),
  fields: Joi.array().items(Joi.string()).optional()
});

// POST /certificates - Crear certificado de discapacidad
router.post('/', async (req, res, next) => {
  try {
    const { certificate }: SaveCertificateRequest = req.body;
    
    // Validar datos
    const { error } = certificateSchema.validate(certificate);
    if (error) {
      throw createError(error.details[0].message, 400, errorCodes.VALIDATION_ERROR);
    }

    // Añadir timestamp a los datos
    const certificateWithTimestamp = {
      ...certificate,
      metadata: {
        ...certificate.metadata,
        issuedAt: new Date().toISOString(),
        issuer: 'Sistema de Certificados de Discapacidad BSV'
      }
    };

    // Cifrar certificado
    console.log('🔒 Cifrando datos del certificado...');
    const { encrypted, key } = encryptionService.encrypt(certificateWithTimestamp);

    // Guardar en blockchain
    console.log('⛓️  Guardando en blockchain BSV (mainnet)...');
    const txid = await blockchainService.storeCertificate(encrypted);

    // Guardar metadata localmente
    await storageService.save({
      txid,
      encryptionKey: key,
      timestamp: Date.now(),
      preview: {
        disabilityType: certificate.disabilityType,
        percentage: certificate.disabilityPercentage,
        createdAt: new Date().toISOString()
      }
    });

    console.log('✅ Certificado guardado exitosamente');

    const response: SaveCertificateResponse = {
      success: true,
      txid,
      message: 'Certificado de discapacidad almacenado en blockchain BSV'
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

// POST /certificates/retrieve - Recuperar certificado
router.post('/retrieve', async (req, res, next) => {
  try {
    const { error } = retrieveSchema.validate(req.body);
    if (error) {
      throw createError(error.details[0].message, 400, errorCodes.VALIDATION_ERROR);
    }

    const { txid, fields }: RetrieveCertificateRequest = req.body;

    // Buscar en storage local
    const stored = await storageService.get(txid);
    if (!stored) {
      throw createError('Certificado no encontrado', 404, errorCodes.NOT_FOUND);
    }

    // Recuperar de blockchain
    console.log('⛓️  Recuperando de blockchain...');
    const encrypted = await blockchainService.retrieveCertificate(txid);

    // Desencriptar
    console.log('🔓 Descifrando certificado...');
    const certificate: CertificateData = encryptionService.decrypt(
      encrypted,
      stored.encryptionKey
    );

    // Filtrar campos si se especificaron
    let data: Partial<CertificateData> = certificate;
    if (fields && fields.length > 0) {
      data = {};
      fields.forEach(field => {
        if (field in certificate) {
          (data as any)[field] = (certificate as any)[field];
        }
      });
    }

    const response: RetrieveCertificateResponse = {
      success: true,
      data,
      retrievedAt: new Date().toISOString()
    };

    console.log("EN certificados.ts");
    console.log(data);
    /**const generator = new DiscapacidadDocumentGenerator();
    generator.generateDocument(data, "Certificado.pdf");

const generator = new DiscapacidadDocumentGenerator();
    generator.toBuffer(data).then(buffer => {
  require("fs").writeFileSync("certificado.docx", buffer);
});
 */

  await DisabilityPdfGenerator.generatePdf(data, "./certificado.pdf");
  console.log("PDF generado correctamente");
    res.json(response);


  } catch (error) {
    next(error);
  }
});

// GET /certificates - Listar certificados guardados
router.get('/', async (req, res, next) => {
  try {
    const certificates = await storageService.getAll();
    res.json({
      success: true,
      count: certificates.length,
      certificates: certificates.map(cert => ({
        txid: cert.txid,
        timestamp: cert.timestamp,
        preview: cert.preview
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET /certificates/stats - Estadísticas (útil para dashboard)
router.get('/stats', async (req, res, next) => {
  try {
    const certificates = await storageService.getAll();
    
    const stats = {
      total: certificates.length,
      byType: {} as Record<string, number>,
      averagePercentage: 0
    };

    certificates.forEach(cert => {
      const type = cert.preview.disabilityType;
      stats.byType[type] = (stats.byType[type] || 0) + 1;
      stats.averagePercentage += cert.preview.percentage;
    });

    if (certificates.length > 0) {
      stats.averagePercentage = Math.round(stats.averagePercentage / certificates.length);
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
});

export default router;
