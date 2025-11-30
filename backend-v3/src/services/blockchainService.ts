import {
  Transaction,
  Script,
  PrivateKey,
  P2PKH,
  PublicKey
} from '@bsv/sdk';
import axios from 'axios';
import { bsvConfig } from '../config/bsv.config';
import { EncryptedCertificate } from '../types/certificate.types';
// Arriba del archivo, fuera de la clase
function isValidEncryptedCertificate(e: any): e is EncryptedCertificate {
  return !!e
    && typeof e.encryptedData === 'string'
    && typeof e.iv === 'string'
    && typeof e.authTag === 'string';
}

class BlockchainService {
  private privateKey: PrivateKey;
  private address: string;

  constructor() {
    this.privateKey = bsvConfig.privateKey;
    this.address = this.privateKey.toAddress('mainnet').toString();
    console.log('📍 BSV Address:', this.address);
  }

  // Dentro de BlockchainService
  async storeCertificate(encrypted: EncryptedCertificate): Promise<string> {
    try {
      // 1) Validar que nos han pasado bien el certificado cifrado
      if (!isValidEncryptedCertificate(encrypted)) {
        console.error('❌ Encrypted recibido NO válido:', encrypted);
        throw new Error('Encrypted certificate is invalid. Check EncryptionService.encrypt() and la llamada.');
      }

      // 2) Preparar datos para OP_RETURN
      const data = JSON.stringify(encrypted);          // aquí ya nunca será undefined
      const dataBuffer = Buffer.from(data, 'utf8');    // dataBuffer.length OK

      console.log('📊 Data size:', dataBuffer.length, 'bytes');

      const prefix = Buffer.from('disabd', 'utf8');
      const payload = Buffer.concat([prefix, dataBuffer]);

      // OP_RETURN <payload> (salida de solo datos)
      const opReturnScript = new Script()
        .writeOpCode('OP_RETURN')
        .writeBin(payload);

      // 3) Obtener UTXOs de nuestra dirección
      const utxos = await this.getUTXOs();
      console.log('🔍 UTXOs:', utxos);

      if (!Array.isArray(utxos) || utxos.length === 0) {
        throw new Error(`No funds available in address: ${this.address}`);
      }

      // UTXO con más sats
      const selectedUtxo = utxos.reduce((max, u) =>
        u.satoshis > max.satoshis ? u : max,
        utxos[0]
      );

      console.log('💰 Using UTXO:', selectedUtxo.txid, 'with', selectedUtxo.satoshis, 'sats');

      // 4) Traer la transacción fuente en HEX
      const { data: rawTxHex } = await axios.get(
        `https://api.whatsonchain.com/v1/bsv/main/tx/${selectedUtxo.txid}/hex`
      );
      const sourceTransaction = Transaction.fromHex(rawTxHex);

      const p2pkh = new P2PKH();
      const changeAddress = this.privateKey.toAddress('mainnet');

      // 5) Construir transacción
      const tx = new Transaction();

      // INPUT: patrón compatible con @bsv/sdk 1.0.36
      tx.addInput({
        sourceTransaction,
        sourceOutputIndex: selectedUtxo.vout,
        unlockingScriptTemplate: p2pkh.unlock(this.privateKey),
        sequence: 0xffffffff
      });

      // OUTPUT 0: cambio (P2PKH normal, el SDK ajusta amount con fee())
      tx.addOutput({
        change: true,
        lockingScript: p2pkh.lock(changeAddress)
      });

      // OUTPUT 1: OP_RETURN con datos cifrados (0 sats)
      tx.addOutput({
        lockingScript: opReturnScript,
        satoshis: 1
      });

      // 6) Calcular fee y firmar
      await tx.fee();          // el SDK calcula tamaño y ajusta el cambio
      await tx.sign();         // construye unlockingScript a partir del template

      console.log('RAW TX:', tx.toHex());

      // 7) Broadcast
      const txid = await this.broadcastTransaction(tx);
      console.log('✅ Transaction broadcast:', txid);

      return txid;
    } catch (error: any) {
      console.error('❌ Blockchain error en storeCertificate:', error);
      throw new Error(`Failed to store certificate: ${error.message}`);
    }
  }


  async retrieveCertificate(txid: string): Promise<EncryptedCertificate> {
  try {
    const response = await axios.get(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}`
    );
    const txData = response.data;

    if (!txData.vout || !Array.isArray(txData.vout)) {
      throw new Error('Invalid transaction format');
    }

    // 1) Cogemos el vout con menos valor (1 sat) → nuestro certificado
    const certOut = txData.vout.reduce((min: any, v: any) =>
      v.value < min.value ? v : min,
      txData.vout[0]
    );

    const scriptHex: string = certOut.scriptPubKey.hex.toLowerCase();
    // script = [PUSHDATA opcode][len][payload]

    let cursor = 0;
    const opcode = parseInt(scriptHex.slice(cursor, cursor + 2), 16);
    cursor += 2;

    let dataLen: number;
    if (opcode >= 1 && opcode <= 75) {
      dataLen = opcode;
    } else if (opcode === 0x4c) {
      dataLen = parseInt(scriptHex.slice(cursor, cursor + 2), 16);
      cursor += 2;
    } else if (opcode === 0x4d) {
      const le = scriptHex.slice(cursor, cursor + 4);
      dataLen = parseInt(le.slice(2, 4) + le.slice(0, 2), 16); // LE → BE
      cursor += 4;
    } else if (opcode === 0x4e) {
      const le = scriptHex.slice(cursor, cursor + 8);
      dataLen = parseInt(
        le.slice(6, 8) + le.slice(4, 6) + le.slice(2, 4) + le.slice(0, 2),
        16
      );
      cursor += 8;
    } else {
      throw new Error('Unsupported script format for certificate output');
    }

    const payloadHex = scriptHex.slice(cursor, cursor + dataLen * 2);
    const payloadBuf = Buffer.from(payloadHex, 'hex');
    const fullStr = payloadBuf.toString('utf8');

    const prefix = 'disabd';
    const idx = fullStr.indexOf(prefix);
    if (idx === -1) {
      throw new Error('Certificate prefix not found or corrupted');
    }

    const jsonStr = fullStr.substring(idx + prefix.length);
    const obj = JSON.parse(jsonStr);

    const cert = (obj.encrypted) ? obj.encrypted : obj;

    console.log(cert);
    if (!isValidEncryptedCertificate(cert)) {
      throw new Error('Decrypted data does not match EncryptedCertificate shape');
    }

    return cert;
  } catch (error: any) {
    console.error('❌ Retrieval error:', error);
    throw new Error(`Failed to retrieve certificate: ${error.message}`);
  }
}



  private async getUTXOs(): Promise<any[]> {
    try {
      const response = await axios.get(
        `https://api.whatsonchain.com/v1/bsv/main/address/${this.address}/unspent`
      );

      return response.data.map((utxo: any) => ({
        txid: utxo.tx_hash,
        vout: utxo.tx_pos,
        satoshis: utxo.value,
        scriptPubKey: utxo.script
      }));
    } catch (error) {
      console.error('UTXO fetch error:', error);
      return [];
    }
  }

  private async broadcastTransaction(tx: Transaction): Promise<string> {
    try {
      const txHex = tx.toHex();
      console.log('📤 Broadcasting transaction...');

      const response = await axios.post(
        'https://api.whatsonchain.com/v1/bsv/main/tx/raw',
        { txhex: txHex },
        { headers: { 'Content-Type': 'application/json' } }
      );

      return response.data.trim().replace(/"/g, '');
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Broadcast failed: ${error.response.data}`);
      }
      throw error;
    }
  }
}

export const blockchainService = new BlockchainService();
