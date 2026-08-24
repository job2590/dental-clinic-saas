import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getSecureUrl } from '../services/storageService';

const ClinicalImageGallery = ({ 
  images = [], 
  onUpload, 
  onDelete, 
  bucketName = 'radiografias',
  loading = false,
  title = "Imágenes Clínicas y Exámenes Complementarios"
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [secureUrls, setSecureUrls] = useState({});
  const [activeImage, setActiveImage] = useState(null); // lightbox

  useEffect(() => {
    const fetchSignedUrls = async () => {
      const urls = {};
      for (const img of images) {
        if (img.image_url) {
          const url = await getSecureUrl(bucketName, img.image_url);
          urls[img.id] = url || img.image_url;
        }
      }
      setSecureUrls(urls);
    };
    if (images.length > 0) {
      fetchSignedUrls();
    }
  }, [images, bucketName]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      Swal.fire('Atención', 'Por favor selecciona un archivo de imagen.', 'warning');
      return;
    }

    try {
      setUploading(true);
      await onUpload(selectedFile, caption);
      setSelectedFile(null);
      setCaption('');
      // reset file input
      const fileInput = document.getElementById('clinicalImageFileInput');
      if (fileInput) fileInput.value = '';
      Swal.fire({ title: '¡Imagen Subida!', icon: 'success', timer: 1500, showConfirmButton: false });
    } catch (error) {
      console.error('Error al subir imagen:', error);
      Swal.fire('Error', 'No se pudo subir la imagen.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = async (imageId) => {
    const result = await Swal.fire({
      title: '¿Eliminar imagen?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await onDelete(imageId);
        Swal.fire({ title: '¡Eliminada!', icon: 'success', timer: 1200, showConfirmButton: false });
      } catch (error) {
        console.error('Error eliminando imagen:', error);
        Swal.fire('Error', 'No se pudo eliminar la imagen.', 'error');
      }
    }
  };

  return (
    <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
      <div className="card-header bg-light py-3 border-0 d-flex justify-content-between align-items-center">
        <h6 className="fw-bold text-primary mb-0">
          <i className="bi bi-images me-2"></i>
          {title}
        </h6>
        <span className="badge bg-primary rounded-pill">{images.length} imágenes</span>
      </div>

      <div className="card-body p-4 bg-white">
        {/* Formulario de Carga */}
        <form onSubmit={handleUploadSubmit} className="bg-light p-3 rounded-4 mb-4 border">
          <div className="row g-3 align-items-end">
            <div className="col-md-5">
              <label className="form-label text-muted fw-semibold small mb-1">Seleccionar Fotografía / Radiografía / Modelo</label>
              <input 
                id="clinicalImageFileInput"
                type="file" 
                className="form-control" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={uploading} 
              />
            </div>
            <div className="col-md-5">
              <label className="form-label text-muted fw-semibold small mb-1">Descripción / Etiqueta</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="Ej. Fotografía intraoral frontal / Radiografía panorámica inicial" 
                value={caption} 
                onChange={(e) => setCaption(e.target.value)}
                disabled={uploading}
              />
            </div>
            <div className="col-md-2">
              <button 
                type="submit" 
                className="btn btn-primary w-100 fw-semibold"
                disabled={uploading || !selectedFile}
              >
                {uploading ? (
                  <><span className="spinner-border spinner-border-sm me-1"></span> Subiendo...</>
                ) : (
                  <><i className="bi bi-cloud-upload me-1"></i> Subir</>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Galería de Imágenes */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-5 text-muted bg-light rounded-4 border border-dashed">
            <i className="bi bi-camera fs-1 d-block mb-2 text-secondary opacity-50"></i>
            <p className="mb-0">No se han adjuntado imágenes clínicas aún.</p>
            <small>Sube fotografías, radiografías o escaneos para este expediente.</small>
          </div>
        ) : (
          <div className="row g-3">
            {images.map((img) => (
              <div key={img.id} className="col-6 col-md-4 col-lg-3">
                <div className="card h-100 border shadow-sm rounded-4 overflow-hidden position-relative group-hover">
                  <div 
                    className="bg-dark text-center d-flex align-items-center justify-content-center overflow-hidden position-relative" 
                    style={{ height: '160px', cursor: 'pointer' }}
                    onClick={() => setActiveImage(secureUrls[img.id] || img.image_url)}
                  >
                    {secureUrls[img.id] ? (
                      <img 
                        src={secureUrls[img.id]} 
                        alt={img.caption || 'Imagen Clínica'} 
                        className="w-100 h-100 object-fit-cover transition-all"
                      />
                    ) : (
                      <div className="spinner-border spinner-border-sm text-light"></div>
                    )}
                    <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-75 text-white p-1 text-center small text-truncate px-2">
                      <i className="bi bi-zoom-in me-1"></i> Ampliar
                    </div>
                  </div>

                  <div className="card-body p-2 d-flex flex-column justify-content-between">
                    <p className="card-text small text-dark fw-medium text-truncate mb-1" title={img.caption}>
                      {img.caption || 'Sin descripción'}
                    </p>
                    <div className="d-flex justify-content-between align-items-center text-muted fs-7">
                      <span>{new Date(img.created_at).toLocaleDateString()}</span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger border-0 p-1 py-0"
                        title="Eliminar imagen"
                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(img.id); }}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Lightbox para ampliado */}
      {activeImage && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-90 z-3 d-flex align-items-center justify-content-center p-3"
          onClick={() => setActiveImage(null)}
        >
          <div className="position-relative max-w-100 max-h-100">
            <button 
              className="btn btn-close btn-close-white position-absolute top-0 end-0 m-3 z-3"
              onClick={() => setActiveImage(null)}
            ></button>
            <img 
              src={activeImage} 
              alt="Vista ampliada" 
              className="img-fluid rounded-3 shadow-lg"
              style={{ maxHeight: '85vh', objectFit: 'contain' }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicalImageGallery;
