import { useId } from "react";
import { useAuth } from "../../04-hooks/auth";
import { PERMISSIONS } from "../../06-config/permissions";
import "./formField.css";

function normalizeId(value) {
  return String(value || "field").replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  fullWidth = false,
  children,
  aiField,
  className = "",
}) {
  const generatedId = useId();
  const fieldId = htmlFor || `field-${normalizeId(generatedId)}`;
  return (
    <div
      className={`form-field detail-field ${fullWidth ? "full-width" : ""} ${className}`.trim()}
      data-ai-field={aiField ? "true" : undefined}
      data-ai-field-name={aiField?.name || label || undefined}
      data-ai-field-path={aiField?.path || undefined}
      data-ai-company-id={aiField?.companyId || undefined}
      data-ai-detail-key={aiField?.detailKey || undefined}
    >
      {label && <label htmlFor={fieldId}>{label}</label>}
      {children({ fieldId })}
      {hint && <span className="form-field-hint">{hint}</span>}
      {error && <span className="form-field-error">{error}</span>}
    </div>
  );
}

export function TextField(props) {
  const {
    value = "",
    onChange,
    placeholder,
    disabled = false,
    type = "text",
    name,
    ...fieldProps
  } = props;
  const { can } = useAuth();
  const aiField = fieldProps.aiField;
  const isNewRecord = String(aiField?.path || "").startsWith("new.");
  const permissionDisabled = Boolean(aiField) && (
    (!can(PERMISSIONS.UPDATE_COMPANY) && !isNewRecord)
    || (aiField.path === "company.name" && !can(PERMISSIONS.RENAME_COMPANY))
  );
  return (
    <FormField {...fieldProps}>
      {({ fieldId }) => (
        <input
          id={fieldId}
          name={name}
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          disabled={disabled || permissionDisabled}
          onChange={onChange}
        />
      )}
    </FormField>
  );
}

export function DateField(props) {
  return <TextField {...props} type="date" />;
}

export function NumberField(props) {
  const { min, max, step, ...rest } = props;
  return <TextField {...rest} type="number" min={min} max={max} step={step} />;
}

export function TextAreaField(props) {
  const {
    value = "",
    onChange,
    placeholder,
    disabled = false,
    rows = 4,
    name,
    ...fieldProps
  } = props;
  const { can } = useAuth();
  const aiField = fieldProps.aiField;
  const permissionDisabled = Boolean(aiField) && !can(PERMISSIONS.UPDATE_COMPANY);
  return (
    <FormField {...fieldProps}>
      {({ fieldId }) => (
        <textarea
          id={fieldId}
          name={name}
          value={value ?? ""}
          placeholder={placeholder}
          disabled={disabled || permissionDisabled}
          rows={rows}
          onChange={onChange}
        />
      )}
    </FormField>
  );
}

export function SelectField({
  options = [],
  value = "",
  onChange,
  disabled = false,
  name,
  ...fieldProps
}) {
  const { can } = useAuth();
  const aiField = fieldProps.aiField;
  const isNewRecord = String(aiField?.path || "").startsWith("new.");
  const permissionDisabled = Boolean(aiField) && (
    (!can(PERMISSIONS.UPDATE_COMPANY) && !isNewRecord)
    || (aiField.path === "company.name" && !can(PERMISSIONS.RENAME_COMPANY))
  );
  return (
    <FormField {...fieldProps}>
      {({ fieldId }) => (
        <select
          id={fieldId}
          name={name}
          value={value ?? ""}
          disabled={disabled || permissionDisabled}
          onChange={onChange}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
