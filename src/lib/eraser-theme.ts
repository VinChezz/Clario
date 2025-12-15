export const eraserDarkTheme = {
  colors: {
    background: {
      primary: "#0f0f10",
      secondary: "#1a1a1c",
      tertiary: "#252528",
    },
    text: {
      primary: "#f0f0f0",
      secondary: "#a0a0a0",
      muted: "#707070",
    },
    border: {
      default: "#2a2a2d",
      hover: "#3a3a3d",
      active: "#3b82f6",
    },
    accent: {
      blue: "#3b82f6",
      blueHover: "#2563eb",
      green: "#10b981",
      purple: "#8b5cf6",
      red: "#ef4444",
    },
  },

  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.6)",
  },

  effects: {
    backdropBlur: "backdrop-blur-md",
    glass: "bg-white/5 backdrop-blur-md border border-white/10",
    hover: "hover:bg-white/[0.03] transition-colors duration-150",
  },
};

export function useEraserTheme() {
  return eraserDarkTheme;
}
