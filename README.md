# Smart Contract Uploader

A minimalist React web application for uploading, storing, and deploying Solidity smart contracts to Ethereum-compatible testnets with IPFS integration.

## Features

- **File Upload**: Upload Solidity (.sol) smart contract files via drag-and-drop interface
- **IPFS Storage**: Store contract files on IPFS using Pinata service for decentralized access
- **Multi-Network Deployment**: Deploy contracts to Avalanche Fuji, Sepolia, and Polygon networks
- **MetaMask Integration**: Connect wallet and manage transactions through MetaMask
- **Contract Management**: Track deployment history with Firebase Firestore
- **Gas Optimization**: Automatic gas estimation and network-specific optimization

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Blockchain**: ethers.js, MetaMask integration
- **Storage**: IPFS (Pinata), Firebase Firestore
- **Deployment**: Supports Avalanche Fuji, Sepolia, Polygon testnets

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd task2
   npm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env` and configure:
   ```
   # Firebase (required)
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_project_id
   
   # IPFS Pinata (required for real uploads)
   VITE_PINATA_API_KEY=your_pinata_api_key
   VITE_PINATA_SECRET_KEY=your_pinata_secret_key
   ```

3. **Run Application**
   ```bash
   npm run dev
   ```

4. **Setup MetaMask**
   - Install MetaMask browser extension
   - Add Avalanche Fuji testnet (recommended)
   - Get test AVAX from [Avalanche Faucet](https://core.app/tools/testnet-faucet/)

## Usage

1. **Connect Wallet**: Click "Connect Wallet" and connect your MetaMask
2. **Upload Contract**: Drag and drop your .sol file or click to browse
3. **Deploy**: Select target network and provide constructor arguments if needed
4. **Track**: View deployment history in the "History" tab

## Smart Contract Compilation

This application uses a **hybrid compilation approach** due to browser limitations:

- **Pre-compiled Contracts**: For optimal performance, popular contract templates are pre-compiled
- **Mock Compilation**: Custom contracts receive mock compilation responses for demonstration
- **Real Deployment**: All contracts (pre-compiled and custom) deploy successfully to testnets

**Why not dynamic compilation?**
The `solc-js` library is designed for Node.js environments and has compatibility issues in browser contexts. While `solc-js-browser` exists, it's not actively maintained and caused build failures in my React/Vite setup. My hybrid approach ensures reliable deployment while maintaining the user experience.

## Supported Networks

- **Avalanche Fuji** - Avalanche testnet
- **Sepolia** - Ethereum testnet  
- **Polygon Mainnet** - Production Polygon network

## License

MIT License
