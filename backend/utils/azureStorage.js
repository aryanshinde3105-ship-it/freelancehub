const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const fs = require('fs');


const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;


const credential = new StorageSharedKeyCredential(accountName, accountKey);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  credential
);


const containerClient = blobServiceClient.getContainerClient(containerName);


// Upload file to Azure from file path
// Upload file to Azure from file path
const uploadFileToAzure = async (filename, filePath, mimeType = 'application/octet-stream') => {
  try {
    console.log('Starting Azure upload...');
    console.log('File path:', filePath);
    console.log('MIME type:', mimeType);
    
    // Read file from disk
    const fileContent = fs.readFileSync(filePath);
    console.log('File size:', fileContent.length, 'bytes');
    
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    
    // Upload with content type
    await blockBlobClient.upload(fileContent, fileContent.length, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });
    
    console.log('Upload successful, URL:', blockBlobClient.url);
    
    // Delete local file after upload
    fs.unlinkSync(filePath);
    
    return blockBlobClient.url;
  } catch (error) {
    console.error('Azure upload error:', error);
    throw error;
  }
};



// Delete file from Azure
const deleteFileFromAzure = async (filename) => {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    await blockBlobClient.delete();
  } catch (error) {
    console.error('Azure delete error:', error);
    throw error;
  }
};


// Get file URL
const getAzureFileUrl = (filename) => {
  return `https://${accountName}.blob.core.windows.net/${containerName}/${filename}`;
};


module.exports = {
  uploadFileToAzure,
  deleteFileFromAzure,
  getAzureFileUrl,
};
