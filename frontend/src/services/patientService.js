import { supabase } from '../lib/supabase';

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

  if (error) { console.error('getPatients error:', error); throw error; }
  return data || [];
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

const cleanDataForDB = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = value === '' ? null : value;
  }
  return cleaned;
};

export const createPatient = async (patientData, clinicId) => {
  const codigo = await generateCode(clinicId);
  const cleanedData = cleanDataForDB(patientData);
  
  const { data, error } = await supabase
    .from('pacientes')
    .insert([{
      ...cleanedData,
      clinic_id: clinicId,
      codigo
    }])
    .select()
    .single();

  if (error) { console.error('createPatient error:', error); throw error; }
  return data;
};

export const updatePatient = async (id, patientData, clinicId) => {
  // No enviar campos que no deben actualizarse
  const { id: _, clinic_id: __, created_at: ___, fecha_registro: ____, ...restData } = patientData;
  const cleanedData = cleanDataForDB(restData);
  
  const { data, error } = await supabase
    .from('pacientes')
    .update(cleanedData)
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) { console.error('updatePatient error:', error); throw error; }
  return data;
};

export const deletePatient = async (id, clinicId) => {
  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinicId);

  if (error) { console.error('deletePatient error:', error); throw error; }
  return true;
};
