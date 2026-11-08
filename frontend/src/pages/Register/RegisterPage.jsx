import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Lock, Mail, Sparkles, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { extractApiError } from "../../utils/helpers";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function RegisterPage() {
  const { register, login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/preferencias" replace />;
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
      errors.username = "El nombre de usuario es obligatorio.";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Ingresa un correo electrónico válido.";
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = "La contraseña debe tener al menos 8 caracteres.";
    }
    if (formData.password !== formData.password_confirm) {
      errors.password_confirm = "Las contraseñas no coinciden.";
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
      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        password: formData.password,
        password_confirm: formData.password_confirm,
      });

      // Inicia sesión automáticamente tras el registro para llevar al usuario a configurar sus notas
      await login({
        username: formData.username.trim(),
        password: formData.password,
      });
      navigate("/preferencias", { replace: true });
    } catch (err) {
      setApiError(
        extractApiError(
          err,
          "No fue posible completar el registro. Revisa los datos ingresados."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page section">
      <div className="container auth-container">
        <div className="auth-card auth-card-wide">
          <div className="auth-header">
            <span className="auth-icon">
              <Sparkles size={22} />
            </span>
            <h1 className="auth-title">Crea tu cuenta en Aromatch</h1>
            <p className="auth-subtitle">
              Únete a nuestra comunidad para guardar tus fragancias favoritas, compartir reseñas y
              descubrir tu perfil olfativo.
            </p>
          </div>

          {apiError && <ErrorMessage title="No se pudo crear la cuenta" message={apiError} />}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-row-2">
              <Input
                label="Nombre de usuario"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ej. camila_aroma"
                icon={User}
                error={fieldErrors.username}
                required
                autoComplete="username"
              />

              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.cl"
                icon={Mail}
                error={fieldErrors.email}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-row-2">
              <Input
                label="Nombre (opcional)"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="Tu nombre"
                autoComplete="given-name"
              />

              <Input
                label="Apellido (opcional)"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Tu apellido"
                autoComplete="family-name"
              />
            </div>

            <div className="form-row-2">
              <Input
                label="Contraseña"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                icon={Lock}
                error={fieldErrors.password}
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirmar contraseña"
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                icon={Lock}
                error={fieldErrors.password_confirm}
                required
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
            >
              Crear mi cuenta
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              ¿Ya tienes cuenta en Aromatch?{" "}
              <Link to="/login" className="auth-link">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

