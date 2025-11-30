import { StoredCertificate } from '../types/certificate.types';
import fs from 'fs/promises';
import path from 'path';

class StorageService {
  private readonly dbPath: string;
  private cache: Map<string, StoredCertificate> = new Map();

  constructor() {
    this.dbPath = path.join(process.cwd(), 'data', 'certificates.json');
    this.initializeStorage();
  }

  private async initializeStorage() {
    try {
      // Crear directorio si no existe
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      
      // Cargar datos existentes
      try {
        const data = await fs.readFile(this.dbPath, 'utf-8');
        const certificates = JSON.parse(data) as StoredCertificate[];
        certificates.forEach(cert => this.cache.set(cert.txid, cert));
      } catch {
        // Si no existe el archivo, empezar vacío
        await this.persist();
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  async save(certificate: StoredCertificate): Promise<void> {
    this.cache.set(certificate.txid, certificate);
    await this.persist();
  }

  async get(txid: string): Promise<StoredCertificate | null> {
    return this.cache.get(txid) || null;
  }

  async getAll(): Promise<StoredCertificate[]> {
    return Array.from(this.cache.values());
  }

  private async persist(): Promise<void> {
    const data = Array.from(this.cache.values());
    await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
  }

  // Método útil para desarrollo
  async clear(): Promise<void> {
    this.cache.clear();
    await this.persist();
  }
}

export const storageService = new StorageService();
