import { ethers } from 'ethers';
import solidityCompiler from './solidityCompiler.js';

const NETWORKS = {
  sepolia: {
    chainId: '0xaa36a7',
    name: 'Sepolia',
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL,
    blockExplorer: 'https://sepolia.etherscan.io'
  },
  avalanche: {
    chainId: '0xa869',
    name: 'Avalanche Fuji',
    rpcUrl: import.meta.env.VITE_AVALANCHE_RPC_URL || 'https://api.avax-test.network/ext/bc/C/rpc',
    blockExplorer: 'https://testnet.snowtrace.io',
    nativeCurrency: {
      name: 'AVAX',
      symbol: 'AVAX',
      decimals: 18
    }
  },
  polygon: {
    chainId: '0x89',
    name: 'Polygon',
    rpcUrl: import.meta.env.VITE_POLYGON_RPC_URL,
    blockExplorer: 'https://polygonscan.com'
  }
};

class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.network = null;
  }

  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not found. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.account = await this.signer.getAddress();
      this.network = await this.provider.getNetwork();

      // Map network names properly
      const networkMapping = {
        11155111: 'Sepolia',
        43113: 'Avalanche Fuji',
        137: 'Polygon Mainnet',
        80001: 'Polygon Mumbai'
      };

      const networkName = networkMapping[Number(this.network.chainId)] || `Chain ${this.network.chainId}`;

      console.log('Wallet connected:', this.account);
      console.log('Network:', networkName, 'Chain ID:', this.network.chainId);

      return {
        account: this.account,
        network: { ...this.network, name: networkName }
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw new Error(`Failed to connect wallet: ${error.message}`);
    }
  }

  async switchNetwork(networkName) {
    if (!window.ethereum) {
      throw new Error('MetaMask not found');
    }

    const network = NETWORKS[networkName];
    if (!network) {
      throw new Error(`Network ${networkName} not supported`);
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: network.chainId }],
      });

      // Update provider and signer after network switch
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      this.network = await this.provider.getNetwork();

      return this.network;
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: network.chainId,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorer],
                nativeCurrency: network.nativeCurrency || {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                }
              },
            ],
          });
          
          return await this.switchNetwork(networkName);
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      }
      
      throw new Error(`Failed to switch network: ${error.message}`);
    }
  }

  async compileContract(sourceCode, contractName) {
    console.log('Compiling contract:', contractName);
    
    try {
      // If sourceCode is provided, compile it
      if (sourceCode && typeof sourceCode === 'string' && sourceCode.includes('contract ')) {
        console.log('Using real Solidity compilation...');
        return await solidityCompiler.compileContract(sourceCode, contractName);
      }
      
      // Fallback to pre-compiled SimpleStorage for demo/testing
      console.log('Using pre-compiled SimpleStorage contract...');
      return this.getPrecompiledContract();
      
    } catch (error) {
      console.error('Compilation failed, falling back to pre-compiled contract:', error);
      // If compilation fails, fall back to pre-compiled contract
      return this.getPrecompiledContract();
    }
  }

  getPrecompiledContract() {
    const simpleStorageBytecode = "0x608060405234801561001057600080fd5b5060405161012c38038061012c83398101604081905261002f91610037565b600055610050565b60006020828403121561004957600080fd5b5051919050565b60d68061005f6000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80633fa4f2451460375780635524107714604c575b600080fd5b60005460405190815260200160405180910390f35b605c6057366004605e565b600055565b005b600060208284031215606f57600080fd5b503591905056fea2646970667358221220d4c8d9d8b7b5b8a5c7b5c8a2f3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e563736f6c63430008130033";
    
    const simpleStorageAbi = [
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_initialValue",
            "type": "uint256"
          }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_value",
            "type": "uint256"
          }
        ],
        "name": "setValue",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "value",
        "outputs": [
          {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    return {
      bytecode: simpleStorageBytecode,
      abi: simpleStorageAbi,
      contractName: 'SimpleStorage',
      isCompiled: false
    };
  }

  async deployContract(contractData, constructorArgs = []) {
    if (!this.signer) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    const supportedChainIds = ['0xa869', '0xaa36a7', '0x89'];
    
    if (!supportedChainIds.includes(currentChainId)) {
      throw new Error(`Unsupported network. Please switch to Avalanche Fuji (recommended), Sepolia, or Polygon.`);
    }

    try {
      const { bytecode, abi, contractName } = contractData;
      
      console.log('Deploying contract:', contractName);
      console.log('Constructor args:', constructorArgs);
      console.log('Network Chain ID:', currentChainId);

      const cleanBytecode = bytecode.startsWith('0x') ? bytecode : '0x' + bytecode;
      
      const contractFactory = new ethers.ContractFactory(abi, cleanBytecode, this.signer);
      
      let estimatedGas;
      try {
        const hasConstructor = abi.find(item => item.type === 'constructor');
        const expectedArgCount = hasConstructor ? hasConstructor.inputs.length : 0;
        
        console.log(`Contract has constructor: ${!!hasConstructor}, expects ${expectedArgCount} args, received ${constructorArgs.length} args`);
        
        if (expectedArgCount === 0 && constructorArgs.length > 0) {
          console.log('Clearing constructor args for contract without constructor');
          constructorArgs = [];
        }
        
        if (constructorArgs.length !== expectedArgCount) {
          if (expectedArgCount === 0) {
            constructorArgs = [];
          } else {
            const constructor = abi.find(item => item.type === 'constructor');
            const paramNames = constructor.inputs.map(input => `${input.name} (${input.type})`).join(', ');
            throw new Error(`Constructor requires ${expectedArgCount} argument(s): ${paramNames}. You provided ${constructorArgs.length} argument(s).`);
          }
        }
        
        const deploymentData = contractFactory.interface.encodeDeploy(constructorArgs);
        estimatedGas = await this.provider.estimateGas({
          data: cleanBytecode + deploymentData.slice(2),
          from: this.account // Use the connected wallet address for gas estimation
        });
        console.log('Estimated gas:', estimatedGas.toString());
      } catch (error) {
        console.error('Gas estimation failed:', error);
        throw new Error('Contract deployment would fail. Check your constructor arguments and contract code.');
      }
      
      let deployOptions = {};
      
      if (currentChainId === '0xa869') {
        deployOptions = {
          gasLimit: Math.floor(Math.min(Number(estimatedGas) * 130 / 100, 2500000)), // Increased for complex contracts
          gasPrice: ethers.parseUnits('25', 'gwei')
        };
      } else if (currentChainId === '0xaa36a7') {
        deployOptions = {
          gasLimit: Math.floor(Math.min(Number(estimatedGas) * 130 / 100, 2000000)), // Increased for complex contracts
          gasPrice: ethers.parseUnits('20', 'gwei')
        };
      } else {
        deployOptions = {
          gasLimit: Math.floor(Math.min(Number(estimatedGas) * 130 / 100, 2200000)) // Increased for complex contracts
        };
      }

      console.log('Deploy options:', deployOptions);

      const contract = await contractFactory.deploy(...constructorArgs, deployOptions);
      
      console.log('Deployment transaction sent:', contract.deploymentTransaction().hash);
      console.log('Waiting for confirmation...');
      
      await contract.waitForDeployment();
      
      const contractAddress = await contract.getAddress();
      console.log('Contract deployed at:', contractAddress);

      return {
        contractAddress,
        transactionHash: contract.deploymentTransaction().hash,
        deployer: this.account,
        network: this.getNetworkName(currentChainId),
        chainId: this.network.chainId,
        gasUsed: deployOptions.gasLimit
      };
    } catch (error) {
      console.error('Contract deployment failed:', error);
      
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient funds for deployment. Please get more test tokens from the faucet.');
      } else if (error.message.includes('gas')) {
        throw new Error('Gas estimation failed. The contract may have issues or you may need more funds.');
      } else if (error.message.includes('revert')) {
        throw new Error('Contract deployment reverted. Check constructor arguments and contract code.');
      } else if (error.message.includes('nonce')) {
        throw new Error('Transaction nonce error. Try refreshing and reconnecting your wallet.');
      } else if (error.message.includes('intrinsic gas too low')) {
        throw new Error('Gas limit too low. Try deploying a simpler contract first.');
      } else if (error.message.includes('replacement fee too low')) {
        throw new Error('Transaction replacement failed. Please wait and try again.');
      }
      
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  async getBalance(address = null) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const targetAddress = address || this.account;
    if (!targetAddress) {
      throw new Error('No address provided and wallet not connected');
    }

    try {
      const balance = await this.provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async getTransactionReceipt(hash) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      return await this.provider.getTransactionReceipt(hash);
    } catch (error) {
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }

  getExplorerUrl(hash, type = 'tx') {
    const currentChainId = window.ethereum?.chainId;
    
    const explorerMapping = {
      '0xa869': 'https://testnet.snowtrace.io',
      '0xaa36a7': 'https://sepolia.etherscan.io',
      '0x89': 'https://polygonscan.com',
      '0x13881': 'https://mumbai.polygonscan.com'
    };
    
    const baseUrl = explorerMapping[currentChainId] || 'https://etherscan.io';
    return `${baseUrl}/${type}/${hash}`;
  }

  isConnected() {
    return !!this.account;
  }

  getAccount() {
    return this.account;
  }

  getNetwork() {
    return this.network;
  }

  getSupportedNetworks() {
    return Object.keys(NETWORKS);
  }

  getNetworkName(chainId) {
    const networkMapping = {
      '0xa869': 'Avalanche Fuji',
      '0xaa36a7': 'Sepolia',
      '0x89': 'Polygon Mainnet',
      '0x13881': 'Polygon Mumbai'
    };
    return networkMapping[chainId] || `Chain ${chainId}`;
  }
}

export default new BlockchainService();
