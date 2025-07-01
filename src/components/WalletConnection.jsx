import React from 'react';
import { Wallet, ChevronDown, Power, Copy, ExternalLink } from 'lucide-react';
import { formatAddress } from '../utils/helpers';
import { copyToClipboard } from '../utils/helpers';

const WalletConnection = ({ 
  account, 
  network, 
  balance, 
  isConnected, 
  isConnecting, 
  error,
  supportedNetworks,
  onConnect, 
  onSwitchNetwork,
  onDisconnect 
}) => {
  const getCurrencySymbol = (networkName) => {
    const currencyMap = {
      'Avalanche Fuji': 'AVAX',
      'Avalanche Mainnet': 'AVAX', 
      'Sepolia': 'ETH',
      'Ethereum': 'ETH',
      'Polygon Mainnet': 'MATIC',
      'Polygon Mumbai': 'MATIC'
    };
    return currencyMap[networkName] || 'ETH';
  };

  const getExplorerUrl = (networkName, address) => {
    const explorerMap = {
      'Avalanche Fuji': 'https://testnet.snowtrace.io',
      'Avalanche Mainnet': 'https://snowtrace.io',
      'Sepolia': 'https://sepolia.etherscan.io',
      'Ethereum': 'https://etherscan.io',
      'Polygon Mainnet': 'https://polygonscan.com',
      'Polygon Mumbai': 'https://mumbai.polygonscan.com'
    };
    const baseUrl = explorerMap[networkName] || 'https://etherscan.io';
    return `${baseUrl}/address/${address}`;
  };

  const handleCopyAddress = async () => {
    if (account) {
      const success = await copyToClipboard(account);
      if (success) {
        console.log('Address copied to clipboard');
      }
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <button
          onClick={onConnect}
          disabled={isConnecting}
          className="
            flex items-center space-x-2 px-6 py-3 
            bg-gradient-to-r from-primary-500 to-primary-600 
            hover:from-primary-600 hover:to-primary-700
            text-white rounded-lg font-medium
            transition-all duration-200 hover:scale-105
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl
          "
        >
          <Wallet size={20} />
          <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
        </button>
        
        {error && (
          <p className="text-red-400 text-sm bg-red-900/20 px-3 py-2 rounded-lg border border-red-800">
            {error}
          </p>
        )}
        
        <p className="text-gray-400 text-sm text-center max-w-md">
          Connect your MetaMask wallet to upload and deploy smart contracts
        </p>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-xl p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-500/20 rounded-lg">
            <Wallet size={20} className="text-primary-400" />
          </div>
          <div>
            <p className="font-medium text-white">Wallet Connected</p>
            <p className="text-sm text-gray-400">
              {network?.name || 'Unknown Network'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onDisconnect}
          className="
            p-2 hover:bg-red-500/20 rounded-lg 
            text-gray-400 hover:text-red-400 
            transition-colors duration-200
          "
          title="Disconnect Wallet"
        >
          <Power size={16} />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400">Address</span>
          <div className="flex items-center space-x-2">
            <span className="text-white font-mono text-sm">
              {formatAddress(account)}
            </span>
            <button
              onClick={handleCopyAddress}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Copy Address"
            >
              <Copy size={14} className="text-gray-400" />
            </button>
            <button
              onClick={() => window.open(getExplorerUrl(network?.name, account), '_blank')}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="View on Explorer"
            >
              <ExternalLink size={14} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400">Balance</span>
          <span className="text-white font-medium">
            {parseFloat(balance).toFixed(4)} {getCurrencySymbol(network?.name)}
          </span>
        </div>
        
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <span className="text-gray-400">Network</span>
          <div className="flex items-center space-x-2">
            <span className="text-white">
              {network?.name || 'Unknown'}
            </span>
            <div className="relative group">
              <button className="p-1 hover:bg-gray-700 rounded transition-colors">
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              
              <div className="
                absolute right-0 top-8 w-48 
                bg-gray-800 backdrop-blur-sm rounded-lg shadow-xl 
                border border-gray-700 py-2 z-10
                opacity-0 invisible group-hover:opacity-100 group-hover:visible
                transition-all duration-200
              ">
                {supportedNetworks.map((networkName) => (
                  <button
                    key={networkName}
                    onClick={() => onSwitchNetwork(networkName)}
                    className="
                      w-full text-left px-4 py-2 text-gray-300 
                      hover:bg-gray-700 transition-colors
                      capitalize
                    "
                  >
                    {networkName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
