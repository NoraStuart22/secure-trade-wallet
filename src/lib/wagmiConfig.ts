import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'SecureTrade',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com
  chains: [mainnet, polygon, optimism, arbitrum],
  ssr: false,
});
