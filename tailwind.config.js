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
        "glow-lg": "0 0 0 1px rgba(26, 138, 86, 0.2), 0 10px 40px -8px rgba(26, 138, 86, 0.45)",
        lift: "0 12px 32px -8px rgba(15, 23, 42, 0.18), 0 4px 10px -4px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #0d5537 0%, #1a8a56 55%, #34d399 100%)",
        "aurora": "radial-gradient(60% 50% at 15% 0%, rgba(52,211,153,0.16) 0%, transparent 60%), radial-gradient(45% 40% at 90% 10%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(50% 45% at 70% 100%, rgba(14,165,233,0.10) 0%, transparent 60%)",
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
        floatY: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        blobDrift: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "33%": { transform: "translate(40px,-30px) scale(1.1)" },
          "66%": { transform: "translate(-30px,30px) scale(0.95)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        barGrow: {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
        ringPulse: {
          "0%": { boxShadow: "0 0 0 0 rgba(26,138,86,0.45)" },
          "100%": { boxShadow: "0 0 0 12px rgba(26,138,86,0)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "100%": { transform: "translateX(220%) skewX(-20deg)" },
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
        "float-y": "floatY 5s ease-in-out infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "blob-drift": "blobDrift 18s ease-in-out infinite",
        "slide-in-left": "slideInLeft 0.4s cubic-bezier(0.16,1,0.3,1) both",
        "bar-grow": "barGrow 0.9s cubic-bezier(0.16,1,0.3,1) both",
        "ring-pulse": "ringPulse 1.8s ease-out infinite",
      },
    },
  },
  plugins: [],
};
