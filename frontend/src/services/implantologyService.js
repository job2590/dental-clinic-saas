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

export const getImplantRecordByPatient = async (patientId, clinicId) => {
  const { data, error } = await supabase
    .from('implant_records')
    .select('*')
    .eq('patient_id', parseInt(patientId, 10))
    .eq('clinic_id', parseInt(clinicId, 10))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getImplantRecordByPatient error:', error);
    throw error;
  }
  return data || null;
};

export const saveImplantRecord = async (recordData, clinicId) => {
  const cleaned = cleanDataForDB(recordData);

  if (cleaned.patient_id) cleaned.patient_id = parseInt(cleaned.patient_id, 10);
  if (cleaned.age !== null && cleaned.age !== undefined) cleaned.age = parseInt(cleaned.age, 10) || null;
  if (!cleaned.dentist_id) cleaned.dentist_id = null;
  if (!cleaned.consultation_date) cleaned.consultation_date = new Date().toISOString().split('T')[0];
  if (!cleaned.consent_date) cleaned.consent_date = new Date().toISOString().split('T')[0];
  if (cleaned.bone_height_mm !== null) cleaned.bone_height_mm = parseFloat(cleaned.bone_height_mm) || null;
  if (cleaned.bone_width_mm !== null) cleaned.bone_width_mm = parseFloat(cleaned.bone_width_mm) || null;

  const payload = { ...cleaned, clinic_id: parseInt(clinicId, 10) };

  if (payload.id) {
    const { id, created_at, updated_at, ...updateData } = payload;
    const { data, error } = await supabase
      .from('implant_records')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      console.error('saveImplantRecord update error:', error);
      throw error;
    }
    return data;
  } else {
    const { id, created_at, updated_at, ...insertData } = payload;
    const { data, error } = await supabase
      .from('implant_records')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('saveImplantRecord insert error:', error);
      throw error;
    }
    return data;
  }
};

// Evoluciones (Notas de Control)
export const getImplantEvolutionNotes = async (implantRecordId, clinicId) => {
  const { data, error } = await supabase
    .from('implant_evolution_notes')
    .select('*')
    .eq('implant_record_id', parseInt(implantRecordId, 10))
    .eq('clinic_id', parseInt(clinicId, 10))
    .order('visit_date', { ascending: false });

  if (error) {
    console.error('getImplantEvolutionNotes error:', error);
    throw error;
  }
  return data || [];
};

export const addImplantEvolutionNote = async (noteData, clinicId) => {
  const cleaned = cleanDataForDB(noteData);
  const { id, created_at, ...insertData } = cleaned;

  insertData.clinic_id = parseInt(clinicId, 10);
  if (insertData.implant_record_id) insertData.implant_record_id = parseInt(insertData.implant_record_id, 10);
  if (insertData.patient_id) insertData.patient_id = parseInt(insertData.patient_id, 10);
  if (!insertData.dentist_id) insertData.dentist_id = null;

  const { data, error } = await supabase
    .from('implant_evolution_notes')
    .insert([insertData])
    .select()
    .single();

  if (error) {
    console.error('addImplantEvolutionNote error:', error);
    throw error;
  }
  return data;
};

// Plan de Pagos de Implantes
export const getImplantPaymentPlan = async (implantRecordId, patientId, clinicId) => {
  let query = supabase.from('implant_payment_plans').select('*').eq('clinic_id', parseInt(clinicId, 10));
  if (implantRecordId) {
    query = query.eq('implant_record_id', parseInt(implantRecordId, 10));
  } else if (patientId) {
    query = query.eq('patient_id', parseInt(patientId, 10));
  }

  const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (error) {
    console.error('getImplantPaymentPlan error:', error);
    throw error;
  }
  return data || null;
};

export const saveImplantPaymentPlan = async (planData, clinicId) => {
  const cleaned = cleanDataForDB(planData);
  if (cleaned.patient_id) cleaned.patient_id = parseInt(cleaned.patient_id, 10);
  if (cleaned.implant_record_id) cleaned.implant_record_id = parseInt(cleaned.implant_record_id, 10) || null;
  if (cleaned.total_cost !== null) cleaned.total_cost = parseFloat(cleaned.total_cost) || 0;

  const payload = { ...cleaned, clinic_id: parseInt(clinicId, 10) };

  if (payload.id) {
    const { id, created_at, updated_at, ...updateData } = payload;
    const { data, error } = await supabase
      .from('implant_payment_plans')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      console.error('saveImplantPaymentPlan update error:', error);
      throw error;
    }
    return data;
  } else {
    const { id, created_at, updated_at, ...insertData } = payload;
    const { data, error } = await supabase
      .from('implant_payment_plans')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('saveImplantPaymentPlan insert error:', error);
      throw error;
    }
    return data;
  }
};

// Imágenes de Implantología
export const getImplantImages = async (implantRecordId, clinicId) => {
  const { data, error } = await supabase
    .from('implant_record_images')
    .select('*')
    .eq('implant_record_id', parseInt(implantRecordId, 10))
    .eq('clinic_id', parseInt(clinicId, 10))
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getImplantImages error:', error);
    throw error;
  }
  return data || [];
};

export const uploadImplantImage = async (file, implantRecordId, patientId, clinicId, caption = '') => {
  const fileExt = file.name.split('.').pop();
  const fileName = `implant_${implantRecordId}_${Date.now()}.${fileExt}`;
  const filePath = `clinical-images/${patientId}/implantology/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('radiografias')
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data, error: dbError } = await supabase
    .from('implant_record_images')
    .insert([{
      clinic_id: parseInt(clinicId, 10),
      implant_record_id: parseInt(implantRecordId, 10),
      patient_id: parseInt(patientId, 10),
      image_url: filePath,
      caption: caption
    }])
    .select()
    .single();

  if (dbError) throw dbError;
  return data;
};

export const deleteImplantImage = async (imageId, clinicId) => {
  const { error } = await supabase
    .from('implant_record_images')
    .delete()
    .eq('id', imageId)
    .eq('clinic_id', clinicId);

  if (error) throw error;
  return true;
};
