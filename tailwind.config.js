module.exports = {
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
    // Apple's Liquid Glass and frosted materials as classes (packages/tailwind-ios-glass), tinted
    // like the site's dark cards and daisyUI's dark neutral
    require('tailwind-ios-glass')({ materialTint: '35 38 42', glassTint: '42 50 60' })
  ],

  daisyui: {
    themes: [{
      dark: {
        'color-scheme': 'dark',
        primary: '#661AE6',
        'primary-content': '#ffffff',
        secondary: '#D926AA',
        'secondary-content': '#ffffff',
        accent: '#1FB2A5',
        'accent-content': '#ffffff',
        neutral: '#2a323c',
        'neutral-content': '#A6ADBB',
        'base-100': '#1d232a',
        'base-200': '#191e24',
        'base-300': '#15191e',
        'base-content': '#A6ADBB'
      }
    }]
  },
}
