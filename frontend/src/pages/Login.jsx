import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    const { data, error: loginError } = await login(email, password, rememberMe);
    
    if (loginError) {
      setError(loginError.message);
    } else if (data?.user) {
      if (data.user.role === 'superadmin') {
        navigate('/superadmin/dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center vh-100">
      <div className="login-card p-5 shadow-lg rounded">
        <div className="text-center mb-4">
          <h2 className="fw-bold text-primary">Dental Clinic</h2>
          <h4 className="fw-light text-secondary">Amanecer</h4>
        </div>
        
        {error && <div className="alert alert-danger py-2 small">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold text-muted small">Correo Electrónico</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-person-fill text-primary"></i>
              </span>
              <input 
                type="email" 
                className="form-control border-start-0 bg-light" 
                placeholder="usuario@clinica.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="form-label fw-semibold text-muted small">Contraseña</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-lock-fill text-primary"></i>
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                className="form-control border-start-0 border-end-0 bg-light" 
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button 
                type="button"
                className="input-group-text bg-light border-start-0"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'} text-secondary`}></i>
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="form-check">
              <input 
                type="checkbox" 
                className="form-check-input shadow-none" 
                id="rememberMe" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <label className="form-check-label text-muted small" htmlFor="rememberMe">
                Recordarme
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100 py-2 fw-bold text-white shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Ingresando...</>
            ) : (
              "Ingresar al Sistema"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
