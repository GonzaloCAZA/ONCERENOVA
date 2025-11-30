# Sistema de Certificados de Discapacidad BSV v3

Sistema para almacenar certificados de discapacidad en la blockchain de Bitcoin SV (mainnet) con cifrado AES-256-GCM.

## 🚀 Inicio Rápido (Windows)

### Backend

```batch
cd backend-v3
setup.bat          
npm run dev:win    
```

### Frontend

```batch
cd frontend-v3
setup.bat          
npm run dev        
```

## ⚠️ Configuración Importante

### 1. Clave Privada BSV (OBLIGATORIO)

Edita `backend-v3\.env` y agrega tu clave privada WIF de **mainnet**:

```env
BSV_PRIVATE_KEY=KwDiB... (tu clave privada WIF)
```

### 2. Generar Clave de Cifrado

Genera una clave maestra segura de 32 bytes:

```javascript
// En Node.js
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex'));
```

Agrégala a `.env`:
```env
ENCRYPTION_MASTER_KEY=tu_clave_hex_de_64_caracteres
```

### 3. Fondos en Mainnet

Asegúrate de tener BSV en tu dirección para pagar las transacciones (mínimo ~0.00001 BSV por certificado).

## 📋 Características v3

- ✅ **Mainnet BSV**: Transacciones reales en la red principal
- ✅ **Certificados de Discapacidad**: Datos específicos para personas con discapacidad
- ✅ **Sin fecha manual**: Se guarda automáticamente en metadatos
- ✅ **Teléfono en vez de email**: Mejor accesibilidad
- ✅ **Windows compatible**: Scripts .bat incluidos
- ✅ **ID de transacción prominente**: Se muestra claramente al crear

## 🔒 Seguridad

- Cifrado AES-256-GCM en servidor
- Claves derivadas únicas por certificado
- Datos sensibles nunca en texto plano en blockchain
- Sin exposición de claves en el frontend

## 📝 Campos del Certificado

- **Datos Personales**: Nombre, Apellidos, DNI/NIE, Teléfono
- **Discapacidad**: Tipo, Porcentaje (33-100%), Descripción
- **Ayudas**: Silla de ruedas, bastón, etc.
- **Necesidades Especiales**: Campo libre
- **Contacto de Emergencia**: Opcional

## 🛠️ API Endpoints

- `POST /api/certificates` - Crear certificado
- `POST /api/certificates/retrieve` - Recuperar por txid
- `GET /api/certificates` - Listar todos
- `GET /api/certificates/stats` - Estadísticas

## 💰 Costos Estimados

- ~500-1000 satoshis por certificado (< $0.001 USD)
- El costo depende del tamaño de los datos

## 🚨 Solución de Problemas

### "No funds available"
- Verifica que tienes BSV en tu dirección
- La dirección se muestra en la consola al iniciar

### "Private key not found"
- Asegúrate de configurar BSV_PRIVATE_KEY en .env

### Error de CORS
- Verifica que backend corre en puerto 3001
- Frontend debe estar en puerto 3000

## 📊 Monitoreo

Ver transacciones en WhatsOnChain:
- `https://whatsonchain.com/tx/{txid}`

## ⚡ Optimización para Hackathon

- Storage local simple (JSON)
- Sin autenticación (agregar en producción)
- Transacciones directas sin cola
- UI minimalista pero funcional

---
**Desarrollado para BSV Hackathon** | Mainnet Ready | Windows Compatible
