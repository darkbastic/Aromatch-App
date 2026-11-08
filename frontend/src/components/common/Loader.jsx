export default function Loader({
  message = "Cargando experiencia olfativa...",
  fullScreen = false,
}) {
  return (
    <div className={`loader-container ${fullScreen ? "loader-fullscreen" : ""}`} role="status">
      <div className="loader-ring">
        <div className="loader-ring-inner" />
      </div>
      {message && <p className="loader-text">{message}</p>}
    </div>
  );
}

