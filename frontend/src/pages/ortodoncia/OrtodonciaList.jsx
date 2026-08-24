import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { 
  generateOrthodonticPdf, 
  generateOrthodonticConsentPdf 
} from '../../services/specialtyPdfService';
import { getPatientById } from '../../services/patientService';

const OrtodonciaList = () => {
  const { user, clinic } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecords = async () => {
    if (!user?.clinic_id) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orthodontic_records')
        .select('*')
        .eq('clinic_id', user.clinic_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      console.error('Error al cargar fichas de ortodoncia:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [user?.clinic_id]);

  const handleExportHistoryPdf = async (record) => {
    try {
      const patient = await getPatientById(record.patient_id, user.clinic_id);
      await generateOrthodonticPdf(record, patient, clinic);
    } catch (err) {
      console.error('Error al exportar historial PDF:', err);
    }
  };

  const handleExportConsentPdf = async (record) => {
    try {
      const patient = await getPatientById(record.patient_id, user.clinic_id);
      await generateOrthodonticConsentPdf(patient, clinic, record.tutor_name);
    } catch (err) {
      console.error('Error al exportar consentimiento PDF:', err);
    }
  };

  const filteredRecords = records.filter(r => 
    `${r.patient_name} ${r.diagnosis || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            <i className="bi bi-activity text-primary me-2"></i>
            Módulo de Ortodoncia
          </h3>
          <p className="text-muted mb-0">Gestión de Fichas de Ortodoncia, Evaluaciones Clínicas y Documentos</p>
        </div>
        <Link to="/ortodoncia/nuevo" className="btn btn-primary fw-bold px-4 shadow-sm">
          <i className="bi bi-plus-lg me-2"></i> Nueva Ficha de Ortodoncia
        </Link>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-0" 
              placeholder="Buscar por paciente o diagnóstico..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-folder2-open fs-1 text-secondary opacity-50 d-block mb-2"></i>
              <p className="mb-0">No se encontraron fichas de ortodoncia.</p>
              <small>Haz clic en "Nueva Ficha de Ortodoncia" para registrar una.</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="ps-4 py-3">Paciente</th>
                    <th className="py-3">Fecha Consulta</th>
                    <th className="py-3">Perfil / Oclusión</th>
                    <th className="py-3">Sonrisa</th>
                    <th className="py-3">Diagnóstico</th>
                    <th className="pe-4 py-3 text-end">Documentos y Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r.id}>
                      <td className="ps-4 fw-bold text-dark">{r.patient_name}</td>
                      <td>{r.consultation_date ? new Date(r.consultation_date).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className="badge bg-light text-dark border me-1">{r.profile || 'Perfil N/A'}</span>
                        <span className="badge bg-light text-dark border">{r.molar_relation || 'Clase N/A'}</span>
                      </td>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-dark border border-info border-opacity-25">
                          Sonrisa {r.smile_type || 'Media'}
                        </span>
                      </td>
                      <td className="text-truncate max-w-200" title={r.diagnosis}>{r.diagnosis || 'Sin diagnóstico'}</td>
                      <td className="pe-4 text-end">
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary" 
                            title="Descargar Historial de Ortodoncia PDF"
                            onClick={() => handleExportHistoryPdf(r)}
                          >
                            <i className="bi bi-file-earmark-medical me-1"></i> Historial PDF
                          </button>
                          <button 
                            className="btn btn-outline-danger" 
                            title="Descargar Consentimiento Informado PDF"
                            onClick={() => handleExportConsentPdf(r)}
                          >
                            <i className="bi bi-file-earmark-check me-1"></i> Consentimiento PDF
                          </button>
                          <button 
                            className="btn btn-primary"
                            onClick={() => navigate(`/ortodoncia/editar/${r.id}`)}
                            title="Editar Ficha"
                          >
                            <i className="bi bi-pencil me-1"></i> Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrtodonciaList;
