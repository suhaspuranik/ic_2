/**
 * Input component that follows the Single Responsibility Principle
 * It's only responsible for rendering an input field with different styles
 */
const Input = ({
  id,
  name,
  type = "text",
  label,
  value,
  onChange,
  onBlur,
  placeholder = "",
  error = "",
  icon,
  required = false,
  className = "",
}) => {
  // Base classes for all inputs
  const baseClasses =
    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors";

  // Error or normal state classes
  const stateClasses = error
    ? "border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50"
    : "border-gray-300 focus:border-blue-500 focus:ring-blue-200";

  // Icon classes
  const iconClasses = icon ? "pl-10" : "";

  // Combine all classes
  const inputClasses = `${baseClasses} ${stateClasses} ${iconClasses} ${className}`;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block mb-2 text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <span className="material-icons-outlined text-gray-400 text-lg">
              {icon}
            </span>
          </div>
        )}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={inputClasses}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
