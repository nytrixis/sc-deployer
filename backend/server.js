import express from 'express';
import cors from 'cors';
import multer from 'multer';
import solc from 'solc';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Function to resolve imports from node_modules
function findImports(importPath) {
  try {
    if (importPath.startsWith('@openzeppelin/')) {
      const contractPath = path.join(__dirname, 'node_modules', importPath);
      if (fs.existsSync(contractPath)) {
        const content = fs.readFileSync(contractPath, 'utf8');
        return { contents: content };
      }
    }
    return { error: `File not found: ${importPath}` };
  } catch (error) {
    return { error: `Error reading ${importPath}: ${error.message}` };
  }
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.originalname.endsWith('.sol')) {
      cb(null, true);
    } else {
      cb(new Error('Only .sol files are allowed'), false);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Solidity Compiler Backend is running' });
});

// Compile Solidity contract endpoint
app.post('/compile', upload.single('contract'), async (req, res) => {
  try {
    let sourceCode;
    let fileName;

    // Handle file upload or direct source code
    if (req.file) {
      sourceCode = req.file.buffer.toString('utf8');
      fileName = req.file.originalname.replace('.sol', '');
    } else if (req.body.sourceCode) {
      sourceCode = req.body.sourceCode;
      fileName = req.body.fileName || 'Contract';
    } else {
      return res.status(400).json({ 
        error: 'No source code provided. Send file or sourceCode in body.' 
      });
    }

    // Validate source code
    if (!sourceCode || !sourceCode.includes('contract ')) {
      return res.status(400).json({ 
        error: 'Invalid Solidity source code. Must contain at least one contract.' 
      });
    }

    console.log(`Compiling contract: ${fileName}`);

    // Prepare Solidity compiler input
    const input = {
      language: 'Solidity',
      sources: {
        [`${fileName}.sol`]: {
          content: sourceCode
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object']
          }
        },
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    };

    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

    // Check for compilation errors
    if (output.errors) {
      const errors = output.errors.filter(error => error.severity === 'error');
      if (errors.length > 0) {
        console.error('Compilation errors:', errors);
        return res.status(400).json({
          error: 'Compilation failed',
          details: errors.map(err => err.formattedMessage).join('\n')
        });
      }
    }

    // Extract compiled contracts
    const contracts = output.contracts[`${fileName}.sol`];
    if (!contracts || Object.keys(contracts).length === 0) {
      return res.status(400).json({ 
        error: 'No contracts found in source code' 
      });
    }

    // Return the first contract (or specified contract name)
    const contractName = req.body.contractName || Object.keys(contracts)[0];
    const contract = contracts[contractName];

    if (!contract) {
      return res.status(400).json({ 
        error: `Contract '${contractName}' not found. Available: ${Object.keys(contracts).join(', ')}` 
      });
    }

    const result = {
      contractName,
      abi: contract.abi,
      bytecode: '0x' + contract.evm.bytecode.object,
      deployedBytecode: '0x' + contract.evm.deployedBytecode.object,
      isCompiled: true,
      compiler: 'solc-js',
      version: solc.version(),
      warnings: output.errors ? output.errors.filter(err => err.severity === 'warning') : []
    };

    console.log(`Successfully compiled ${contractName}`);
    res.json(result);

  } catch (error) {
    console.error('Compilation error:', error);
    res.status(500).json({ 
      error: 'Internal server error during compilation',
      details: error.message 
    });
  }
});

// Get compiler version
app.get('/version', (req, res) => {
  res.json({
    solidity: solc.version(),
    node: process.version,
    backend: '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, _next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(500).json({ error: error.message });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Solidity Compiler Backend running on port ${PORT}`);
  console.log(`📝 Compiler version: ${solc.version()}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});
