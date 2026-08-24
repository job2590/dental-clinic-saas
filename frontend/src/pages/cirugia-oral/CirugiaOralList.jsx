import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const CirugiaOralList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      if (!user?.clinic_id) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('oral_surgery_records')
          .select('*')
          .eq('clinic_id', user.clinic_id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setRecords(data || []);
      } catch (err) {
        console.error('Error al cargar expedientes de cirugía oral:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [user?.clinic_id]);

  const filteredRecords = records.filter(r =>
    `${r.patient_name} ${r.surgery_type || ''} ${r.diagnosis || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            <i className="bi bi-scissors text-primary me-2"></i>
            Módulo de Cirugía Oral
          </h3>
          <p className="text-muted mb-0">Historias Clínicas Quirúrgicas, Controles Postoperatorios, Consentimientos y Fotografías</p>
        </div>
        <Link to="/cirugia-oral/nuevo" className="btn btn-primary fw-bold px-4 shadow-sm">
          <i className="bi bi-plus-lg me-2"></i> Nuevo Expediente Quirúrgico
        </Link>
      </div>

      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search text-muted"></i></span>
            <input
              type="text"
              className="form-control border-start-0 ps-0"
              placeholder="Buscar por paciente, tipo de cirugía o diagnóstico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-scissors fs-1 text-secondary opacity-50 d-block mb-2"></i>
              <p className="mb-0">No se encontraron expedientes de cirugía oral.</p>
              <small>Haz clic en "Nuevo Expediente Quirúrgico" para registrar uno.</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th className="ps-4 py-3">Paciente</th>
                    <th className="py-3">Fecha de Cirugía</th>
                    <th className="py-3">Tipo de Cirugía</th>
                    <th className="py-3">Anestesia</th>
                    <th className="py-3 text-center">Consentimiento</th>
                    <th className="pe-4 py-3 text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r.id}>
                      <td className="ps-4 fw-bold text-dark">{r.patient_name}</td>
                      <td>{r.consultation_date ? new Date(r.consultation_date).toLocaleDateString() : '-'}</td>
                      <td>
                        <span className="badge bg-warning text-dark">{r.surgery_type || 'Sin especificar'}</span>
                      </td>
                      <td className="text-muted">{r.anesthesia_used || 'Local'}</td>
                      <td className="text-center">
                        {r.consent_given
                          ? <span className="badge bg-success"><i className="bi bi-shield-check me-1"></i> Firmado</span>
                          : <span className="badge bg-warning text-dark"><i className="bi bi-clock me-1"></i> Pendiente</span>
                        }
                      </td>
                      <td className="pe-4 text-end">
                        <button className="btn btn-sm btn-primary fw-medium" onClick={() => navigate(`/cirugia-oral/editar/${r.id}`)}>
                          <i className="bi bi-folder2-open me-1"></i> Gestionar
                        </button>
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

export default CirugiaOralList;
