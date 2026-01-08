// Get the API base URL
export const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

// Get full file URL
export const getFileUrl = (filename) => {
  return `${getApiUrl()}/uploads/${filename}`;
};
