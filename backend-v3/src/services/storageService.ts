import { StoredCertificate } from '../types/certificate.types';
import fs from 'fs/promises';
import path from 'path';

class StorageService {
  // Ruta del archivo JSON donde se almacenan los certificados
  private readonly dbPath: string;
  
  // Cache en memoria para acceso rápido a certificados (evita leer archivo constantemente)
  private cache: Map<string, StoredCertificate> = new Map();

  constructor() {
    // Construir ruta: proyecto/data/certificates.json
    this.dbPath = path.join(process.cwd(), 'data', 'certificates.json');
    this.initializeStorage();
  }

  // Inicializar almacenamiento: crear directorio y cargar datos existentes
  private async initializeStorage() {
    try {
      // Crear directorio /data si no existe
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      
      // Intentar cargar certificados previos del archivo
      try {
        const data = await fs.readFile(this.dbPath, 'utf-8');
        const certificates = JSON.parse(data) as StoredCertificate[];
        // Llenar cache con certificados existentes (clave: txid)
        certificates.forEach(cert => this.cache.set(cert.txid, cert));
      } catch {
        // Si no existe el archivo, empezar vacío y crear archivo nuevo
        await this.persist();
      }
    } catch (error) {
      console.error('Storage initialization error:', error);
    }
  }

  // Guardar un certificado: actualizar cache y persistir a disco
  async save(certificate: StoredCertificate): Promise<void> {
    // Agregar/actualizar certificado en cache (clave: txid)
    this.cache.set(certificate.txid, certificate);
    // Escribir cambios a archivo JSON
    await this.persist();
  }

  // Obtener un certificado por txid (transacción ID)
  async get(txid: string): Promise<StoredCertificate | null> {
    return this.cache.get(txid) || null;
  }

  // Obtener todos los certificados almacenados
  async getAll(): Promise<StoredCertificate[]> {
    return Array.from(this.cache.values());
  }

  // Escribir cache en memoria a archivo JSON en disco
  private async persist(): Promise<void> {
    // Convertir Map a Array y guardar con formato indentado (null, 2 espacios)
    const data = Array.from(this.cache.values());
    await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2));
  }

  // Método útil para desarrollo: limpiar toda la BD y archivo
  async clear(): Promise<void> {
    // Vaciar cache en memoria
    this.cache.clear();
    // Escribir archivo vacío a disco
    await this.persist();
  }
}

export const storageService = new StorageService();