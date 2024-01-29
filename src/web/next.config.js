const { withGoogleFonts } = require('nextjs-google-fonts')

const isProd =
  process.env.NODE_ENV === 'production' && process.env.RUNTIME !== 'local'

const nextConfig = {
  reactStrictMode: false, // We use FlipMove
  distDir: 'dist',
  output: 'export',
  // experimental: {
  //   forceSwcTransforms: true,
  // },
  env: {
    RUNTIME: process.env.NODE_ENV,
    BACKEND_HOST: isProd ? 'https://api.agencyai.gg' : 'http://localhost:4000',
    BUGSNAG_KEY: '135961c700e05de1db1294359a2f4af6',
    POSTHOG_KEY: isProd
      ? 'phc_BPdQYArzL17mpAOadEF46PkWMARUqCNeti2pr2kJEwL'
      : '',
    GTAG_ID: isProd ? 'G-ELMBCC8G0S' : '',
  },
  async rewrites() {
    return [
      {
        source: '/:any*',
        destination: '/',
      },
    ]
  },
  googleFonts: {
    fonts: [
      'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Righteous&family=Sometype+Mono&display=swap',
    ],
  },
}

module.exports = withGoogleFonts(nextConfig)
