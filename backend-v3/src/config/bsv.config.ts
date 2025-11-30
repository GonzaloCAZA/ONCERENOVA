import { PrivateKey } from '@bsv/sdk';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.BSV_PRIVATE_KEY) {
  console.error('❌ BSV_PRIVATE_KEY not found in .env file');
  console.log('Please add your private key WIF to .env file');
  process.exit(1);
}

export const bsvConfig = {
  network: 'mainnet', // Siempre mainnet 
  privateKey: PrivateKey.fromWif(process.env.BSV_PRIVATE_KEY)
};
