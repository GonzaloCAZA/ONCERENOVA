// Tipos para certificados de discapacidad

export interface CertificateData {
  // Datos personales
  firstName: string;
  lastName: string;
  documentId: string; // DNI/NIE
  phoneNumber: string;
  
  // Datos de discapacidad
  disabilityType: 'cognitiva' | 'fisica' | 'sensorial' | 'psiquica' | 'multiple';
  disabilityPercentage: number; // 33-100%
  disabilityDescription: string;
  
  // Datos adicionales opcionales
  mobilityAids?: string[]; // ej: ["silla de ruedas", "bastón"]
  specialNeeds?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  metadata?: Record<string, any>;
}

export interface EncryptedCertificate {
  encryptedData: string; // Base64
  iv: string; // Base64
  authTag: string; // Base64
}

export interface StoredCertificate {
  txid: string;
  encryptionKey: string;
  timestamp: number;
  // Preview sin datos sensibles
  preview: {
    disabilityType: string;
    percentage: number;
    createdAt: string;
  };
}

// Request/Response types
export interface SaveCertificateRequest {
  certificate: CertificateData;
}

export interface SaveCertificateResponse {
  success: boolean;
  txid: string;
  message: string;
}

export interface RetrieveCertificateRequest {
  txid: string;
  fields?: string[]; // Si no se especifica, devuelve todo
}

export interface RetrieveCertificateResponse {
  success: boolean;
  data: Partial<CertificateData>;
  retrievedAt: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}
