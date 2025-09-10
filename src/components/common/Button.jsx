import LoadingSpinner from "./LoadingSpinner";

/**
 * Button component that follows the Single Responsibility Principle
 * It's only responsible for rendering a button with different styles
 */
const Button = ({
  children,
  type = "button",
  variant = "primary",
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  className = "",
}) => {
  // Base classes for all buttons
  const baseClasses =
    "py-2 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

  // Variant specific classes
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500",
    outline:
      "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
  };

  // Width classes
  const widthClasses = fullWidth ? "w-full" : "";

  // Disabled classes
  const disabledClasses =
    disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  // Combine all classes
  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${widthClasses} ${disabledClasses} ${className}`;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <LoadingSpinner
            size="small"
            color={variant === "outline" ? "blue" : "white"}
          />
          <span className="ml-2">
            {typeof children === "string" ? children : "Loading..."}
          </span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
