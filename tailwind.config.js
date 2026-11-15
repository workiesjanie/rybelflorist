/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cream: '#F8F4EF',
                'dusty-rose': {
                    DEFAULT: '#D9A6A0',
                    light: '#E8C5C0',
                    dark: '#C4908A',
                },
                'soft-brown': {
                    DEFAULT: '#A88972',
                    light: '#C4AA96',
                    dark: '#8B6F5A',
                },
                charcoal: {
                    DEFAULT: '#39332F',
                    light: '#5A534E',
                    muted: '#6B6360',
                },
            },
            fontFamily: {
                sans: ['Poppins', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
