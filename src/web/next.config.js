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
    BACKEND_HOST: 'http://localhost:4000',
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
