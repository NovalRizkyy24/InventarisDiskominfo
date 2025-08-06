import { useState, useEffect } from 'react';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      const decodedUser = parseJwt(token);
      setUser(decodedUser);
    }
  }, []);

  return { user };
};
