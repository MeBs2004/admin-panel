/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eaf6f0",
          100: "#c9e8d7",
          200: "#96d1b0",
          300: "#5fb887",
          400: "#1a8a56",
          500: "#0d5537",
          600: "#0a4229",
          700: "#083420",
          800: "#062719",
          900: "#041a11",
        },
        success: {
          50: "#eaf6f0",
          500: "#16a34a",
          600: "#15803d",
        },
        warning: {
          50: "#fffbeb",
          500: "#d97706",
          600: "#b45309",
        },
        danger: {
          50: "#fef2f2",
          500: "#dc2626",
          600: "#b91c1c",
        },
        info: {
          50: "#eff6ff",
          500: "#2563eb",
          600: "#1d4ed8",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)",
        "card-hover":
          "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -2px rgba(15, 23, 42, 0.05)",
        glow: "0 0 0 1px rgba(13, 85, 55, 0.15), 0 0 20px -4px rgba(26, 138, 86, 0.35)",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        launcherFloat: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        launcherGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(13, 85, 55, 0)" },
          "50%": { boxShadow: "0 0 16px 4px rgba(13, 85, 55, 0.35)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.35s ease-out both",
        "fade-in": "fadeIn 0.25s ease-out both",
        "scale-in": "scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "slide-down": "slideDown 0.18s ease-out both",
        "launcher-float": "launcherFloat 2.8s ease-in-out infinite",
        "launcher-glow": "launcherGlow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
