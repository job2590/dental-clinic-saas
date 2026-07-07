import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getPatientById, createPatient, updatePatient } from '../../services/patientService';
import { useAuth } from '../../context/AuthContext';

const PacienteForm = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', ci: '', fecha_nacimiento: '', edad: '',
    sexo: '', estado_civil: '', profesion: '',
    direccion: '', ciudad: '', departamento: '',
    celular: '', whatsapp: '', correo: '', contacto_emergencia: '',
    seguro: '', tipo_sangre: '', observaciones: '', foto: ''
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchPatient = async () => {
        try {
          const data = await getPatientById(id, user.clinic_id);
          setFormData(data);
        } catch (error) {
          console.error(error);
          setError('Paciente no encontrado');
        } finally {
          setLoading(false);
        }
      };
      fetchPatient();
    }
  }, [id, isEditMode]);

  // Lógica para edad automática
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'fecha_nacimiento') {
      const computedAge = calculateAge(value);
      setFormData(prev => ({ ...prev, [name]: value, edad: computedAge }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEditMode) {
        await updatePatient(id, formData, user.clinic_id);
      } else {
        await createPatient(formData, user.clinic_id);
      }
      navigate('/pacientes');
    } catch (error) {
      console.error(error);
      setError('Error al guardar el paciente. Verifique los datos.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0 max-w-1000">
      <div className="d-flex align-items-center mb-4">
        <Link to="/pacientes" className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
          <i className="bi bi-arrow-left text-secondary"></i>
        </Link>
        <div>
          <h3 className="fw-bold text-dark mb-1">{isEditMode ? 'Editar Paciente' : 'Registrar Nuevo Paciente'}</h3>
          <p className="text-muted mb-0">{isEditMode ? 'Actualiza la información del paciente' : 'Ingresa los datos para aperturar una nueva ficha'}</p>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm border-0">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4 p-md-5">
            <h5 className="fw-bold text-primary border-bottom pb-3 mb-4">
              <i className="bi bi-person-badge me-2"></i> Datos Personales
            </h5>
            
            <div className="row g-4 mb-4 align-items-end">
              <div className="col-12 col-md-3 text-center">
                <div className="avatar-upload position-relative d-inline-block">
                  <div className="bg-light text-secondary rounded-circle d-flex flex-column align-items-center justify-content-center border" style={{width: '120px', height: '120px', borderStyle: 'dashed !important'}}>
                    {formData.foto ? (
                       <img src={formData.foto} alt="Perfil" className="w-100 h-100 rounded-circle object-fit-cover" />
                    ) : (
                       <><i className="bi bi-camera fs-2"></i><span className="small mt-1">Foto</span></>
                    )}
                  </div>
                  <button type="button" className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 shadow" style={{width:'32px', height:'32px'}} title="Subir foto">
                    <i className="bi bi-pencil-fill"></i>
                  </button>
                </div>
              </div>
              <div className="col-12 col-md-9">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold small">Nombres <span className="text-danger">*</span></label>
                    <input type="text" className="form-control bg-light" name="nombre" value={formData.nombre} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold small">Apellidos <span className="text-danger">*</span></label>
                    <input type="text" className="form-control bg-light" name="apellido" value={formData.apellido} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold small">Documento (CI) <span className="text-danger">*</span></label>
                    <input type="text" className="form-control bg-light" name="ci" value={formData.ci} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted fw-semibold small">Profesión / Ocupación</label>
                    <input type="text" className="form-control bg-light" name="profesion" value={formData.profesion} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Fecha Nacimiento <span className="text-danger">*</span></label>
                <input type="date" className="form-control bg-light" name="fecha_nacimiento" value={formData.fecha_nacimiento} onChange={handleChange} required />
              </div>
              <div className="col-md-2">
                <label className="form-label text-muted fw-semibold small">Edad</label>
                <input type="text" className="form-control" value={formData.edad} readOnly disabled style={{backgroundColor: '#e9ecef'}} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Sexo</label>
                <select className="form-select bg-light" name="sexo" value={formData.sexo} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Estado Civil</label>
                <select className="form-select bg-light" name="estado_civil" value={formData.estado_civil} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4 p-md-5">
            <h5 className="fw-bold text-primary border-bottom pb-3 mb-4">
              <i className="bi bi-geo-alt me-2"></i> Información de Contacto
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Celular</label>
                <input type="text" className="form-control bg-light" name="celular" value={formData.celular} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">WhatsApp</label>
                <input type="text" className="form-control bg-light" name="whatsapp" value={formData.whatsapp} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Correo Electrónico</label>
                <input type="email" className="form-control bg-light" name="correo" value={formData.correo} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted fw-semibold small">Dirección</label>
                <input type="text" className="form-control bg-light" name="direccion" value={formData.direccion} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Ciudad</label>
                <input type="text" className="form-control bg-light" name="ciudad" value={formData.ciudad} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold small">Departamento</label>
                <input type="text" className="form-control bg-light" name="departamento" value={formData.departamento} onChange={handleChange} />
              </div>
            </div>
          </div>
        </div>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4 p-md-5">
            <h5 className="fw-bold text-primary border-bottom pb-3 mb-4">
              <i className="bi bi-clipboard2-pulse me-2"></i> Datos Clínicos Generales
            </h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Contacto de Emergencia</label>
                <input type="text" className="form-control bg-light" name="contacto_emergencia" placeholder="Nombre y Teléfono" value={formData.contacto_emergencia} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Seguro Médico</label>
                <input type="text" className="form-control bg-light" name="seguro" value={formData.seguro} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label text-muted fw-semibold small">Tipo de Sangre</label>
                <select className="form-select bg-light" name="tipo_sangre" value={formData.tipo_sangre} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label text-muted fw-semibold small">Observaciones Generales</label>
                <textarea className="form-control bg-light" name="observaciones" rows="3" value={formData.observaciones} onChange={handleChange}></textarea>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-3 mb-5">
          <Link to="/pacientes" className="btn btn-light px-4 fw-medium shadow-sm">Cancelar</Link>
          <button type="submit" className="btn btn-primary px-5 fw-bold shadow-sm" disabled={saving}>
            {saving ? (
              <><span className="spinner-border spinner-border-sm me-2"></span> Guardando...</>
            ) : (
              <><i className="bi bi-save me-2"></i> {isEditMode ? 'Actualizar Paciente' : 'Registrar Paciente'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PacienteForm;
