import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateUser, getClinicById } from '../services/superAdminService';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStoredUser = async () => {
      const storedUser = localStorage.getItem('clinic_user') || sessionStorage.getItem('clinic_user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        if (parsedUser.clinic_id) {
          const c = await getClinicById(parsedUser.clinic_id);
          setClinic(c);
        }
      }
      setIsLoading(false);
    };
    fetchStoredUser();
    setIsLoading(false);
  }, []);

  const login = async (email, password, rememberMe) => {
    setIsLoading(true);
    const { user: authUser, error } = await authenticateUser(email, password);
    
    if (error) {
      setIsLoading(false);
      return { data: null, error };
    }

    setUser(authUser);
    
    if (authUser.clinic_id) {
      const c = await getClinicById(authUser.clinic_id);
      setClinic(c);
    } else {
      setClinic(null); // SuperAdmin doesn't have a clinic by default
    }

    if (rememberMe) {
      localStorage.setItem('clinic_user', JSON.stringify(authUser));
    } else {
      sessionStorage.setItem('clinic_user', JSON.stringify(authUser));
    }
    
    setIsLoading(false);
    return { data: { user: authUser }, error: null };
  };

  const logout = async () => {
    setIsLoading(true);
    // TODO: Reemplazar por supabase.auth.signOut()
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser(null);
        setClinic(null);
        localStorage.removeItem('clinic_user');
        sessionStorage.removeItem('clinic_user');
        setIsLoading(false);
        resolve({ error: null });
      }, 400);
    });
  };

  const value = {
    user,
    clinic,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Evitamos parpadeos mientras se carga la sesión inicial */}
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
