module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('@neo4j-ndl/base').tailwindConfig],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        ciandt: {
          primary: '#000050',
          accent: '#E94E47',
          cyan: '#00B8D4',
          background: '#F5F7FA',
          card: '#FFFFFF',
          'text-secondary': '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'ciandt': '12px',
      },
      boxShadow: {
        'ciandt': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'ciandt-lg': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
};
