import { supabase } from '../lib/supabase';

/**
 * Obtiene una URL firmada segura para un archivo en un bucket privado.
 * @param {string} bucket - El nombre del bucket (ej. 'patient-photos', 'radiografias')
 * @param {string} filePath - La ruta/nombre del archivo guardado en la base de datos
 * @param {number} expiresIn - Tiempo de expiración en segundos (default: 3600 = 1 hora)
 * @returns {Promise<string|null>} - La URL firmada o null si hay error
 */
export const getSecureUrl = async (bucket, filePath, expiresIn = 3600) => {
  if (!filePath) return null;
  
  let pathToSign = filePath;
  // Si la ruta ya es una URL completa, extraemos solo el path para firmarlo
  if (filePath.startsWith('http')) {
    const parts = filePath.split(`/public/${bucket}/`);
    if (parts.length > 1) {
      pathToSign = parts[1];
    } else {
      return filePath; // Si no es de este bucket o formato, devolver tal cual
    }
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(pathToSign, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error(`Error obteniendo URL segura para ${filePath} en ${bucket}:`, error);
    return null;
  }
};
