import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle } from 'lucide-react';
import { validateContractFile, formatFileSize, getFileType } from '../utils/helpers';

const FileUpload = ({ onFileSelect, isUploading, error }) => {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      return;
    }

    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const validation = validateContractFile(file);
      
      if (!validation.valid) {
        return;
      }
      
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.sol'],
      'application/wasm': ['.wasm'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          upload-zone glass-effect rounded-2xl p-8 border-2 border-dashed 
          ${isDragActive 
            ? 'border-primary-500 bg-primary-500/10' 
            : 'border-gray-600 hover:border-primary-400'
          }
          ${isUploading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          transition-all duration-300 text-center
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          <div className={`
            p-4 rounded-full 
            ${isDragActive ? 'bg-primary-500' : 'bg-gray-700/50'} 
            transition-colors duration-300
          `}>
            <Upload 
              size={32} 
              className={isDragActive ? 'text-white' : 'text-gray-300'} 
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              {isDragActive ? 'Drop your contract file here' : 'Upload Smart Contract'}
            </h3>
            <p className="text-gray-400">
              Drag & drop or click to select your contract file
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: .sol, .wasm, .json (max 10MB)
            </p>
          </div>
          
          {!isUploading && (
            <button 
              type="button"
              className="
                px-6 py-3 bg-gray-700 hover:bg-gray-600 
                text-white rounded-lg font-medium
                transition-all duration-200 hover:scale-105
                backdrop-blur-sm border border-gray-600
              "
            >
              Choose File
            </button>
          )}
          
          {isUploading && (
            <div className="flex items-center space-x-2 text-gray-300">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
              <span>Uploading...</span>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center space-x-2 text-red-400">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export const FilePreview = ({ file, onRemove, className = '' }) => {
  return (
    <div className={`
      glass-effect rounded-lg p-4 border border-gray-700 
      flex items-center justify-between ${className}
    `}>
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-700/50 rounded-lg">
          <File size={24} className="text-gray-300" />
        </div>
        <div>
          <p className="font-medium text-white">{file.name}</p>
          <p className="text-sm text-gray-400">
            {getFileType(file.name)} • {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      
      {onRemove && (
        <button
          onClick={onRemove}
          className="
            p-2 hover:bg-red-500/20 rounded-lg 
            text-gray-400 hover:text-red-400 
            transition-colors duration-200
          "
        >
          ×
        </button>
      )}
    </div>
  );
};

export default FileUpload;
