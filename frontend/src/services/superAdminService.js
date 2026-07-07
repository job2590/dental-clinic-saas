import { supabase } from '../lib/supabase';

// --- Auth ---
export const authenticateUser = async (email, password) => {
  // 1. Autenticación vía Supabase Auth (contraseñas seguras y encriptadas)
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (authError) {
    return { error: { message: 'Credenciales inválidas o usuario inactivo.' } };
  }

  // 2. Obtener perfil del usuario desde nuestra tabla
  const { data: user, error } = await supabase
    .from('usuarios')
    .select('*, roles(nombre)')
    .eq('email', email)
    .eq('activo', true)
    .single();

  if (error || !user) {
    return { error: { message: 'Usuario no encontrado o inactivo.' } };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.nombre,
      role: user.roles?.nombre?.toLowerCase() || 'admin',
      clinic_id: user.clinic_id,
      avatar: user.avatar
    }
  };
};

export const getClinicById = async (id) => {
  const { data } = await supabase.from('clinics').select('*').eq('id', id).single();
  return data;
};

// --- Clinics CRUD ---

export const getClinics = async () => {
  const { data } = await supabase.from('clinics').select('*').order('fecha_registro', { ascending: false });
  return data || [];
};

export const createClinic = async (clinicData) => {
  const { data, error } = await supabase
    .from('clinics')
    .insert([{ 
      nombre: clinicData.nombre, 
      direccion: clinicData.direccion, 
      telefono: clinicData.telefono, 
      correo: clinicData.correo,
      plan: clinicData.plan || 'Básico'
    }])
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const updateClinic = async (id, clinicData) => {
  const { data, error } = await supabase
    .from('clinics')
    .update(clinicData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const changeClinicStatus = async (id, estado) => {
  const { data, error } = await supabase
    .from('clinics')
    .update({ estado })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteClinic = async (id) => {
  const { error } = await supabase.from('clinics').delete().eq('id', id);
  if (error) throw error;
  return true;
};

// --- Users CRUD ---

export const getUsersByClinic = async (clinicId) => {
  const { data } = await supabase
    .from('usuarios')
    .select('*, roles(nombre)')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });
    
  return (data || []).map(u => ({
    ...u,
    role: u.roles?.nombre?.toLowerCase()
  }));
};

export const createUser = async (userData) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No autenticado");

  const response = await fetch('/api/createUser', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify(userData)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al crear usuario');
  return data.user;
};

export const updateUser = async (id, userData) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No autenticado");

  const response = await fetch('/api/updateUser', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ id, ...userData })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al actualizar usuario');
  return data.user;
};

export const deleteUser = async (id) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("No autenticado");

  const response = await fetch('/api/deleteUser', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ id })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Error al eliminar usuario');
  return data.success;
};

// --- Stats ---

export const getGlobalStats = async () => {
  const { count: totalClinics } = await supabase.from('clinics').select('*', { count: 'exact', head: true });
  const { count: activeClinics } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('estado', 'Activa');
  const { count: suspendedClinics } = await supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('estado', 'Suspendida');
  const { count: totalUsers } = await supabase.from('usuarios').select('*', { count: 'exact', head: true }).not('clinic_id', 'is', null);

  return {
    totalClinics: totalClinics || 0,
    activeClinics: activeClinics || 0,
    suspendedClinics: suspendedClinics || 0,
    totalUsers: totalUsers || 0
  };
};