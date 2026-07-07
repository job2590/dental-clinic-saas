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