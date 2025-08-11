import { registerAs } from '@nestjs/config';

export default registerAs('solana', () => ({
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  commitmentLevel: process.env.SOLANA_COMMITMENT_LEVEL || 'confirmed',
}));
