
import { useCallback, useState } from 'react';
import { AuthContext } from './auth-context';
import api from '../api/client';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('sweety_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem('sweety_token')
  );

  const saveSession = (data) => {
    localStorage.setItem('sweety_token', data.token);
    localStorage.setItem('sweety_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    saveSession(response.data.data);
    return response.data.data;
  };

  const register = async (details) => {
    const response = await api.post('/auth/register', details);
    saveSession(response.data.data);
    return response.data.data;
  };

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('sweety_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const logout = () => {
    localStorage.removeItem('sweety_token');
    localStorage.removeItem('sweety_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

