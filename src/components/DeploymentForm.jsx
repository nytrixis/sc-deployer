import React, { useState } from 'react';
import { Rocket, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { formatAddress } from '../utils/helpers';

const DeploymentForm = ({ 
  contract, 
  isDeploying, 
  onDeploy, 
  deploymentResult,
  error 
}) => {
  const [constructorArgs, setConstructorArgs] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('avalanche');

  const getExplorerUrl = (network, type, hash) => {
    const explorers = {
      'avalanche': 'https://testnet.snowtrace.io',
      'Avalanche Fuji': 'https://testnet.snowtrace.io',
      'sepolia': 'https://sepolia.etherscan.io',
      'Sepolia': 'https://sepolia.etherscan.io',
      'polygon': 'https://polygonscan.com',
      'Polygon Mainnet': 'https://polygonscan.com'
    };
    
    const baseUrl = explorers[network] || explorers['avalanche'];
    const endpoint = type === 'address' ? 'address' : 'tx';
    return `${baseUrl}/${endpoint}/${hash}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let args = [];
    if (constructorArgs.trim()) {
      try {
        args = constructorArgs.split(',').map(arg => {
          const trimmedArg = arg.trim();
          if (!isNaN(trimmedArg) && trimmedArg !== '') {
            return trimmedArg;
          }
          return trimmedArg;
        });
      } catch {
        console.error('Invalid constructor arguments format');
        return;
      }
    }
    
    onDeploy(contract, args, selectedNetwork);
  };

  if (deploymentResult) {
    return (
      <div className="glass-effect rounded-xl p-6 border border-white/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <CheckCircle size={24} className="text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Contract Deployed Successfully!
            </h3>
            <p className="text-gray-400">
              Your contract is now live on {deploymentResult.network}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Contract Address</span>
              <div className="flex items-center space-x-2">
                <span className="text-white font-mono text-sm">
                  {formatAddress(deploymentResult.contractAddress, 8)}
                </span>
                <button
                  onClick={() => window.open(
                    getExplorerUrl(deploymentResult.network || selectedNetwork, 'address', deploymentResult.contractAddress), 
                    '_blank'
                  )}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <ExternalLink size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Transaction Hash</span>
              <div className="flex items-center space-x-2">
                <span className="text-white font-mono text-sm">
                  {formatAddress(deploymentResult.transactionHash, 8)}
                </span>
                <button
                  onClick={() => window.open(
                    getExplorerUrl(deploymentResult.network || selectedNetwork, 'tx', deploymentResult.transactionHash), 
                    '_blank'
                  )}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <ExternalLink size={14} className="text-gray-400" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Network</span>
              <span className="text-white">{deploymentResult.network}</span>
            </div>
          </div>
          
          <div className="p-3 bg-white/10 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Deployer</span>
              <span className="text-white font-mono text-sm">
                {formatAddress(deploymentResult.deployer)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-xl p-6 border border-white/20">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary-500/20 rounded-lg">
          <Rocket size={24} className="text-primary-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Deploy Contract</h3>
          <p className="text-white/70">Deploy your contract to the blockchain</p>
        </div>
      </div>
      
      <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${contract.sourceCode ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
          <span className="text-white/80 text-sm font-medium">
            {contract.sourceCode ? 'Real-time Compilation' : 'Pre-compiled Contract'}
          </span>
        </div>
        <p className="text-white/60 text-xs">
          {contract.sourceCode 
            ? `Will compile ${contract.fileName} using solc-js` 
            : 'Using pre-compiled SimpleStorage contract for demo'
          }
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white/80 font-medium mb-2">
            Target Network
          </label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="
              w-full p-3 bg-white/10 border border-white/20 rounded-lg
              text-white placeholder-white/50 focus:outline-none 
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
            "
          >
            <option value="avalanche" className="bg-gray-800">
              Avalanche Fuji
            </option>
            <option value="sepolia" className="bg-gray-800">
              Ethereum Sepolia (Testnet)
            </option>
            <option value="polygon" className="bg-gray-800">
              Polygon Mainnet
            </option>
          </select>
        </div>
        
        <div>
          <label className="block text-white/80 font-medium mb-2">
            Constructor Arguments
            <span className="text-white/50 font-normal ml-2">
              {(() => {
                if (!contract?.abi) return '(checking...)';
                const constructor = contract.abi.find(item => item.type === 'constructor');
                if (!constructor || constructor.inputs.length === 0) {
                  return '(none required)';
                }
                return `(${constructor.inputs.length} required)`;
              })()}
            </span>
          </label>
          <input
            type="text"
            value={constructorArgs}
            onChange={(e) => setConstructorArgs(e.target.value)}
            placeholder={(() => {
              if (!contract?.abi) return 'Loading...';
              const constructor = contract.abi.find(item => item.type === 'constructor');
              if (!constructor || constructor.inputs.length === 0) {
                return 'No constructor arguments needed';
              }
              return constructor.inputs.map(input => input.name || input.type).join(', ');
            })()}
            disabled={(() => {
              if (!contract?.abi) return true;
              const constructor = contract.abi.find(item => item.type === 'constructor');
              return !constructor || constructor.inputs.length === 0;
            })()}
            className="
              w-full p-3 bg-white/10 border border-white/20 rounded-lg
              text-white placeholder-white/50 focus:outline-none 
              focus:ring-2 focus:ring-primary-500 focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          />
          <p className="text-white/50 text-sm mt-1">
            {contract.sourceCode 
              ? 'Check your contract\'s constructor for required arguments. Separate multiple arguments with commas.'
              : 'SimpleStorage needs an initial value (try: 42). Separate multiple arguments with commas.'
            }
          </p>
        </div>
        
        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="text-white font-medium mb-2">Contract Details</h4>
          <div className="space-y-1 text-sm">
            <p className="text-white/70">
              <span className="text-white/50">File:</span> {contract.fileName}
            </p>
            <p className="text-white/70">
              <span className="text-white/50">IPFS:</span> {formatAddress(contract.cid, 12)}
            </p>
            <p className="text-white/70">
              <span className="text-white/50">Size:</span> {(contract.fileSize / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50/10 border border-red-200/20 rounded-lg flex items-center space-x-2">
            <AlertCircle size={20} className="text-red-400" />
            <span className="text-red-400">{error}</span>
          </div>
        )}
        
        <button
          type="submit"
          disabled={isDeploying}
          className="
            w-full flex items-center justify-center space-x-2 
            px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 
            hover:from-primary-600 hover:to-primary-700
            text-white rounded-lg font-medium
            transition-all duration-200 hover:scale-105
            disabled:opacity-50 disabled:cursor-not-allowed
            shadow-lg hover:shadow-xl
          "
        >
          {isDeploying ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
              <span>Deploying...</span>
            </>
          ) : (
            <>
              <Rocket size={20} />
              <span>Deploy Contract</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default DeploymentForm;
