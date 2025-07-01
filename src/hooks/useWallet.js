import { useState, useEffect, useCallback } from 'react';
import blockchainService from '../services/blockchainService';

export const useWallet = () => {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [balance, setBalance] = useState('0');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await blockchainService.connectWallet();
      setAccount(result.account);
      setNetwork(result.network);
      
      const walletBalance = await blockchainService.getBalance();
      setBalance(walletBalance);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchNetwork = useCallback(async (networkName) => {
    setError(null);
    
    try {
      const newNetwork = await blockchainService.switchNetwork(networkName);
      setNetwork(newNetwork);
      
      const walletBalance = await blockchainService.getBalance();
      setBalance(walletBalance);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setNetwork(null);
    setBalance('0');
    setError(null);
  }, []);

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else if (accounts[0] !== account) {
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [account, connectWallet, disconnect]);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_accounts' 
          });
          
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (err) {
          console.error('Error checking wallet connection:', err);
        }
      }
    };

    checkConnection();
  }, [connectWallet]);

  const isConnected = !!account;
  const supportedNetworks = blockchainService.getSupportedNetworks();

  return {
    account,
    network,
    balance,
    isConnected,
    isConnecting,
    error,
    supportedNetworks,
    connectWallet,
    switchNetwork,
    disconnect
  };
};
