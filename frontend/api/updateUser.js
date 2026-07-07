import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  
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
     return res.status(403).json({ error: 'Forbidden: Only SuperAdmins can update users.' });
  }

  const { id, email, password, name, avatar, activo } = req.body;

  try {
    // 1. Update in auth.users if email or password changed
    const authUpdates = {};
    if (email) authUpdates.email = email;
    if (password) authUpdates.password = password;
    
    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, authUpdates);
      if (authError) throw authError;
    }

    // 2. Update profile
    const profileUpdates = {};
    if (name) profileUpdates.nombre = name;
    if (email) profileUpdates.email = email;
    if (avatar !== undefined) profileUpdates.avatar = avatar;
    if (activo !== undefined) profileUpdates.activo = activo;

    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from('usuarios')
      .update(profileUpdates)
      .eq('id', id)
      .select('*, roles(nombre)')
      .single();

    if (profileErr) throw profileErr;
    
    return res.status(200).json({ user: { ...userProfile, role: userProfile.roles?.nombre?.toLowerCase() } });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
