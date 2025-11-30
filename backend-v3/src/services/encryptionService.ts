import crypto from 'crypto';
import { EncryptedCertificate } from '../types/certificate.types';

class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly masterKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_MASTER_KEY;
    if (!key || key.length !== 64) {
      // Generar una clave para desarrollo si no existe
      console.warn('⚠️  No master key found, generating one for development');
      this.masterKey = crypto.randomBytes(32);
    } else {
      this.masterKey = Buffer.from(key, 'hex');
    }
  }

  // Deriva una clave única para cada certificado
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha256');
  }

  encrypt(data: any): { encrypted: EncryptedCertificate; key: string } {
    const salt = crypto.randomBytes(16);
    const key = this.deriveKey(salt);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    const jsonData = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(jsonData, 'utf8'),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Combinamos salt + key derivada para poder recuperarla
    const fullKey = Buffer.concat([salt, key]).toString('hex');
    
    return {
      encrypted: {
        encryptedData: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        authTag: authTag.toString('base64')
      },
      key: fullKey
    };
  }

  decrypt(encrypted: EncryptedCertificate, keyHex: string): any {
    const fullKey = Buffer.from(keyHex, 'hex');
    const salt = fullKey.slice(0, 16);
    const key = fullKey.slice(16);
    
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(encrypted.iv, 'base64')
    );
    
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));
    
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.encryptedData, 'base64')),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString('utf8'));
  }
}

export const encryptionService = new EncryptionService();
