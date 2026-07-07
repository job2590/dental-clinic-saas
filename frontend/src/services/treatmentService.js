import { supabase } from '../lib/supabase';

export const getTreatmentsByPatient = async (pacienteId, clinicId) => {
  const { data, error } = await supabase
    .from('tratamientos')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) { console.error('getTreatmentsByPatient error:', error); throw error; }
  return data || [];
};

export const createTreatment = async (pacienteId, treatmentData, clinicId) => {
  const { data, error } = await supabase
    .from('tratamientos')
    .insert([{ ...treatmentData, paciente_id: pacienteId, clinic_id: clinicId }])
    .select()
    .single();

  if (error) { console.error('createTreatment error:', error); throw error; }
  return data;
};

export const updateTreatment = async (id, treatmentData, clinicId) => {
  const { id: _, clinic_id: __, paciente_id: ___, created_at: ____, ...cleanData } = treatmentData;

  const { data, error } = await supabase
    .from('tratamientos')
    .update(cleanData)
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) { console.error('updateTreatment error:', error); throw error; }
  return data;
};

export const deleteTreatment = async (id, clinicId) => {
  const { error } = await supabase
    .from('tratamientos')
    .delete()
    .eq('id', id)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
