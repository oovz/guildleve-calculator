/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#18181b",
                "background-light": "#F1F5F9",
                "background-dark": "#0c0c0e",
                "card-light": "#FFFFFF",
                "card-dark": "#161618",
                "accent-blue": "#3B82F6",
                "accent-cool": "#60A5FA",
                "accent-gold": "#F59E0B",

                // Keep existing for backward compat if needed, but preference is reference tokens
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
            },
            fontFamily: {
                display: ["var(--font-inter)", "sans-serif"],
                mono: ["var(--font-jetbrains-mono)", "monospace"],
            },
            borderRadius: {
                DEFAULT: "0.25rem",
                'lg': "0.375rem",
                'xl': "0.5rem",
            },
            boxShadow: {
                'soft': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            }
        }
    },
    plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography"), require("@tailwindcss/container-queries")],
}
