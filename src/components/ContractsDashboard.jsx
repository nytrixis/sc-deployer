import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Filter, 
  Download,
  Copy,
  Calendar,
  Network
} from 'lucide-react';
import { 
  formatAddress, 
  formatDate, 
  getStatusColor, 
  copyToClipboard,
  getFileType 
} from '../utils/helpers';

const ContractsDashboard = ({ contracts, isLoading, onRefresh }) => {
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [networkFilter, setNetworkFilter] = useState('all');

  useEffect(() => {
    let filtered = contracts || [];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }
    
    if (networkFilter !== 'all') {
      filtered = filtered.filter(contract => contract.network === networkFilter);
    }
    
    setFilteredContracts(filtered);
  }, [contracts, statusFilter, networkFilter]);

  const getExplorerUrl = (network, type, hash) => {
    const explorers = {
      'Avalanche Fuji': 'https://testnet.snowtrace.io',
      'avalanche': 'https://testnet.snowtrace.io',
      'Sepolia': 'https://sepolia.etherscan.io',
      'sepolia': 'https://sepolia.etherscan.io',
      'Polygon Mainnet': 'https://polygonscan.com',
      'polygon': 'https://polygonscan.com'
    };
    
    const baseUrl = explorers[network] || 'https://testnet.snowtrace.io';
    return `${baseUrl}/${type}/${hash}`;
  };

  const getNetworkName = (contract) => {
    if (contract.network && contract.network !== 'unknown') {
      return contract.network;
    }
    
    if (contract.chainId) {
      const chainIdMapping = {
        43113: 'Avalanche Fuji',
        11155111: 'Sepolia', 
        137: 'Polygon Mainnet',
        80001: 'Polygon Mumbai'
      };
      return chainIdMapping[Number(contract.chainId)] || 'Unknown Network';
    }
    
    return 'Unknown Network';
  };

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      console.log('Copied to clipboard');
    }
  };

  const getUniqueNetworks = () => {
    const networks = contracts?.map(contract => contract.network).filter(Boolean) || [];
    return [...new Set(networks)];
  };

  if (isLoading) {
    return (
      <div className="glass-effect rounded-xl p-8 border border-white/20">
        <div className="flex items-center justify-center space-x-2 text-white/70">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
          <span>Loading contracts...</span>
        </div>
      </div>
    );
  }

  if (!contracts || contracts.length === 0) {
    return (
      <div className="glass-effect rounded-xl p-8 border border-white/20 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-white/10 rounded-full">
            <FileText size={32} className="text-white/50" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No Contracts Found
            </h3>
            <p className="text-white/70">
              Start by uploading your first smart contract file
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-effect rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <FileText size={24} />
            <span>Contract History</span>
          </h2>
          <button
            onClick={onRefresh}
            className="
              px-4 py-2 bg-white/10 hover:bg-white/20 
              text-white rounded-lg font-medium
              transition-all duration-200
              border border-white/20
            "
          >
            Refresh
          </button>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="
                px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                text-white text-sm focus:outline-none 
                focus:ring-2 focus:ring-primary-500
              "
            >
              <option value="all" className="bg-gray-800">All Status</option>
              <option value="uploaded" className="bg-gray-800">Uploaded</option>
              <option value="deployed" className="bg-gray-800">Deployed</option>
              <option value="failed" className="bg-gray-800">Failed</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Network size={16} className="text-gray-400" />
            <select
              value={networkFilter}
              onChange={(e) => setNetworkFilter(e.target.value)}
              className="
                px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg
                text-white text-sm focus:outline-none 
                focus:ring-2 focus:ring-primary-500
              "
            >
              <option value="all" className="bg-gray-800">All Networks</option>
              {getUniqueNetworks().map(network => (
                <option key={network} value={network} className="bg-gray-800">
                  {network}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="grid gap-4">
        {filteredContracts.map((contract) => (
          <div 
            key={contract.id} 
            className="glass-effect rounded-xl p-6 border border-gray-700"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gray-700/50 rounded-lg">
                  <FileText size={24} className="text-gray-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {contract.fileName}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {getFileType(contract.fileName)} • Uploaded {formatDate(contract.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`
                  px-3 py-1 rounded-full text-xs font-medium
                  ${getStatusColor(contract.status)}
                `}>
                  {contract.status?.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <span className="text-white/70 text-sm">IPFS Hash</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-mono text-xs">
                      {formatAddress(contract.cid, 8)}
                    </span>
                    <button
                      onClick={() => handleCopy(contract.cid)}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <Copy size={12} className="text-white/70" />
                    </button>
                    <button
                      onClick={() => window.open(`https://ipfs.io/ipfs/${contract.cid}`, '_blank')}
                      className="p-1 hover:bg-white/20 rounded"
                    >
                      <ExternalLink size={12} className="text-white/70" />
                    </button>
                  </div>
                </div>
                
                {contract.contractAddress && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70 text-sm">Contract Address</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono text-xs">
                        {formatAddress(contract.contractAddress, 8)}
                      </span>
                      <button
                        onClick={() => handleCopy(contract.contractAddress)}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <Copy size={12} className="text-white/70" />
                      </button>
                      <button
                        onClick={() => window.open(
                          getExplorerUrl(getNetworkName(contract), 'address', contract.contractAddress), 
                          '_blank'
                        )}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <ExternalLink size={12} className="text-white/70" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {contract.network && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70 text-sm">Network</span>
                    <span className="text-white text-sm">{getNetworkName(contract)}</span>
                  </div>
                )}
                
                {contract.deployer && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70 text-sm">Deployer</span>
                    <span className="text-white font-mono text-xs">
                      {formatAddress(contract.deployer)}
                    </span>
                  </div>
                )}
                
                {contract.transactionHash && (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/70 text-sm">Tx Hash</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-mono text-xs">
                        {formatAddress(contract.transactionHash, 8)}
                      </span>
                      <button
                        onClick={() => window.open(
                          getExplorerUrl(getNetworkName(contract), 'tx', contract.transactionHash), 
                          '_blank'
                        )}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <ExternalLink size={12} className="text-white/70" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center space-x-4 text-sm text-white/60">
                <div className="flex items-center space-x-1">
                  <Calendar size={14} />
                  <span>{formatDate(contract.createdAt)}</span>
                </div>
                {contract.fileSize && (
                  <span>{(contract.fileSize / 1024).toFixed(1)} KB</span>
                )}
              </div>
              
              <button
                onClick={() => window.open(`https://ipfs.io/ipfs/${contract.cid}`, '_blank')}
                className="
                  flex items-center space-x-1 px-3 py-1 
                  bg-white/10 hover:bg-white/20 
                  text-white rounded-lg text-sm
                  transition-all duration-200
                "
              >
                <Download size={14} />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractsDashboard;
