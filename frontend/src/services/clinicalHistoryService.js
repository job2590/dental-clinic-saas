import { supabase } from '../lib/supabase';

export const getClinicalHistory = async (pacienteId, clinicId) => {
  const { data, error } = await supabase
    .from('historias_clinicas')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('clinic_id', clinicId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
    throw error;
  }
  return data || null;
};

export const saveClinicalHistory = async (pacienteId, historyData, clinicId) => {
  const existing = await getClinicalHistory(pacienteId, clinicId);

  if (existing) {
    const { data, error } = await supabase
      .from('historias_clinicas')
      .update(historyData)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('historias_clinicas')
      .insert([{ ...historyData, paciente_id: pacienteId, clinic_id: clinicId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
