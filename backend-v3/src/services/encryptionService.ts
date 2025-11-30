import crypto from 'crypto';
import { EncryptedCertificate } from '../types/certificate.types';

class EncryptionService {
  // Algoritmo de cifrado: AES-256 en modo GCM (Galois/Counter Mode)
  // GCM proporciona autenticación junto con el cifrado
  private readonly algorithm = 'aes-256-gcm';
  
  // Clave maestra derivada de variable de entorno
  private readonly masterKey: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_MASTER_KEY;
    
    // Validar que la clave exista y tenga longitud correcta (64 caracteres hex = 32 bytes)
    if (!key || key.length !== 64) {
      // Generar una clave aleatoria para desarrollo si no existe
      console.warn('⚠️  No master key found, generating one for development');
      this.masterKey = crypto.randomBytes(32);
    } else {
      // Convertir la clave hexadecimal a Buffer
      this.masterKey = Buffer.from(key, 'hex');
    }
  }

  // Deriva una clave única para cada certificado usando PBKDF2
  // Esto permite que cada certificado tenga su propia clave derivada de la maestra
  private deriveKey(salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
      this.masterKey,  // Clave maestra
      salt,            // Salt aleatorio para cada derivación
      100000,          // Iteraciones (mayor = más seguro pero más lento)
      32,              // Longitud de clave derivada (256 bits)
      'sha256'         // Función hash
    );
  }

  // Cifra datos y retorna el certificado cifrado junto con la clave
  encrypt(data: any): { encrypted: EncryptedCertificate; key: string } {
    // Generar salt aleatorio para derivación de clave
    const salt = crypto.randomBytes(16);
    
    // Derivar clave única a partir del salt
    const key = this.deriveKey(salt);
    
    // Generar IV (Initialization Vector) aleatorio para cada cifrado
    const iv = crypto.randomBytes(16);
    
    // Crear el cifrador con AES-256-GCM
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    // Convertir datos a JSON y cifrar
    const jsonData = JSON.stringify(data);
    const encrypted = Buffer.concat([
      cipher.update(jsonData, 'utf8'),  // Cifrar datos
      cipher.final()                     // Finalizar cifrado
    ]);
    
    // Obtener etiqueta de autenticación (16 bytes) para verificar integridad
    const authTag = cipher.getAuthTag();
    
    // Combinar salt + clave derivada en hex para poder recuperarla luego
    const fullKey = Buffer.concat([salt, key]).toString('hex');
    
    return {
      encrypted: {
        encryptedData: encrypted.toString('base64'),  // Datos cifrados en base64
        iv: iv.toString('base64'),                    // IV en base64
        authTag: authTag.toString('base64')           // Etiqueta de autenticación en base64
      },
      key: fullKey  // Clave completa (salt + key derivada) para descifrado futuro
    };
  }

  // Descifra datos usando el certificado cifrado y la clave de descifrado
  decrypt(encrypted: EncryptedCertificate, keyHex: string): any {
    // Convertir clave hexadecimal de vuelta a Buffer
    const fullKey = Buffer.from(keyHex, 'hex');
    
    // Extraer salt (primeros 16 bytes)
    const salt = fullKey.slice(0, 16);
    
    // Extraer clave derivada (últimos 32 bytes)
    const key = fullKey.slice(16);
    
    // Crear el descifrador con AES-256-GCM
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      key,
      Buffer.from(encrypted.iv, 'base64')  // IV extraído del objeto cifrado
    );
    
    // Establecer etiqueta de autenticación para verificar integridad
    decipher.setAuthTag(Buffer.from(encrypted.authTag, 'base64'));
    
    // Descifrar datos
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encrypted.encryptedData, 'base64')),  // Descifrar datos
      decipher.final()                                                  // Finalizar descifrado
    ]);
    
    // Convertir buffer descifrado a string UTF-8 y parsear como JSON
    return JSON.parse(decrypted.toString('utf8'));
  }
}

export const encryptionService = new EncryptionService();