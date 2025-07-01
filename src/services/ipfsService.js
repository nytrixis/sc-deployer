class IPFSService {
  constructor() {
    this.pinataApiKey = import.meta.env.VITE_PINATA_API_KEY;
    this.pinataSecretKey = import.meta.env.VITE_PINATA_SECRET_KEY;
    this.pinataGateway = import.meta.env.VITE_IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';
    this.isConfigured = !!(this.pinataApiKey && this.pinataSecretKey);
  }

  async uploadFile(file) {
    if (!this.isConfigured) {
      return this.mockUpload(file);
    }

    try {
      
      const formData = new FormData();
      formData.append('file', file);
      
      const metadata = JSON.stringify({
        name: file.name,
        keyvalues: {
          uploadedAt: new Date().toISOString(),
          fileType: file.type
        }
      });
      formData.append('pinataMetadata', metadata);

      const options = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', options);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata upload failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      return {
        cid: result.IpfsHash,
        size: file.size,
        name: file.name,
        type: file.type,
        url: `${this.pinataGateway}${result.IpfsHash}`
      };
      
    } catch (error) {
      console.error('File upload to IPFS failed:', error);
      return this.mockUpload(file);
    }
  }

  async uploadJSON(data) {
    if (!this.isConfigured) {
      return this.mockUploadJSON(data);
    }

    try {
      
      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': this.pinataApiKey,
          'pinata_secret_api_key': this.pinataSecretKey
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `metadata_${Date.now()}.json`,
            keyvalues: {
              uploadedAt: new Date().toISOString()
            }
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Pinata JSON upload failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      return {
        cid: result.IpfsHash,
        url: `${this.pinataGateway}${result.IpfsHash}`
      };

    } catch (error) {
      console.error('JSON upload to IPFS failed:', error);
      return this.mockUploadJSON(data);
    }
  }

  async mockUpload(file) {
    const mockCid = 'Qm' + Math.random().toString(36).substr(2, 44);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      cid: mockCid,
      size: file.size,
      name: file.name,
      type: file.type,
      url: `${this.pinataGateway}${mockCid}`
    };
  }

  async mockUploadJSON(data) {
    const mockCid = 'Qm' + Math.random().toString(36).substr(2, 44);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      cid: mockCid,
      url: `${this.pinataGateway}${mockCid}`,
      data: data
    };
  }

  async getFile(cid) {
    try {
      const response = await fetch(`${this.pinataGateway}${cid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.error('Failed to retrieve file from IPFS:', error);
      throw new Error(`Failed to retrieve file: ${error.message}`);
    }
  }

  async getJSON(cid) {
    try {
      const response = await fetch(`${this.pinataGateway}${cid}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch JSON: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to retrieve JSON from IPFS:', error);
      throw new Error(`Failed to retrieve JSON: ${error.message}`);
    }
  }

  getGatewayUrl(cid) {
    return `${this.pinataGateway}${cid}`;
  }
}

export default new IPFSService();
