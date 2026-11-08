import { Sparkles } from "lucide-react";

export default function EmptyState({
  icon: Icon = Sparkles,
  title = "No se encontraron resultados",
  description = "Intenta ajustar tus criterios de búsqueda o explorar otras notas olfativas.",
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

