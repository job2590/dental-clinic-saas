import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  
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
     return res.status(403).json({ error: 'Forbidden: Only SuperAdmins can delete users.' });
  }

  const { id } = req.body;

  try {
    // 1. Delete from public.usuarios first (no cascade config from auth.users by default)
    const { error: profileErr } = await supabaseAdmin.from('usuarios').delete().eq('id', id);
    if (profileErr) throw profileErr;
    
    // 2. Delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;
    
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}
