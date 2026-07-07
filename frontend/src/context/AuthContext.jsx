import React, { createContext, useContext, useState, useEffect } from 'react';
import { getClinicById } from '../services/superAdminService';
// IMPORTANTE: Asegúrate de que esta ruta apunte a tu archivo de configuración de supabase
import { supabase } from '../lib/supabase'; 

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
    // 1. Verificar si ya hay una sesión segura de Supabase guardada
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchUserAndClinic(session.user.email);
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 2. Escuchar cambios (login / logout) en tiempo real
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchUserAndClinic(session.user.email);
      } else {
        setUser(null);
        setClinic(null);
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Función interna para buscar el perfil del usuario y su clínica
  const fetchUserAndClinic = async (email) => {
    try {
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('*, roles(nombre)')
        .eq('email', email)
        .single();

      if (userData) {
        const parsedUser = {
          id: userData.id,
          email: userData.email,
          name: userData.nombre,
          role: userData.roles?.nombre?.toLowerCase() || 'admin',
          clinic_id: userData.clinic_id,
          avatar: userData.avatar
        };
        setUser(parsedUser);

        // Si tiene una clínica asignada, la buscamos
        if (parsedUser.clinic_id) {
          const c = await getClinicById(parsedUser.clinic_id);
          setClinic(c);
        } else {
          setClinic(null); // SuperAdmin por defecto no tiene clínica
        }
      }
    } catch (error) {
      console.error("Error al obtener usuario o clínica", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password, rememberMe) => {
    setIsLoading(true);
    
    // Supabase maneja la persistencia automáticamente de forma segura
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      setIsLoading(false);
      return { data: null, error: { message: 'Credenciales inválidas.' } };
    }
    
    // Al hacer signIn exitoso, el onAuthStateChange (arriba) detectará el evento
    // y llamará a fetchUserAndClinic automáticamente.
    return { data, error: null };
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    // onAuthStateChange limpia el estado automáticamente
    return { error: null };
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