import { supabase } from '../lib/supabase';

// Generar código estilo PAC-0001
const generateCode = async (clinicId) => {
  const { count } = await supabase
    .from('pacientes')
    .select('*', { count: 'exact', head: true })
    .eq('clinic_id', clinicId);
    
  const nextNum = (count || 0) + 1;
  return `PAC-${String(nextNum).padStart(4, '0')}`;
};

export const getPatients = async (clinicId) => {
  if (!clinicId) return [];
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getPatientById = async (id, clinicId) => {
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .single();

  if (error || !data) throw new Error('Paciente no encontrado');
  return data;
};

export const createPatient = async (patientData, clinicId) => {
  const codigo = await generateCode(clinicId);
  
  const { data, error } = await supabase
    .from('pacientes')
    .insert([{
      ...patientData,
      clinic_id: clinicId,
      codigo
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePatient = async (id, patientData, clinicId) => {
  const { data, error } = await supabase
    .from('pacientes')
    .update(patientData)
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deletePatient = async (id, clinicId) => {
  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
