import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Heart,
  LogOut,
  Mail,
  MessageSquare,
  Save,
  Shield,
  SlidersHorizontal,
  Sparkles,
  User,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useFavorites } from "../../hooks/useFavorites";
import { reviewsService } from "../../services/reviewsService";
import { extractApiError, formatDate } from "../../utils/helpers";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import ErrorMessage from "../../components/common/ErrorMessage";
import ReviewCard from "../../components/reviews/ReviewCard";

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  const [myReviews, setMyReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
    }
  }, [user]);

  const fetchMyReviews = useCallback(async () => {
    setLoadingReviews(true);
    try {
      const data = await reviewsService.getMyReviews();
      const list = Array.isArray(data) ? data : data.results || [];
      setMyReviews(list);
    } catch {
      setMyReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  }, []);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(null);
    setSaving(true);
    try {
      await updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
      });
      setSaveSuccess("Tu perfil ha sido actualizado correctamente.");
    } catch (err) {
      setSaveError(extractApiError(err, "No fue posible actualizar tu perfil."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMyReview = async (reviewId) => {
    if (!window.confirm("¿Deseas eliminar esta reseña?")) return;
    try {
      await reviewsService.deleteReview(reviewId);
      setMyReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      setSaveError(extractApiError(err, "No fue posible eliminar la reseña."));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="profile-page section">
      <div className="container">
        <div className="page-header">
          <span className="section-eyebrow">Espacio Personal</span>
          <h1 className="page-title">Mi Perfil Olfativo</h1>
          <p className="page-subtitle">
            Administra tus datos personales, consulta tus reseñas publicadas y accede rápidamente a
            tu colección.
          </p>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div className="profile-shortcuts-grid">
          {user?.is_staff && (
            <Link to="/admin" className="profile-shortcut-card">
              <Shield size={22} color="#B89B69" />
              <div>
                <strong>Panel de Administración</strong>
                <span>Gestionar catálogo y sistema</span>
              </div>
            </Link>
          )}

          <Link to="/favoritos" className="profile-shortcut-card">
            <Heart size={22} color="#B89B69" />
            <div>
              <strong>Mis Favoritos</strong>
              <span>{favorites.length} fragancias guardadas</span>
            </div>
          </Link>

          <Link to="/preferencias" className="profile-shortcut-card">
            <SlidersHorizontal size={22} color="#B89B69" />
            <div>
              <strong>Preferencias Olfativas</strong>
              <span>Configurar mis notas favoritas</span>
            </div>
          </Link>

          <Link to="/recomendaciones" className="profile-shortcut-card">
            <Sparkles size={22} color="#B89B69" />
            <div>
              <strong>Recomendaciones</strong>
              <span>Descubrir mi afinidad olfativa</span>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="profile-shortcut-card logout-card"
          >
            <LogOut size={22} />
            <div>
              <strong>Cerrar Sesión</strong>
              <span>Finalizar sesión de forma segura</span>
            </div>
          </button>
        </div>

        <div className="profile-main-grid">
          {/* FORMULARIO DE ACTUALIZACIÓN DE PERFIL */}
          <section className="profile-card">
            <div className="profile-card-header">
              <div className="profile-avatar-large">
                <User size={28} />
              </div>
              <div>
                <h2>@{user?.username}</h2>
                <span className="profile-joined">
                  <Calendar size={14} />
                  <span>Miembro desde {formatDate(user?.date_joined)}</span>
                </span>
              </div>
            </div>

            {saveError && <ErrorMessage message={saveError} />}
            {saveSuccess && (
              <div className="success-banner" role="status">
                {saveSuccess}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="profile-form">
              <Input
                label="Nombre de usuario (solo lectura)"
                name="username"
                value={user?.username || ""}
                disabled
                icon={User}
              />

              <div className="form-row-2">
                <Input
                  label="Nombre"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                />

                <Input
                  label="Apellido"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Tu apellido"
                />
              </div>

              <Input
                label="Correo electrónico"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                icon={Mail}
                required
              />

              <Button type="submit" variant="primary" loading={saving}>
                <Save size={16} />
                <span>Guardar cambios</span>
              </Button>
            </form>
          </section>

          {/* MIS RESEÑAS PUBLICADAS */}
          <section className="profile-card">
            <div className="profile-reviews-header">
              <MessageSquare size={20} color="#B89B69" />
              <h2>Mis Reseñas Publicadas ({myReviews.length})</h2>
            </div>

            {loadingReviews ? (
              <p className="muted-text">Cargando tus reseñas...</p>
            ) : myReviews.length > 0 ? (
              <div className="reviews-list">
                {myReviews.map((rev) => (
                  <ReviewCard
                    key={rev.id}
                    review={rev}
                    currentUserId={user?.id}
                    onDelete={handleDeleteMyReview}
                    showPerfumeLink
                  />
                ))}
              </div>
            ) : (
              <div className="reviews-empty-box">
                <h4>Aún no has escrito reseñas</h4>
                <p>
                  Visita la ficha de cualquier perfume del catálogo para calificarlo y compartir tu
                  opinión con la comunidad.
                </p>
                <Link to="/catalogo" className="btn btn-outline btn-sm">
                  Explorar perfumes
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

