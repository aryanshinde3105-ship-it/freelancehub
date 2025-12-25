// frontend/src/auth.js

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch (err) {
    console.error('Invalid user data in storage');
    return null;
  }
};

export const loginUser = (data) => {
  // data = response from backend (user info + token)
  localStorage.setItem('token', data.token);

  localStorage.setItem(
    'user',
    JSON.stringify({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
    })
  );
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
