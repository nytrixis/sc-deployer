import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Upload, Rocket, FileText } from 'lucide-react';
import FileUpload, { FilePreview } from './components/FileUpload';
import WalletConnection from './components/WalletConnection';
import DeploymentForm from './components/DeploymentForm';
import ContractsDashboard from './components/ContractsDashboard';
import { useWallet } from './hooks/useWallet';
import { useContract } from './hooks/useContract.jsx';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedContract, setUploadedContract] = useState(null);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);

  const {
    account,
    network,
    balance,
    isConnected,
    isConnecting,
    error: walletError,
    supportedNetworks,
    connectWallet,
    switchNetwork,
    disconnect
  } = useWallet();

  const {
    isUploading,
    isDeploying,
    uploadProgress,
    error: contractError,
    uploadToIPFS,
    deployContract,
    getContracts
  } = useContract();

  const loadContracts = useCallback(async () => {
    setIsLoadingContracts(true);
    try {
      const allContracts = await getContracts();
      setContracts(allContracts);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setIsLoadingContracts(false);
    }
  }, [getContracts]);

  // Load contracts when wallet connects
  useEffect(() => {
    if (isConnected && account) {
      loadContracts();
    }
  }, [isConnected, account, loadContracts]);

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setUploadedContract(null);
    setDeploymentResult(null);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadToIPFS(selectedFile);
      setUploadedContract(result);
      setSelectedFile(null);
      
      // Refresh contracts list
      if (isConnected) {
        await loadContracts();
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleDeploy = async (contract, constructorArgs, network) => {
    try {
      // Switch to the selected network first if needed
      const currentNetwork = await window.ethereum.request({ method: 'eth_chainId' });
      const networkMap = {
        'avalanche': '0xa869',
        'sepolia': '0xaa36a7',
        'polygon': '0x89'
      };
      
      if (currentNetwork !== networkMap[network]) {
        await switchNetwork(network);
      }
      
      const result = await deployContract(contract, constructorArgs);
      setDeploymentResult(result);
      
      // Refresh contracts list
      await loadContracts();
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  const handleNewContract = () => {
    setSelectedFile(null);
    setUploadedContract(null);
    setDeploymentResult(null);
    setActiveTab('upload');
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg">
              <Shield size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">
              Smart Contract Uploader
            </h1>
          </div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Upload, store, and deploy your smart contracts to the blockchain with ease
          </p>
        </header>

        <nav className="glass-effect rounded-xl p-2 mb-8 border border-gray-700">
          <div className="flex space-x-1">
            {[
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'deploy', label: 'Deploy', icon: Rocket },
              { id: 'history', label: 'History', icon: FileText }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
                    transition-all duration-200 flex-1 justify-center
                    ${activeTab === tab.id 
                      ? 'bg-primary-500 text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                    }
                  `}
                >
                  <IconComponent size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Wallet */}
          <div className="lg:col-span-1">
            <WalletConnection
              account={account}
              network={network}
              balance={balance}
              isConnected={isConnected}
              isConnecting={isConnecting}
              error={walletError}
              supportedNetworks={supportedNetworks}
              onConnect={connectWallet}
              onSwitchNetwork={switchNetwork}
              onDisconnect={disconnect}
            />
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'upload' && (
              <div className="space-y-6">
                {!selectedFile && !uploadedContract && (
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    isUploading={isUploading}
                    error={contractError}
                  />
                )}

                {selectedFile && !uploadedContract && (
                  <div className="space-y-4">
                    <FilePreview
                      file={selectedFile}
                      onRemove={handleFileRemove}
                    />
                    
                    {isUploading && (
                      <div className="glass-effect rounded-xl p-6 border border-white/20">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                          <span className="text-white">Uploading to IPFS...</span>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-white/70 text-sm mt-2">
                          {uploadProgress}% complete
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleUpload}
                      disabled={isUploading || !isConnected}
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
                      <Upload size={20} />
                      <span>Upload to IPFS</span>
                    </button>
                  </div>
                )}

                {uploadedContract && !deploymentResult && (
                  <div className="space-y-4">
                    <div className="glass-effect rounded-xl p-6 border border-green-200/20 bg-green-50/5">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                          <Upload size={24} className="text-green-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            File Uploaded Successfully!
                          </h3>
                          <p className="text-white/70">
                            Your contract is now stored on IPFS
                          </p>
                        </div>
                      </div>
                      <FilePreview file={uploadedContract} />
                    </div>

                    <button
                      onClick={() => setActiveTab('deploy')}
                      className="
                        w-full flex items-center justify-center space-x-2 
                        px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 
                        hover:from-primary-600 hover:to-primary-700
                        text-white rounded-lg font-medium
                        transition-all duration-200 hover:scale-105
                        shadow-lg hover:shadow-xl
                      "
                    >
                      <Rocket size={20} />
                      <span>Deploy Contract</span>
                    </button>

                    <button
                      onClick={handleNewContract}
                      className="
                        w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 
                        text-white rounded-lg font-medium
                        transition-all duration-200
                        border border-gray-600
                      "
                    >
                      Upload Another Contract
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'deploy' && (
              <div>
                {uploadedContract ? (
                  <DeploymentForm
                    contract={uploadedContract}
                    isDeploying={isDeploying}
                    onDeploy={handleDeploy}
                    deploymentResult={deploymentResult}
                    error={contractError}
                  />
                ) : (
                  <div className="glass-effect rounded-xl p-8 border border-gray-700 text-center">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="p-4 bg-gray-700/50 rounded-full">
                        <Rocket size={32} className="text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                          No Contract Ready for Deployment
                        </h3>
                        <p className="text-gray-400">
                          Upload a contract file first to enable deployment
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="
                          px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 
                          hover:from-primary-600 hover:to-primary-700
                          text-white rounded-lg font-medium
                          transition-all duration-200 hover:scale-105
                        "
                      >
                        Upload Contract
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <ContractsDashboard
                contracts={contracts}
                isLoading={isLoadingContracts}
                onRefresh={loadContracts}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
