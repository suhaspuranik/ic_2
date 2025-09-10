/**
 * LoadingSpinner component that follows the Single Responsibility Principle
 * It's only responsible for displaying a loading indicator
 */
const LoadingSpinner = ({
  size = "medium",
  color = "blue",
  className = "",
}) => {
  // Size classes
  const sizeClasses = {
    small: "w-4 h-4 border-2",
    medium: "w-8 h-8 border-3",
    large: "w-12 h-12 border-4",
  };

  // Color classes
  const colorClasses = {
    blue: "border-blue-500",
    gray: "border-gray-500",
    white: "border-white",
  };

  // Combine all classes
  const spinnerClasses = `inline-block rounded-full border-t-transparent animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`;

  return (
    <div className="flex justify-center items-center">
      <div className={spinnerClasses}></div>
    </div>
  );
};

export default LoadingSpinner;
