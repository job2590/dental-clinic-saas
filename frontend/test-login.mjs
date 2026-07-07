import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tfckddfamnwaexxmmmfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmY2tkZGZhbW53YWV4eG1tbWZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNzY3OTIsImV4cCI6MjA5ODk1Mjc5Mn0.GSxp4R8z79aH80Jgu4Glm4WJEWxryK2DwPo0zBZ5C6E';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedData() {
  console.log('Insertando roles...');
  const { data: rolesData, error: rolesError } = await supabase.from('roles').insert([
    { nombre: 'SuperAdmin', descripcion: 'Administrador Global del SaaS' },
    { nombre: 'Admin', descripcion: 'Administrador de una clínica' },
    { nombre: 'Odontologo', descripcion: 'Médico odontólogo de una clínica' }
  ]).select();

  if (rolesError) {
    console.error('Error insertando roles:', rolesError.message);
  } else {
    console.log('Roles insertados con exito!');
  }

  // Buscar el id del rol SuperAdmin (debería ser 1 pero por si acaso)
  const { data: saRole } = await supabase.from('roles').select('id').eq('nombre', 'SuperAdmin').single();

  if (saRole) {
    console.log('Insertando usuario Super Admin...');
    const { error: userError } = await supabase.from('usuarios').insert([
      { rol_id: saRole.id, nombre: 'Super Admin', email: 'superadmin@saas.com', password: 'admin', activo: true }
    ]);
    if (userError) {
      console.error('Error insertando usuario:', userError.message);
    } else {
      console.log('Super Admin insertado con exito!');
    }
  }
}

seedData();
