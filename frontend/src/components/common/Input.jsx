export default function Input({
  label,
  id,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  className = "",
  ...rest
}) {
  const inputId = id || name;

  return (
    <div className={`form-field ${error ? "has-error" : ""} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required-mark">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon" aria-hidden="true">
            <Icon size={18} />
          </span>
        )}
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`form-input ${Icon ? "with-icon" : ""}`}
          {...rest}
        />
      </div>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : (
        helperText && <p className="form-helper">{helperText}</p>
      )}
    </div>
  );
}

