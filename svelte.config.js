import adapter from '@sveltejs/adapter-static';

// En desarrollo (vite dev) base = '' → localhost:5173/
// En producción (vite build) base = '/examen-educacion' → GitHub Pages
// Ajusta 'examen-educacion' al nombre exacto de tu repositorio en GitHub.
const dev = process.env.NODE_ENV !== 'production';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: '404.html',
      precompress: false,
      strict: true
    }),
    paths: {
      base: dev ? '' : '/examen-educacion'
    }
  }
};

export default config;
