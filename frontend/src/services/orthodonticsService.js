import { supabase } from '../lib/supabase';

const cleanDataForDB = (data) => {
  const cleaned = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === '' || value === undefined) {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
};

export const getOrthodonticRecordsByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('orthodontic_records')
    .select('*')
    .eq('patient_id', patientId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOrthodonticRecordsByPatient error:', error);
    throw error;
  }
  return data || [];
};

export const getOrthodonticRecordById = async (id, clinicId) => {
  const { data, error } = await supabase
    .from('orthodontic_records')
    .select('*')
    .eq('id', id)
    .eq('clinic_id', clinicId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('getOrthodonticRecordById error:', error);
    throw error;
  }
  return data || null;
};

export const saveOrthodonticRecord = async (recordData, clinicId) => {
  const cleaned = cleanDataForDB(recordData);

  if (cleaned.patient_id) cleaned.patient_id = parseInt(cleaned.patient_id, 10);
  if (cleaned.age !== null && cleaned.age !== undefined) cleaned.age = parseInt(cleaned.age, 10) || null;
  if (!cleaned.dentist_id) cleaned.dentist_id = null;
  if (!cleaned.birth_date) cleaned.birth_date = null;
  if (!cleaned.consultation_date) cleaned.consultation_date = new Date().toISOString().split('T')[0];
  if (!cleaned.consent_date) cleaned.consent_date = new Date().toISOString().split('T')[0];

  const payload = { ...cleaned, clinic_id: parseInt(clinicId, 10) };

  if (payload.id) {
    const { id, created_at, updated_at, ...updateData } = payload;
    const { data, error } = await supabase
      .from('orthodontic_records')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      console.error('saveOrthodonticRecord update error:', error);
      throw error;
    }
    return data;
  } else {
    // Omitir id para que PostgreSQL genere el SERIAL correctamente
    const { id, created_at, updated_at, ...insertData } = payload;
    const { data, error } = await supabase
      .from('orthodontic_records')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('saveOrthodonticRecord insert error:', error);
      throw error;
    }
    return data;
  }
};

export const getOrthodonticImages = async (recordId, clinicId) => {
  const { data, error } = await supabase
    .from('orthodontic_record_images')
    .select('*')
    .eq('orthodontic_record_id', recordId)
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOrthodonticImages error:', error);
    throw error;
  }
  return data || [];
};

export const uploadOrthodonticImage = async (file, recordId, patientId, clinicId, caption = '') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `ortho_${recordId}_${Date.now()}.${fileExt}`;
  const filePath = `clinical-images/${patientId}/orthodontics/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('radiografias')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Error subiendo imagen a storage:', uploadError);
    throw uploadError;
  }

  const { data, error: dbError } = await supabase
    .from('orthodontic_record_images')
    .insert([{
      clinic_id: parseInt(clinicId, 10),
      orthodontic_record_id: parseInt(recordId, 10),
      patient_id: parseInt(patientId, 10),
      image_url: filePath,
      caption: caption
    }])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};

export const deleteOrthodonticImage = async (imageId, clinicId) => {
  const { error } = await supabase
    .from('orthodontic_record_images')
    .delete()
    .eq('id', imageId)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
