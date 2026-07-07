import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getPatientById } from '../../services/patientService';
import { getRadiographiesByPatient, createRadiography, deleteRadiography } from '../../services/radiographyService';
import { useAuth } from '../../context/AuthContext';

const IMAGE_TYPES = [
  'Panorámica',
  'Periapical',
  'Tomografía',
  'CBCT',
  'Fotografía Clínica',
  'Cefalométrica',
  'Otro'
];

const RadiografiasPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // Imagen entera para el Lightbox

  // Form State
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    tipo: 'Panorámica',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    base64Data: ''
  });
  const [uploadError, setUploadError] = useState('');

  const fetchData = async () => {
    try {
      const pData = await getPatientById(id, user.clinic_id);
      setPatient(pData);
      const imgData = await getRadiographiesByPatient(id, user.clinic_id);
      setImages(imgData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setUploadError('');
    const file = e.target.files[0];
    if (!file) return;

    // Validación básica
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor, selecciona un archivo de imagen válido (JPG, PNG).');
      return;
    }
    
    // Límite conservador para localStorage (1.5 MB aprox por archivo)
    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('Para esta versión de prueba sin base de datos en la nube, las imágenes deben pesar menos de 1.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, base64Data: event.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.base64Data) {
      setUploadError('Debes adjuntar una imagen.');
      return;
    }

    try {
      await createRadiography(id, formData, user.clinic_id);
      setShowUploadModal(false);
      setFormData({
        tipo: 'Panorámica',
        fecha: new Date().toISOString().split('T')[0],
        notas: '',
        base64Data: ''
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchData();
    } catch (_err) {
      setUploadError('Error al guardar. Es posible que el almacenamiento del navegador esté lleno.');
    }
  };

  const handleDelete = async (e, rId) => {
    e.stopPropagation(); // Evitar abrir el lightbox al eliminar
    const result = await Swal.fire({
      title: '¿Eliminar Imagen?',
      text: "Esta acción borrará permanentemente la radiografía o fotografía.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await deleteRadiography(rId, user.clinic_id);
      Swal.fire({ title: '¡Eliminada!', text: 'La imagen ha sido borrada.', icon: 'success', timer: 1500, showConfirmButton: false });
      fetchData();
    }
  };

  const openPreview = (img) => {
    setPreviewImage(img);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      
      {/* Encabezado */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div className="d-flex align-items-center">
          <Link to={`/pacientes/${id}`} className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-1">Centro de Imágenes Clínicas</h3>
            <p className="text-muted mb-0">Paciente: <span className="fw-bold">{patient?.nombre} {patient?.apellido}</span></p>
          </div>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn btn-dark shadow-sm d-flex align-items-center px-4 fw-medium">
          <i className="bi bi-cloud-arrow-up-fill me-2 fs-5"></i> Subir Imagen
        </button>
      </div>

      {/* Galería Visual (Grid) */}
      <div className="row g-4">
        {images.length === 0 ? (
          <div className="col-12 text-center py-5">
            <div className="card border-0 shadow-sm rounded-4 bg-light p-5">
              <i className="bi bi-images display-1 text-secondary opacity-25 mb-3"></i>
              <h5 className="text-muted fw-bold">El expediente radiográfico está vacío</h5>
              <p className="text-muted small mb-4">Sube radiografías panorámicas, periapicales o fotografías clínicas para armar el caso.</p>
              <div>
                <button onClick={() => setShowUploadModal(true)} className="btn btn-primary px-4 fw-medium shadow-sm">
                  <i className="bi bi-upload me-2"></i> Empezar a subir
                </button>
              </div>
            </div>
          </div>
        ) : (
          images.map((img) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={img.id}>
              <div 
                className="card border-0 shadow-sm rounded-4 h-100 overflow-hidden cursor-pointer image-card-hover"
                onClick={() => openPreview(img)}
              >
                <div className="position-relative bg-dark" style={{paddingTop: '75%', overflow: 'hidden'}}>
                  {/* Thumbnail */}
                  <img 
                    src={img.base64Data} 
                    alt={img.tipo}
                    className="position-absolute top-0 start-0 w-100 h-100"
                    style={{objectFit: 'cover', opacity: 0.9, transition: 'transform 0.3s ease'}}
                  />
                  
                  {/* Etiqueta flotante */}
                  <div className="position-absolute top-0 start-0 m-2">
                    <span className="badge bg-dark bg-opacity-75 shadow-sm border border-secondary border-opacity-25 px-2 py-1">
                      {img.tipo}
                    </span>
                  </div>

                  {/* Botón Borrar */}
                  <div className="position-absolute top-0 end-0 m-2">
                    <button 
                      onClick={(e) => handleDelete(e, img.id)}
                      className="btn btn-sm btn-danger rounded-circle p-1 d-flex align-items-center justify-content-center shadow-sm"
                      style={{width: '30px', height: '30px'}}
                      title="Eliminar"
                    >
                      <i className="bi bi-trash-fill small"></i>
                    </button>
                  </div>
                </div>
                
                <div className="card-body p-3 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted fw-bold"><i className="bi bi-calendar-event me-1"></i>{new Date(img.fecha).toLocaleDateString()}</small>
                  </div>
                  <p className="card-text small text-dark mb-0 text-truncate" title={img.notas}>
                    {img.notas || <span className="text-muted fst-italic">Sin observaciones</span>}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox / Previewer */}
      {previewImage && (
        <div className="modal-backdrop bg-black bg-opacity-75 d-flex justify-content-center align-items-center" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1060}}>
          
          <button 
            className="position-absolute top-0 end-0 m-4 btn btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center"
            style={{width: '50px', height: '50px', zIndex: 1061}}
            onClick={() => setPreviewImage(null)}
          >
            <i className="bi bi-x-lg fs-4"></i>
          </button>

          <div className="position-absolute bottom-0 start-0 w-100 p-4 bg-dark bg-opacity-75 text-white" style={{zIndex: 1061}}>
             <h5 className="fw-bold text-white mb-1">{previewImage.tipo} - {new Date(previewImage.fecha).toLocaleDateString()}</h5>
             <p className="mb-0 text-light">{previewImage.notas}</p>
          </div>

          <div className="w-100 h-100 d-flex justify-content-center align-items-center p-md-5" onClick={() => setPreviewImage(null)}>
            <img 
              src={previewImage.base64Data} 
              alt={previewImage.tipo} 
              className="img-fluid rounded shadow-lg"
              style={{maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain', animation: 'zoomIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'}}
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}

      {/* Modal Subida */}
      {showUploadModal && (
        <div className="modal-backdrop bg-dark bg-opacity-50 d-flex justify-content-center align-items-center" style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 1050}}>
          <div className="card border-0 shadow-lg rounded-4 w-100" style={{maxWidth: '550px', animation: 'fadeIn 0.2s ease-out'}}>
            <div className="card-header bg-dark text-white border-bottom-0 p-4 d-flex justify-content-between align-items-center rounded-top-4">
              <h5 className="fw-bold mb-0">
                <i className="bi bi-images me-2"></i> Subir Imagen Clínica
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={() => setShowUploadModal(false)}></button>
            </div>
            
            <div className="card-body p-4 bg-white">
              
              {uploadError && (
                <div className="alert alert-danger bg-danger bg-opacity-10 border-0 rounded-3 text-danger fw-semibold d-flex align-items-center small py-2 px-3 mb-4">
                  <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleSubmit} id="uploadForm">
                <div className="row g-3">
                  
                  {/* Drag and Drop o File Input simple */}
                  <div className="col-12">
                    <label className="form-label text-dark fw-bold mb-2">Seleccionar Archivo (JPG, PNG)</label>
                    <div className="border border-2 border-dashed border-secondary rounded-4 p-4 text-center bg-light">
                      {formData.base64Data ? (
                        <div className="position-relative d-inline-block">
                          <img src={formData.base64Data} alt="Preview" className="img-thumbnail rounded-3 shadow-sm" style={{maxHeight: '120px'}} />
                          <button 
                            type="button" 
                            className="btn btn-sm btn-danger position-absolute top-0 start-100 translate-middle rounded-circle p-1"
                            onClick={() => {
                               setFormData(prev => ({...prev, base64Data: ''}));
                               if(fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          ><i className="bi bi-x"></i></button>
                        </div>
                      ) : (
                        <>
                          <i className="bi bi-cloud-arrow-up text-muted display-4 mb-3"></i>
                          <p className="text-muted small fw-medium mb-3">Haz clic para buscar en tu dispositivo.</p>
                        </>
                      )}
                      
                      <input 
                        type="file" 
                        accept="image/jpeg, image/png"
                        className="form-control mt-2" 
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        style={{display: formData.base64Data ? 'none' : 'block'}}
                      />
                      <small className="text-muted mt-2 d-block">Límite recomendado: 1.5MB (Versión Local)</small>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Tipo de Imagen</label>
                    <select className="form-select bg-light" name="tipo" value={formData.tipo} onChange={handleChange}>
                      {IMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label text-muted small fw-semibold">Fecha de Toma</label>
                    <input type="date" className="form-control bg-light" name="fecha" value={formData.fecha} onChange={handleChange} required />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-muted small fw-semibold">Notas / Diagnóstico</label>
                    <textarea className="form-control bg-light" name="notas" value={formData.notas} onChange={handleChange} rows="2" placeholder="Ej. Pérdida ósea sector anteroinferior..."></textarea>
                  </div>

                </div>
              </form>
            </div>
            
            <div className="card-footer bg-light p-3 d-flex justify-content-end gap-2 border-top-0 rounded-bottom-4">
              <button type="button" className="btn btn-light" onClick={() => setShowUploadModal(false)}>Cancelar</button>
              <button type="submit" form="uploadForm" className="btn btn-dark px-4 fw-medium shadow-sm">
                Guardar en Expediente
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        
        .cursor-pointer { cursor: pointer; }
        .image-card-hover { transition: all 0.3s ease; border: 2px solid transparent !important; }
        .image-card-hover:hover { 
          transform: translateY(-5px); 
          box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important; 
          border-color: #dee2e6 !important;
        }
        .image-card-hover:hover img { transform: scale(1.05); }
      `}</style>
    </div>
  );
};

export default RadiografiasPage;
