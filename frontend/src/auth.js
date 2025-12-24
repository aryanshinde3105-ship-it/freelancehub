import { jwtDecode } from 'jwt-decode';

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getCurrentUser = () => {
  const token = getToken();
  if (!token) return null;

  try {
    return jwtDecode(token);
  } catch (err) {
    console.error('Invalid token');
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
};
