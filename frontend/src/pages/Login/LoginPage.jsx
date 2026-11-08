import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock, Sparkles, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { extractApiError } from "../../utils/helpers";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectPath = location.state?.from?.pathname || "/";

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.username.trim()) {
      errors.username = "Ingresa tu nombre de usuario.";
    }
    if (!formData.password) {
      errors.password = "Ingresa tu contraseña.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setApiError(
        extractApiError(
          err,
          "Credenciales inválidas. Verifica tu nombre de usuario y contraseña."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page section">
      <div className="container auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-icon">
              <Sparkles size={22} />
            </span>
            <h1 className="auth-title">Bienvenido a Aromatch</h1>
            <p className="auth-subtitle">
              Inicia sesión para acceder a tus favoritos, preferencias olfativas y recomendaciones
              personalizadas.
            </p>
          </div>

          {apiError && <ErrorMessage title="Error de autenticación" message={apiError} />}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <Input
              label="Nombre de usuario o correo electrónico"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Ej. admin o tu@correo.com"
              icon={User}
              error={fieldErrors.username}
              required
              autoComplete="username"
            />

            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña"
              icon={Lock}
              error={fieldErrors.password}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              ¿Aún no tienes una cuenta en Aromatch?{" "}
              <Link to="/registro" className="auth-link">
                Crear una cuenta gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

