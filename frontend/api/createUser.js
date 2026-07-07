import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server configuration error. Missing SUPABASE_SERVICE_ROLE_KEY.' });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  
  // Verify Caller (must be superadmin)
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
  
  if (userError || !user) return res.status(401).json({ error: 'Invalid token' });
  
  const { data: callerProfile } = await supabaseAdmin.from('usuarios').select('rol_id').eq('id', user.id).single();
  if (!callerProfile || callerProfile.rol_id !== 1) { // 1 = SuperAdmin
     return res.status(403).json({ error: 'Forbidden: Only SuperAdmins can create users.' });
  }

  const { email, password, name, role, clinic_id } = req.body;

  try {
    // 1. Create in auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) throw authError;

    // 2. Fetch role id
    const roleName = role === 'superadmin' ? 'SuperAdmin' : role === 'odontologo' ? 'Odontologo' : 'Admin';
    const { data: roleData, error: roleErr } = await supabaseAdmin.from('roles').select('id').eq('nombre', roleName).single();
    if (roleErr) throw roleErr;

    // 3. Create in public.usuarios WITH MATCHING UUID
    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        id: authData.user.id,
        clinic_id: clinic_id || null,
        rol_id: roleData.id,
        nombre: name,
        email: email,
        activo: true
      }])
      .select('*, roles(nombre)')
      .single();

    if (profileErr) {
      // Rollback
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileErr;
    }

    return res.status(200).json({ user: { ...userProfile, role: userProfile.roles?.nombre?.toLowerCase() } });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
