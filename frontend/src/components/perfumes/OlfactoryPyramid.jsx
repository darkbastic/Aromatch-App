import { Link } from "react-router-dom";
import { Droplets, Flame, Wind } from "lucide-react";

export default function OlfactoryPyramid({ pyramid }) {
  const topNotes = pyramid?.top || [];
  const heartNotes = pyramid?.heart || [];
  const baseNotes = pyramid?.base || [];

  const tiers = [
    {
      key: "top",
      title: "Notas de Salida",
      subtitle: "Primera impresión volátil y luminosa (primeros 15 min)",
      icon: Wind,
      notes: topNotes,
      tierClass: "pyramid-tier-top",
    },
    {
      key: "heart",
      title: "Notas de Corazón",
      subtitle: "El alma e identidad central de la fragancia (2 a 4 horas)",
      icon: Droplets,
      notes: heartNotes,
      tierClass: "pyramid-tier-heart",
    },
    {
      key: "base",
      title: "Notas de Fondo",
      subtitle: "Estela profunda, fijación y memoria en la piel (6+ horas)",
      icon: Flame,
      notes: baseNotes,
      tierClass: "pyramid-tier-base",
    },
  ];

  return (
    <section className="olfactory-pyramid">
      <div className="pyramid-header">
        <span className="section-eyebrow">Arquitectura Aromática</span>
        <h2 className="section-title">Pirámide Olfativa</h2>
        <p className="section-subtitle">
          Explora la evolución de esta creación desde su apertura fresca hasta su secado profundo.
        </p>
      </div>

      <div className="pyramid-visual">
        {tiers.map((tier) => {
          const IconComponent = tier.icon;
          return (
            <div key={tier.key} className={`pyramid-tier ${tier.tierClass}`}>
              <div className="pyramid-tier-info">
                <div className="pyramid-tier-icon">
                  <IconComponent size={20} />
                </div>
                <div>
                  <h3 className="pyramid-tier-title">{tier.title}</h3>
                  <p className="pyramid-tier-subtitle">{tier.subtitle}</p>
                </div>
              </div>

              <div className="pyramid-tier-notes">
                {tier.notes.length > 0 ? (
                  tier.notes.map((note) => (
                    <Link
                      key={note.id}
                      to={`/catalogo?note=${note.id}`}
                      className="pyramid-note-pill"
                      title={
                        note.description ||
                        `Ver perfumes con nota de ${note.name}`
                      }
                    >
                      <span className="pyramid-note-name">{note.name}</span>
                      {note.family && (
                        <span className="pyramid-note-family">{note.family}</span>
                      )}
                    </Link>
                  ))
                ) : (
                  <span className="pyramid-note-empty">
                    No registradas en esta fase
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

