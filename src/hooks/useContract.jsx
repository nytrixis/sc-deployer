import { useState, useCallback } from 'react';
import ipfsService from '../services/ipfsService';
import firebaseService from '../services/firebaseService';
import blockchainService from '../services/blockchainService';

const readFileContent = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
};

export const useContract = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadToIPFS = useCallback(async (file) => {
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let sourceCode = null;
      if (file.name.endsWith('.sol')) {
        sourceCode = await readFileContent(file);
      }
      
      setUploadProgress(25);
      
      const ipfsResult = await ipfsService.uploadFile(file);
      setUploadProgress(75);
      
      const contractData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        cid: ipfsResult.cid,
        status: 'uploaded',
        ipfsGatewayUrl: ipfsService.getGatewayUrl(ipfsResult.cid),
        uploaderAddress: blockchainService.getAccount(),
        network: null,
        contractAddress: null,
        transactionHash: null,
        deployer: null,
        sourceCode: sourceCode
      };
      
      const docId = await firebaseService.saveContract(contractData);
      setUploadProgress(100);
      
      return {
        id: docId,
        ...contractData,
        name: file.name,
        size: file.size,
        type: file.type,
        sourceCode: sourceCode
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  }, []);

  const deployContract = useCallback(async (contract, constructorArgs = []) => {
    setIsDeploying(true);
    setError(null);

    try {
      const contractName = contract.fileName.replace(/\.[^/.]+$/, "");
      
      const compiledContract = await blockchainService.compileContract(
        contract.sourceCode,
        contractName
      );

      const deploymentResult = await blockchainService.deployContract(
        compiledContract,
        constructorArgs
      );

      if (contract.id) {
        await firebaseService.updateContract(contract.id, {
          status: 'deployed',
          contractAddress: deploymentResult.contractAddress,
          transactionHash: deploymentResult.transactionHash,
          deployer: deploymentResult.deployer,
          network: deploymentResult.network,
          chainId: deploymentResult.chainId
        });
      }

      return deploymentResult;
    } catch (err) {
      setError(err.message);
      
      if (contract.id) {
        try {
          await firebaseService.updateContract(contract.id, {
            status: 'failed',
            error: err.message
          });
        } catch (updateError) {
          console.error('Failed to update contract status:', updateError);
        }
      }
      
      throw err;
    } finally {
      setIsDeploying(false);
    }
  }, []);

  const getContracts = useCallback(async (filters = {}) => {
    try {
      const contracts = await firebaseService.getContracts(filters);
      return contracts;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getContractsByDeployer = useCallback(async (deployerAddress) => {
    try {
      const contracts = await firebaseService.getContractsByDeployer(deployerAddress);
      return contracts;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    isUploading,
    isDeploying,
    uploadProgress,
    error,
    uploadToIPFS,
    deployContract,
    getContracts,
    getContractsByDeployer
  };
};
