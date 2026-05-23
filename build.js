/**
 * Build script using esbuild.
 * Handles JSX transformation and CSS extraction without webpack's path validation issues.
 */
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

var pluginDir = __dirname;
var distDir = path.join(pluginDir, 'dist');

// Ensure dist exists
fs.mkdirSync(distDir, { recursive: true });

async function build() {
  // Build JS + CSS bundle
  await esbuild.build({
    entryPoints: [path.join(pluginDir, 'client/client.js')],
    bundle: true,
    outdir: distDir,
    entryNames: '[name]',
    format: 'iife',
    globalName: '__bpmnDocGenerator',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    alias: {
      'react': path.join(pluginDir, 'vendor/react.js'),
      'react-dom': path.join(pluginDir, 'vendor/react-dom.js')
    },
    platform: 'browser',
    target: ['chrome110'],
    minify: false,
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    logLevel: 'info'
  });

  // Rename client.css → style.css (esbuild extracts CSS from import)
  var extractedCss = path.join(distDir, 'client.css');
  var targetCss = path.join(distDir, 'style.css');
  if (fs.existsSync(extractedCss)) {
    fs.renameSync(extractedCss, targetCss);
  }

  // Report sizes
  var jsFile = path.join(distDir, 'client.js');
  if (fs.existsSync(jsFile)) {
    console.log('JS bundle: client.js (' + Math.round(fs.statSync(jsFile).size / 1024) + ' KB)');
  }
  if (fs.existsSync(targetCss)) {
    console.log('CSS bundle: style.css (' + Math.round(fs.statSync(targetCss).size / 1024) + ' KB)');
  }

  console.log('Build complete!');
}

build().catch(function(err) {
  console.error('Build failed:', err);
  process.exit(1);
});
