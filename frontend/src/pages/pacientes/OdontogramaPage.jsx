import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Tooth from '../../components/odontograma/Tooth';
import { getPatientById } from '../../services/patientService';
import { getOdontogramByPatient, saveOdontogram } from '../../services/odontogramService';
import { useAuth } from '../../context/AuthContext';

// Herramientas y sus propiedades
const TOOLS = [
  { id: 'Sano', label: 'Sano (Cara)', type: 'face', color: '#ffffff', icon: 'bi-eraser' },
  { id: 'Caries', label: 'Caries', type: 'face', color: '#dc3545', icon: 'bi-record-circle-fill' },
  { id: 'Fractura', label: 'Fractura', type: 'face', color: '#ffc107', icon: 'bi-lightning-fill' },
  { id: 'Sano_Gen', label: 'Sano (Diente)', type: 'general', color: '#ffffff', icon: 'bi-arrow-counterclockwise' },
  { id: 'Corona', label: 'Corona', type: 'general', color: '#0d6efd', icon: 'bi-shield-fill' },
  { id: 'Implante', label: 'Implante', type: 'general', color: '#6f42c1', icon: 'bi-nut-fill' },
  { id: 'Endodoncia', label: 'Endodoncia', type: 'general', color: '#fd7e14', icon: 'bi-capsule' },
  { id: 'Prótesis', label: 'Prótesis', type: 'general', color: '#198754', icon: 'bi-bounding-box' },
  { id: 'Ausente', label: 'Ausente', type: 'general', color: '#212529', icon: 'bi-x-lg' },
  { id: 'Extracción', label: 'Extracción', type: 'general', color: '#842029', icon: 'bi-x-square-fill' }
];

// Nomenclatura FDI
const ROW_TOP_LEFT = [18, 17, 16, 15, 14, 13, 12, 11];
const ROW_TOP_RIGHT = [21, 22, 23, 24, 25, 26, 27, 28];
const ROW_BOTTOM_LEFT = [48, 47, 46, 45, 44, 43, 42, 41];
const ROW_BOTTOM_RIGHT = [31, 32, 33, 34, 35, 36, 37, 38];

const OdontogramaPage = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [teeth, setTeeth] = useState({});
  const [activeTool, setActiveTool] = useState(TOOLS[1]); // Caries por defecto
  const [saveStatus, setSaveStatus] = useState(''); // '', 'Guardando...', 'Guardado'

  // Inicializar estado base de los 32 dientes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const pData = await getPatientById(id, user.clinic_id);
        setPatient(pData);
        
        const storedOdo = await getOdontogramByPatient(id, user.clinic_id);
        if (storedOdo && storedOdo.dientes) {
          setTeeth(storedOdo.dientes);
        } else {
          // Generar base si no existe
          const base = {};
          [...ROW_TOP_LEFT, ...ROW_TOP_RIGHT, ...ROW_BOTTOM_LEFT, ...ROW_BOTTOM_RIGHT].forEach(num => {
            base[num] = {
              numero: num,
              estadoGeneral: 'Sano',
              caras: { top: 'Sano', bottom: 'Sano', left: 'Sano', right: 'Sano', center: 'Sano' }
            };
          });
          setTeeth(base);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Autoguardado con Debounce (1 segundo)
  useEffect(() => {
    if (loading || Object.keys(teeth).length === 0) return;
    
    setSaveStatus('Guardando...');
    const timer = setTimeout(async () => {
      await saveOdontogram(id, teeth, user.clinic_id);
      setSaveStatus('Guardado automáticamente');
      setTimeout(() => setSaveStatus(''), 2000);
    }, 1000);

    return () => clearTimeout(timer);
  }, [teeth, id, loading]);

  const handleFaceClick = (toothNum, faceId) => {
    if (activeTool.type !== 'face') return;
    
    setTeeth(prev => ({
      ...prev,
      [toothNum]: {
        ...prev[toothNum],
        estadoGeneral: 'Sano', // Si editamos una cara, quitamos el estado general de implante/corona si lo hubiera
        caras: {
          ...prev[toothNum].caras,
          [faceId]: activeTool.id === 'Sano' ? 'Sano' : activeTool.id
        }
      }
    }));
  };

  const handleToothClick = (toothNum) => {
    if (activeTool.type !== 'general') return;

    setTeeth(prev => ({
      ...prev,
      [toothNum]: {
        ...prev[toothNum],
        estadoGeneral: activeTool.id === 'Sano_Gen' ? 'Sano' : activeTool.id,
        // Si aplicamos Sano General, limpiamos las caras también
        caras: activeTool.id === 'Sano_Gen' 
          ? { top: 'Sano', bottom: 'Sano', left: 'Sano', right: 'Sano', center: 'Sano' } 
          : prev[toothNum].caras
      }
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  const renderRow = (nums) => (
    <div className="d-flex justify-content-center flex-wrap">
      {nums.map(num => (
        <Tooth 
          key={num} 
          tooth={teeth[num]} 
          onFaceClick={handleFaceClick} 
          onToothClick={handleToothClick}
          isGeneralToolActive={activeTool.type === 'general'}
        />
      ))}
    </div>
  );

  return (
    <div className="container-fluid p-0 max-w-1200">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center">
          <Link to={`/pacientes/${id}`} className="btn btn-light rounded-circle p-2 me-3 shadow-sm border-0 d-flex align-items-center justify-content-center" style={{width:'40px', height:'40px'}}>
            <i className="bi bi-arrow-left text-secondary"></i>
          </Link>
          <div>
            <h3 className="fw-bold text-dark mb-1">Odontograma Interactivo</h3>
            <p className="text-muted mb-0">Paciente: <span className="fw-bold">{patient?.nombre} {patient?.apellido}</span></p>
          </div>
        </div>
        <div className="text-end">
          {saveStatus && (
            <span className={`badge ${saveStatus === 'Guardando...' ? 'bg-warning text-dark' : 'bg-success'} shadow-sm p-2`}>
              {saveStatus === 'Guardando...' ? <span className="spinner-border spinner-border-sm me-1" style={{width:'12px', height:'12px'}}></span> : <i className="bi bi-check-circle-fill me-1"></i>}
              {saveStatus}
            </span>
          )}
        </div>
      </div>

      <div className="row g-4">
        {/* Paleta de Herramientas */}
        <div className="col-12 col-xl-3">
          <div className="card border-0 shadow-sm rounded-4 h-100">
            <div className="card-header bg-white border-bottom pt-4 pb-3">
              <h6 className="fw-bold text-primary mb-0"><i className="bi bi-palette-fill me-2"></i> Herramientas</h6>
              <p className="text-muted small mt-1 mb-0">Selecciona el estado y pinta sobre el diente.</p>
            </div>
            <div className="card-body p-3">
              
              <h6 className="small fw-bold text-secondary text-uppercase mb-3 mt-2">Aplicar a Caras</h6>
              <div className="d-grid gap-2 mb-4">
                {TOOLS.filter(t => t.type === 'face').map(tool => (
                  <button 
                    key={tool.id} 
                    onClick={() => setActiveTool(tool)}
                    className={`btn d-flex justify-content-start align-items-center text-start border ${activeTool.id === tool.id ? 'border-primary shadow-sm bg-primary bg-opacity-10 fw-bold' : 'bg-white text-dark'}`}
                  >
                    <span className="rounded-circle d-inline-block me-3 shadow-sm d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', backgroundColor: tool.id === 'Sano' ? '#fff' : tool.color, border: tool.id === 'Sano' ? '2px solid #ccc' : 'none', color: tool.id === 'Sano' ? '#333' : '#fff' }}>
                       <i className={`bi ${tool.icon} small`}></i>
                    </span>
                    {tool.label}
                  </button>
                ))}
              </div>

              <h6 className="small fw-bold text-secondary text-uppercase mb-3">Aplicar al Diente Completo</h6>
              <div className="d-grid gap-2">
                {TOOLS.filter(t => t.type === 'general').map(tool => (
                  <button 
                    key={tool.id} 
                    onClick={() => setActiveTool(tool)}
                    className={`btn d-flex justify-content-start align-items-center text-start border ${activeTool.id === tool.id ? 'border-primary shadow-sm bg-primary bg-opacity-10 fw-bold' : 'bg-white text-dark'}`}
                  >
                    <span className="rounded-circle d-inline-block me-3 shadow-sm d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px', backgroundColor: tool.id === 'Sano_Gen' ? '#fff' : tool.color, border: tool.id === 'Sano_Gen' ? '2px solid #ccc' : 'none', color: tool.id === 'Sano_Gen' ? '#333' : '#fff' }}>
                      <i className={`bi ${tool.icon} small`}></i>
                    </span>
                    {tool.label}
                  </button>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Grilla FDI Odontograma */}
        <div className="col-12 col-xl-9">
          <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
            <div className="card-body p-4 p-md-5 d-flex flex-column align-items-center justify-content-center">
              
              <div className="odontogram-container" style={{maxWidth: '800px', width: '100%'}}>
                
                {/* Arcada Superior */}
                <div className="text-center mb-3">
                  <span className="badge bg-light text-secondary border px-3 py-2 fw-bold text-uppercase tracking-wide rounded-pill">Arcada Superior</span>
                </div>
                
                <div className="row g-0 mb-5">
                  <div className="col-12 col-md-6 border-end border-2 border-light pe-md-3 mb-3 mb-md-0 d-flex justify-content-center justify-content-md-end">
                    {renderRow(ROW_TOP_LEFT)}
                  </div>
                  <div className="col-12 col-md-6 ps-md-3 d-flex justify-content-center justify-content-md-start">
                    {renderRow(ROW_TOP_RIGHT)}
                  </div>
                </div>

                <hr className="border-light opacity-50 mb-5" />

                {/* Arcada Inferior */}
                <div className="row g-0 mb-3">
                  <div className="col-12 col-md-6 border-end border-2 border-light pe-md-3 mb-3 mb-md-0 d-flex justify-content-center justify-content-md-end">
                    {renderRow(ROW_BOTTOM_LEFT)}
                  </div>
                  <div className="col-12 col-md-6 ps-md-3 d-flex justify-content-center justify-content-md-start">
                    {renderRow(ROW_BOTTOM_RIGHT)}
                  </div>
                </div>

                <div className="text-center mt-3">
                  <span className="badge bg-light text-secondary border px-3 py-2 fw-bold text-uppercase tracking-wide rounded-pill">Arcada Inferior</span>
                </div>

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OdontogramaPage;
