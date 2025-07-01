import { useState, useCallback } from 'react';
import ipfsService from '../services/ipfsService';
import firebaseService from '../services/firebaseService';
import blockchainService from '../services/blockchainService';
import { validateContractFile, generateContractId } from '../utils/helpers';

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
      // Validate file
      const validation = validateContractFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      setUploadProgress(25);

      // Upload to IPFS
      const ipfsResult = await ipfsService.uploadFile(file);
      setUploadProgress(75);

      // Save metadata to Firebase
      const contractData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        cid: ipfsResult.cid,
        status: 'uploaded',
        uploaderAddress: blockchainService.getAccount(),
        ipfsHash: ipfsResult.cid,
        contractId: generateContractId()
      };

      const docId = await firebaseService.saveContract(contractData);
      setUploadProgress(100);

      return {
        ...contractData,
        id: docId,
        ipfsResult
      };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, []);

  const deployContract = useCallback(async (contractData, constructorArgs = []) => {
    setIsDeploying(true);
    setError(null);

    try {
      // Check wallet connection
      if (!blockchainService.isConnected()) {
        throw new Error('Wallet not connected');
      }

      let compiledContract;

      // Handle different file types
      if (contractData.fileName.endsWith('.sol')) {
        // For Solidity files, we need to compile first
        // In a real implementation, you'd fetch the source code from IPFS
        const sourceCode = await ipfsService.getFile(contractData.cid);
        compiledContract = await blockchainService.compileContract(
          sourceCode, 
          contractData.fileName.replace('.sol', '')
        );
      } else if (contractData.fileName.endsWith('.json')) {
        // For JSON files, assume it's already compiled contract data
        const contractJson = await ipfsService.getJSON(contractData.cid);
        compiledContract = {
          bytecode: contractJson.bytecode,
          abi: contractJson.abi,
          contractName: contractData.fileName.replace('.json', '')
        };
      } else {
        throw new Error('Unsupported contract file type for deployment');
      }

      // Deploy the contract
      const deploymentResult = await blockchainService.deployContract(
        compiledContract, 
        constructorArgs
      );

      // Update contract in Firebase with deployment info
      const updateData = {
        status: 'deployed',
        contractAddress: deploymentResult.contractAddress,
        transactionHash: deploymentResult.transactionHash,
        deployer: deploymentResult.deployer,
        network: deploymentResult.network,
        chainId: deploymentResult.chainId,
        deployedAt: new Date()
      };

      await firebaseService.updateContract(contractData.id, updateData);

      return {
        ...contractData,
        ...updateData,
        ...deploymentResult
      };
    } catch (err) {
      // Update status to failed
      if (contractData.id) {
        await firebaseService.updateContract(contractData.id, {
          status: 'failed',
          error: err.message
        });
      }
      
      setError(err.message);
      throw err;
    } finally {
      setIsDeploying(false);
    }
  }, []);

  const getContracts = useCallback(async (filters = {}) => {
    try {
      return await firebaseService.getContracts(filters);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const getContractsByDeployer = useCallback(async (deployerAddress) => {
    try {
      return await firebaseService.getContractsByDeployer(deployerAddress);
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
