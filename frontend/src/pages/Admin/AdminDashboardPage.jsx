import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  Droplets,
  FlaskConical,
  PlusCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { catalogService } from "../../services/catalogService";
import { useAuth } from "../../hooks/useAuth";
import { extractApiError } from "../../utils/helpers";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_perfumes: 0,
    total_brands: 0,
    total_notes: 0,
    total_admins: 0,
  });
  const [recentPerfumes, setRecentPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, perfumesData] = await Promise.all([
        adminService.getDashboardStats(),
        catalogService.getPerfumes({ ordering: "-created_at", page: 1 }),
      ]);
      setStats({
        total_perfumes: statsData.total_perfumes ?? 0,
        total_brands: statsData.total_brands ?? 0,
        total_notes: statsData.total_notes ?? 0,
        total_admins: statsData.total_admins ?? 0,
      });
      const list = Array.isArray(perfumesData)
        ? perfumesData
        : perfumesData.results || [];
      setRecentPerfumes(list.slice(0, 5));
    } catch (err) {
      setError(
        extractApiError(
          err,
          "No fue posible cargar las métricas reales del panel administrativo."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return <Loader message="Consultando estadísticas reales del catálogo..." />;
  }

  return (
    <div className="admin-dashboard">
      {error && <ErrorMessage message={error} onRetry={loadDashboard} />}

      {/* TARJETAS ESTADÍSTICAS REALES */}
      <section className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <FlaskConical size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total de Perfumes</span>
            <strong className="admin-stat-value">{stats.total_perfumes}</strong>
            <Link to="/admin/perfumes" className="admin-stat-link">
              <span>Gestionar perfumes</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <Award size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Total de Marcas</span>
            <strong className="admin-stat-value">{stats.total_brands}</strong>
            <Link to="/admin/marcas" className="admin-stat-link">
              <span>Gestionar marcas</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <Droplets size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Notas Olfativas</span>
            <strong className="admin-stat-value">{stats.total_notes}</strong>
            <Link to="/admin/notas" className="admin-stat-link">
              <span>Gestionar notas</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <ShieldCheck size={24} />
          </div>
          <div className="admin-stat-info">
            <span className="admin-stat-label">Administradores</span>
            <strong className="admin-stat-value">{stats.total_admins}</strong>
            {user?.is_superuser ? (
              <Link to="/admin/administradores" className="admin-stat-link">
                <span>Gestionar cuentas</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <span className="admin-stat-muted">Equipo activo de curaduría</span>
            )}
          </div>
        </div>
      </section>

      {/* ACCESOS RÁPIDOS DE CREACIÓN */}
      <section className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h2 className="admin-panel-title">Accesos Rápidos</h2>
            <p className="admin-panel-subtitle">
              Inicia directamente el registro de nuevos elementos en la base de datos.
            </p>
          </div>
        </div>

        <div className="admin-quick-actions">
          <Link to="/admin/perfumes?action=new" className="admin-quick-btn">
            <PlusCircle size={20} color="#B89B69" />
            <div>
              <strong>Crear Perfume</strong>
              <span>Registrar nueva fragancia y su pirámide olfativa</span>
            </div>
          </Link>

          <Link to="/admin/marcas?action=new" className="admin-quick-btn">
            <PlusCircle size={20} color="#B89B69" />
            <div>
              <strong>Crear Marca</strong>
              <span>Incorporar una nueva casa perfumista al catálogo</span>
            </div>
          </Link>

          <Link to="/admin/notas?action=new" className="admin-quick-btn">
            <PlusCircle size={20} color="#B89B69" />
            <div>
              <strong>Crear Nota Olfativa</strong>
              <span>Agregar un nuevo ingrediente y su familia aromática</span>
            </div>
          </Link>

          {user?.is_superuser && (
            <Link
              to="/admin/administradores?action=new"
              className="admin-quick-btn super-quick-btn"
            >
              <ShieldCheck size={20} color="#B89B69" />
              <div>
                <strong>Crear Administrador</strong>
                <span>Otorgar acceso de gestión de catálogo a un nuevo miembro</span>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ÚLTIMOS PERFUMES EN EL CATÁLOGO */}
      <section className="admin-panel-card">
        <div className="admin-panel-header">
          <div>
            <h2 className="admin-panel-title">Últimas Fragancias Registradas</h2>
            <p className="admin-panel-subtitle">
              Vista rápida de los perfumes más recientes en el catálogo de Aromatch.
            </p>
          </div>
          <Link to="/admin/perfumes" className="btn btn-outline btn-sm">
            Ver todos los perfumes
          </Link>
        </div>

        {recentPerfumes.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Perfume</th>
                  <th>Marca</th>
                  <th>Concentración</th>
                  <th>Género</th>
                  <th>Calificación</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentPerfumes.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>{p.brand?.name}</td>
                    <td>
                      <span className="admin-table-badge">
                        {p.concentration_display || p.concentration}
                      </span>
                    </td>
                    <td>{p.gender_display || p.gender}</td>
                    <td>
                      {p.average_rating !== null && p.average_rating !== undefined ? (
                        <span className="admin-rating-inline">
                          <Star size={14} fill="#B89B69" color="#B89B69" />
                          <strong>{Number(p.average_rating).toFixed(1)}</strong>
                          <small>({p.reviews_count || 0})</small>
                        </span>
                      ) : (
                        <span className="muted-text">Sin reseñas</span>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="admin-row-actions">
                        <Link
                          to={`/perfume/${p.id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          Ver ficha
                        </Link>
                        <Link
                          to={`/admin/perfumes?edit=${p.id}`}
                          className="btn btn-outline btn-sm"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted-text">No hay perfumes registrados todavía.</p>
        )}
      </section>
    </div>
  );
}

