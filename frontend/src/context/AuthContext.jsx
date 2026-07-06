import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular validación de sesión (futuro: supabase.auth.getSession())
    const storedUser = localStorage.getItem('clinic_user') || sessionStorage.getItem('clinic_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password, rememberMe) => {
    setIsLoading(true);
    // TODO: Reemplazar por supabase.auth.signInWithPassword
    return new Promise((resolve) => {
      setTimeout(() => {
        if (email && password) {
          const fakeUser = { id: 1, email, role: 'admin', name: 'Dr. Admin' };
          setUser(fakeUser);
          if (rememberMe) {
            localStorage.setItem('clinic_user', JSON.stringify(fakeUser));
          } else {
            sessionStorage.setItem('clinic_user', JSON.stringify(fakeUser));
          }
          setIsLoading(false);
          resolve({ data: { user: fakeUser }, error: null });
        } else {
          setIsLoading(false);
          resolve({ data: null, error: { message: 'El correo o la contraseña son incorrectos.' } });
        }
      }, 800);
    });
  };

  const logout = async () => {
    setIsLoading(true);
    // TODO: Reemplazar por supabase.auth.signOut()
    return new Promise((resolve) => {
      setTimeout(() => {
        setUser(null);
        localStorage.removeItem('clinic_user');
        sessionStorage.removeItem('clinic_user');
        setIsLoading(false);
        resolve({ error: null });
      }, 400);
    });
  };

  const value = {
    user,
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
