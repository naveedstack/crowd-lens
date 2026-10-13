"use client";

import { Toaster } from "react-hot-toast";
import { useTheme } from "./ThemeProvider";

export function ThemeToaster() {
  const { theme } = useTheme();

  return (
    <Toaster
      toastOptions={{
        style: {
          background: theme === "light" ? "#ffffff" : "#0f172a",
          color: theme === "light" ? "#0f172a" : "#f8fafc",
          border: `1px solid ${theme === "light" ? "#e2e8f0" : "#1e293b"}`,
        },
      }}
    />
  );
}
