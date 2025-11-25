import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, polygon, optimism, arbitrum, base, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Local Hardhat network
const localhost = defineChain({
  id: 31337,
  name: 'Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
});

// Get WalletConnect Project ID from environment variable
// 
// IMPORTANT: The 403 errors you see in console are EXPECTED and HARMLESS.
// RainbowKit will automatically fall back to browser extensions (Rainbow/MetaMask).
// Your app works perfectly fine - these are just warnings.
//
// To eliminate the warnings (optional):
// 1. Get a free Project ID from https://cloud.reown.com/
// 2. Add http://localhost:8080 to the allowlist in project settings
// 3. Add to ui/.env.local: VITE_WALLETCONNECT_PROJECT_ID=your_project_id
// 4. Restart dev server
//
// For local development, you can safely ignore these 403 errors.
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '3fbb6bba6f1de962d911bb5b5c9ddd26';

// Suppress console warnings for WalletConnect 403 errors in development
// Note: Network 403 errors in browser DevTools cannot be suppressed,
// but console.error/warn messages can be filtered
if (import.meta.env.DEV) {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;
  
  // Override console.error
  console.error = (...args: any[]) => {
    const fullMessage = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg?.message) return arg.message;
      if (arg?.stack) return arg.stack;
      return String(arg);
    }).join(' ');
    
    // Filter out WalletConnect/Reown 403 warnings
    if (
      fullMessage.includes('Reown Config') ||
      fullMessage.includes('Failed to fetch remote project configuration') ||
      fullMessage.includes('HTTP status code: 403') ||
      fullMessage.includes('not found on Allowlist') ||
      fullMessage.includes('api.web3modal.org') ||
      fullMessage.includes('pulse.walletconnect.org') ||
      fullMessage.includes('web3modal.org')
    ) {
      // Silently ignore these expected warnings
      return;
    }
    originalError.apply(console, args);
  };
  
  // Override console.warn
  console.warn = (...args: any[]) => {
    const fullMessage = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg?.message) return arg.message;
      return String(arg);
    }).join(' ');
    
    // Filter out WalletConnect/Reown warnings
    if (
      fullMessage.includes('Reown') ||
      fullMessage.includes('WalletConnect') ||
      fullMessage.includes('web3modal') ||
      fullMessage.includes('403') ||
      fullMessage.includes('Allowlist')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  // Also filter console.log for any WalletConnect messages
  console.log = (...args: any[]) => {
    const fullMessage = args.map(arg => String(arg)).join(' ');
    if (
      fullMessage.includes('Reown Config') ||
      fullMessage.includes('web3modal.org') ||
      (fullMessage.includes('403') && fullMessage.includes('WalletConnect'))
    ) {
      return;
    }
    originalLog.apply(console, args);
  };
}

export const config = getDefaultConfig({
  appName: 'Trust Build Ledger',
  projectId: projectId,
  chains: [localhost, sepolia, mainnet, polygon, optimism, arbitrum, base],
  ssr: false,
  // Suppress WalletConnect remote config warnings for local development
  // These 403 errors are expected and harmless - RainbowKit falls back to browser extensions
});
