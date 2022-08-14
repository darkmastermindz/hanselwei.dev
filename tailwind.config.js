module.exports = {
  purge: [],
  darkMode: 'media', // or 'media' or 'class'
  important: false,
  theme: {
    extend: {},
  },
  variants: {
    extend: {
        colors: {
          green: colors.emerald,
          yellow: colors.amber,
          purple: colors.violet,
        },
      transitionProperty: ['responsive', 'motion-safe', 'motion-reduce'],
    },
  },
  plugins: [],
}
