export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatAddress = (address, length = 6) => {
  if (!address) return '';
  return `${address.slice(0, length)}...${address.slice(-4)}`;
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  
  let targetDate;
  
  if (date && typeof date.toDate === 'function') {
    targetDate = date.toDate();
  } else if (date && date.seconds) {
    targetDate = new Date(date.seconds * 1000);
  } else {
    targetDate = new Date(date);
  }
  
  const now = new Date();
  const diffTime = now.getTime() - targetDate.getTime();
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return 'Just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return targetDate.toLocaleDateString();
  }
};

export const validateContractFile = (file) => {
  const allowedExtensions = ['.sol', '.wasm', '.json'];
  const maxSize = import.meta.env.VITE_MAX_FILE_SIZE || 10485760;
  
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${formatFileSize(maxSize)}`
    };
  }
  
  return { valid: true };
};

export const getFileType = (filename) => {
  const extension = filename.split('.').pop().toLowerCase();
  const types = {
    sol: 'Solidity',
    wasm: 'WebAssembly',
    json: 'JSON/ABI'
  };
  
  return types[extension] || 'Unknown';
};

export const generateContractId = () => {
  return 'contract_' + Math.random().toString(36).substr(2, 9);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getStatusColor = (status) => {
  const colors = {
    'pending': 'text-yellow-600 bg-yellow-50',
    'uploaded': 'text-blue-600 bg-blue-50',
    'deployed': 'text-green-600 bg-green-50',
    'failed': 'text-red-600 bg-red-50'
  };
  
  return colors[status?.toLowerCase()] || 'text-gray-600 bg-gray-50';
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
