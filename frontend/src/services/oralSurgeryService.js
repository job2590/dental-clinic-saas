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

export const getOralSurgeryRecordByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('oral_surgery_records')
    .select('*')
    .eq('patient_id', parseInt(patientId, 10))
    .eq('clinic_id', parseInt(clinicId, 10))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getOralSurgeryRecordByPatient error:', error);
    throw error;
  }
  return data || null;
};

export const saveOralSurgeryRecord = async (recordData, clinicId) => {
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
      .from('oral_surgery_records')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      console.error('saveOralSurgeryRecord update error:', error);
      throw error;
    }
    return data;
  } else {
    const { id, created_at, updated_at, ...insertData } = payload;
    const { data, error } = await supabase
      .from('oral_surgery_records')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('saveOralSurgeryRecord insert error:', error);
      throw error;
    }
    return data;
  }
};

// Controles Postoperatorios
export const getOralSurgeryFollowups = async (oralSurgeryRecordId, clinicId) => {
  const { data, error } = await supabase
    .from('oral_surgery_followups')
    .select('*')
    .eq('oral_surgery_record_id', parseInt(oralSurgeryRecordId, 10))
    .eq('clinic_id', parseInt(clinicId, 10))
    .order('control_number', { ascending: true });

  if (error) {
    console.error('getOralSurgeryFollowups error:', error);
    throw error;
  }
  return data || [];
};

export const addOralSurgeryFollowup = async (followupData, clinicId) => {
  const cleaned = cleanDataForDB(followupData);
  const { id, created_at, ...insertData } = cleaned;

  insertData.clinic_id = parseInt(clinicId, 10);
  if (insertData.oral_surgery_record_id) insertData.oral_surgery_record_id = parseInt(insertData.oral_surgery_record_id, 10);
  if (insertData.patient_id) insertData.patient_id = parseInt(insertData.patient_id, 10);
  if (insertData.control_number) insertData.control_number = parseInt(insertData.control_number, 10) || 1;

  const { data, error } = await supabase
    .from('oral_surgery_followups')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('addOralSurgeryFollowup error:', error);
    throw error;
  }
  return data;
};

// Imágenes de Cirugía Oral
export const getOralSurgeryImages = async (oralSurgeryRecordId, clinicId) => {
  const { data, error } = await supabase
    .from('oral_surgery_record_images')
    .select('*')
    .eq('oral_surgery_record_id', parseInt(oralSurgeryRecordId, 10))
    .eq('clinic_id', parseInt(clinicId, 10))
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getOralSurgeryImages error:', error);
    throw error;
  }
  return data || [];
};

export const uploadOralSurgeryImage = async (file, oralSurgeryRecordId, patientId, clinicId, caption = '') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `surgery_${oralSurgeryRecordId}_${Date.now()}.${fileExt}`;
  const filePath = `clinical-images/${patientId}/oral_surgery/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('radiografias')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data, error: dbError } = await supabase
    .from('oral_surgery_record_images')
    .insert([{
      clinic_id: parseInt(clinicId, 10),
      oral_surgery_record_id: parseInt(oralSurgeryRecordId, 10),
      patient_id: parseInt(patientId, 10),
      image_url: filePath,
      caption: caption
    }])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};

export const deleteOralSurgeryImage = async (imageId, clinicId) => {
  const { error } = await supabase
    .from('oral_surgery_record_images')
    .delete()
    .eq('id', imageId)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
