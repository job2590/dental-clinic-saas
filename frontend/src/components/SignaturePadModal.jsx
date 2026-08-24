import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePadModal = ({ 
  title = "Firma Digital", 
  initialSignature = null, 
  onSave, 
  onClear,
  label = "Firma del Declarante / Odontólogo"
}) => {
  const sigCanvasRef = useRef({});
  const [existingSignature, setExistingSignature] = useState(initialSignature);
  const [penColor, setPenColor] = useState('#000080'); // azul marino formal

  useEffect(() => {
    setExistingSignature(initialSignature);
  }, [initialSignature]);

  const handleClear = () => {
    if (sigCanvasRef.current && sigCanvasRef.current.clear) {
      sigCanvasRef.current.clear();
    }
    setExistingSignature(null);
    if (onClear) onClear();
  };

  const handleSave = () => {
    if (existingSignature && sigCanvasRef.current && sigCanvasRef.current.isEmpty && sigCanvasRef.current.isEmpty()) {
      onSave(existingSignature);
      return;
    }

    if (sigCanvasRef.current && !sigCanvasRef.current.isEmpty()) {
      const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      onSave(dataUrl);
    } else if (existingSignature) {
      onSave(existingSignature);
    }
  };

  return (
    <div className="card border rounded-4 overflow-hidden shadow-sm bg-white">
      <div className="bg-light px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
        <span className="fw-bold text-dark small">
          <i className="bi bi-pen me-2 text-primary"></i>
          {label}
        </span>
        <div className="d-flex align-items-center gap-2">
          <div className="btn-group btn-group-sm me-2" role="group">
            <button 
              type="button" 
              className={`btn ${penColor === '#000080' ? 'btn-primary' : 'btn-outline-secondary'} py-0 px-2 fs-7`}
              onClick={() => setPenColor('#000080')}
              title="Azul"
            >
              Azul
            </button>
            <button 
              type="button" 
              className={`btn ${penColor === '#000000' ? 'btn-dark' : 'btn-outline-secondary'} py-0 px-2 fs-7`}
              onClick={() => setPenColor('#000000')}
              title="Negro"
            >
              Negro
            </button>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-danger border-0 py-0" 
            onClick={handleClear}
          >
            <i className="bi bi-eraser me-1"></i> Limpiar
          </button>
        </div>
      </div>

      <div className="p-3 text-center bg-white position-relative">
        {existingSignature ? (
          <div className="position-relative d-inline-block">
            <img 
              src={existingSignature} 
              alt={title} 
              className="img-fluid border rounded p-2" 
              style={{ maxHeight: '160px', width: '100%', objectFit: 'contain' }} 
            />
            <div className="mt-2 text-success small fw-semibold">
              <i className="bi bi-check-circle-fill me-1"></i> Firma capturada previamente
            </div>
            <button 
              type="button" 
              className="btn btn-sm btn-warning mt-2" 
              onClick={() => setExistingSignature(null)}
            >
              <i className="bi bi-pencil me-1"></i> Re-firmar
            </button>
          </div>
        ) : (
          <div>
            <SignatureCanvas 
              ref={sigCanvasRef}
              penColor={penColor}
              canvasProps={{
                className: 'w-100 border rounded bg-light',
                style: { height: '160px', cursor: 'crosshair', touchAction: 'none' }
              }} 
            />
            <div className="text-muted small mt-1">
              <i className="bi bi-hand-index me-1"></i> Dibuja la firma en el cuadro usando el ratón o pantalla táctil
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignaturePadModal;
