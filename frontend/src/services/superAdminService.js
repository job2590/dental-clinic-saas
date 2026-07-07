import { supabase } from '../lib/supabase';

// --- Auth ---
export const authenticateUser = async (email, password) => {
  try {
    const { data: user, error } = await supabase
      .from('usuarios')
      .select('*, roles(nombre)')
      .eq('email', email)
      .eq('password', password)
      .eq('activo', true)
      .single();

    if (error || !user) {
      return { error: { message: 'Credenciales inválidas o usuario inactivo.' } };
    }

    return { 
      user: {
        id: user.id,
        email: user.email,
        name: user.nombre,
        role: user.roles.nombre.toLowerCase(), // 'superadmin', 'admin', etc.
        clinic_id: user.clinic_id,
        avatar: user.avatar
      } 
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { error: { message: 'Error de conexión.' } };
  }
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
  // Buscar ID del rol
  const { data: role } = await supabase.from('roles').select('id').eq('nombre', userData.role === 'superadmin' ? 'SuperAdmin' : 'Admin').single();
  
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{
      clinic_id: userData.clinic_id,
      rol_id: role.id,
      nombre: userData.name,
      email: userData.email,
      password: userData.password,
      activo: true
    }])
    .select('*, roles(nombre)')
    .single();
    
  if (error) throw error;
  return { ...data, role: data.roles?.nombre?.toLowerCase() };
};

export const updateUser = async (id, userData) => {
  const updates = {};
  if (userData.name) updates.nombre = userData.name;
  if (userData.email) updates.email = userData.email;
  if (userData.password) updates.password = userData.password;
  if (userData.avatar !== undefined) updates.avatar = userData.avatar;

  const { data, error } = await supabase
    .from('usuarios')
    .update(updates)
    .eq('id', id)
    .select('*, roles(nombre)')
    .single();

  if (error) throw error;
  return { ...data, role: data.roles?.nombre?.toLowerCase() };
};

export const deleteUser = async (id) => {
  const { error } = await supabase.from('usuarios').delete().eq('id', id);
  if (error) throw error;
  return true;
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
