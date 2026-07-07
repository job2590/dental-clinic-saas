import { supabase } from '../lib/supabase';

export const getClinicalHistory = async (pacienteId, clinicId) => {
  const { data, error } = await supabase
    .from('historias_clinicas')
    .select('*')
    .eq('paciente_id', pacienteId)
    .eq('clinic_id', clinicId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getClinicalHistory error:', error);
    throw error;
  }
  return data || null;
};

const cleanDataForDB = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    cleaned[key] = value === '' ? null : value;
  }
  return cleaned;
};

export const saveClinicalHistory = async (pacienteId, historyData, clinicId) => {
  // Limpiar campos que no deben ir al insert/update
  const { id: _, clinic_id: __, paciente_id: ___, created_at: ____, ...restData } = historyData;
  const cleanedData = cleanDataForDB(restData);

  const existing = await getClinicalHistory(pacienteId, clinicId);

  if (existing) {
    const { data, error } = await supabase
      .from('historias_clinicas')
      .update(cleanedData)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) { console.error('saveClinicalHistory update error:', error); throw error; }
    return data;
  } else {
    const { data, error } = await supabase
      .from('historias_clinicas')
      .insert([{ ...cleanedData, paciente_id: pacienteId, clinic_id: clinicId }])
      .select()
      .single();
    if (error) { console.error('saveClinicalHistory insert error:', error); throw error; }
    return data;
  }
};
