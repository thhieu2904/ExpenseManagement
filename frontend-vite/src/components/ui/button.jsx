import * as React from "react";

export const Button = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 ${className}`}
      {...props}
    />
  );
});
Button.displayName = "Button";
