module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
    // Apple's Liquid Glass and frosted materials as classes (packages/tailwind-ios-glass), tinted
    // like the About card and daisyUI's dark neutral
    require('tailwind-ios-glass')({ materialTint: '35 38 42', glassTint: '42 50 60' })
  ],

  daisyui: {
    themes: ['dark', 'night'],
  },
}
