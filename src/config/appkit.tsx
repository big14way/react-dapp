import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { polygon, polygonMumbai, mainnet, sepolia } from '@reown/appkit/networks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import React from 'react'

// 1. Get projectId from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '1eebe528ca0ce94a99ceaa2e915058d7'

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not set')
}

// 2. Set up Wagmi adapter
const networks = [polygonMumbai, polygon, mainnet, sepolia]

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

// 3. Create modal
const metadata = {
  name: 'React DApp',
  description: 'Ethereum DApp with WalletConnect Integration',
  url: typeof window !== 'undefined' ? window.location.origin : '',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  metadata,
  projectId,
  features: {
    analytics: true,
    email: false,
    socials: []
  }
})

// 4. Create query client
const queryClient = new QueryClient()

export function AppKitProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export { wagmiAdapter }
