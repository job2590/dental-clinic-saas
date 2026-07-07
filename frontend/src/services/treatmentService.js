import { supabase } from '../lib/supabase';

export const getTreatmentsByPatient = async (pacienteId, clinicId) => {
  // We need to join with historias_clinicas since tratamientos link to it, 
  // or we can adjust if we link treatment to patient directly.
  // Wait, in schema.sql:
  // tratamientos: historia_clinica_id REFERENCES historias_clinicas(id)
  // Let's get the historia_clinica_id for the patient.
  const { data: hc } = await supabase.from('historias_clinicas').select('id').eq('paciente_id', pacienteId).eq('clinic_id', clinicId).single();
  
  if (!hc) return [];

  const { data, error } = await supabase
    .from('tratamientos')
    .select('*, usuarios(nombre)')
    .eq('historia_clinica_id', hc.id)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createTreatment = async (pacienteId, treatmentData, clinicId) => {
  const { data: hc } = await supabase.from('historias_clinicas').select('id').eq('paciente_id', pacienteId).eq('clinic_id', clinicId).single();
  if (!hc) throw new Error("Historia clínica no encontrada");

  const { data, error } = await supabase
    .from('tratamientos')
    .insert([{ ...treatmentData, historia_clinica_id: hc.id, clinic_id: clinicId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTreatment = async (id, treatmentData, clinicId) => {
  const { data, error } = await supabase
    .from('tratamientos')
    .update(treatmentData)
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (error) throw error;
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
