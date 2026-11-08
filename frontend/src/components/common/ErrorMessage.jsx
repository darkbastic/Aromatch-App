import { AlertCircle, RefreshCw } from "lucide-react";
import Button from "./Button";

export default function ErrorMessage({
  title = "No pudimos completar la solicitud",
  message,
  onRetry,
}) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <div className="error-banner-icon">
        <AlertCircle size={22} />
      </div>
      <div className="error-banner-body">
        <h4 className="error-banner-title">{title}</h4>
        <p className="error-banner-text">{message}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw size={15} />
          <span>Reintentar</span>
        </Button>
      )}
    </div>
  );
}

