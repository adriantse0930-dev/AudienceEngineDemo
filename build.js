#!/usr/bin/env node
// Builds the single-file demo: node build.js  ->  index.html
// Sources live in src/. Every page is wrapped with the shared mock core (and the
// geo data when it needs it) and the shared page stylesheet.
const fs = require('fs');
const path = require('path');
const R = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

const USES_GEO = ['ca-geo', 'ca-geo-fsaldu', 'cross-impute', '1p-modeling'];
const core = R('core.js'), geo = R('fsa-geo.js'), pageCss = R('page.css');
const SAMPLES = require('./src/samples.js');

const PAGES = {};
for (const f of fs.readdirSync(path.join(__dirname, 'src/pages')).sort()) {
  if (!f.endsWith('.html')) continue;
  const name = f.replace(/\.html$/, '');
  let rest = R('pages/' + f);
  const head = '<!DOCTYPE html>\n<html lang="en">\n<head>\n' +
    (USES_GEO.indexOf(name) >= 0 ? '<script data-demo="fsa">\n' + geo + '</script>\n' : '') +
    '<script data-demo="core">\n' + core + '</script>\n';
  const css = '<style data-demo="ui">\n' + pageCss + '</style>\n';
  rest = rest.indexOf('</head>') >= 0 ? rest.replace('</head>', () => css + '</head>') : rest + css;
  if (SAMPLES[name]) {
    // One-click sample run, driven through the page's own controls.
    const sample = '<script data-demo="sample">\n' +
      'var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };\n' +
      'var until = async function (test, ms) { var t = Date.now(); while (!test() && Date.now() - t < (ms || 8000)) await wait(120); };\n' +
      'window.demoSample = ' + SAMPLES[name].toString() + ';\n</script>\n';
    const at = rest.lastIndexOf('</body>');
    rest = at >= 0 ? rest.slice(0, at) + sample + rest.slice(at) : rest + sample;
  }
  PAGES['/' + name] = head + rest;
}

// Keep </script> and line separators safe inside the inline <script>.
const pagesJson = JSON.stringify(PAGES)
  .replace(/<\//g, '<\\/')
  .split(String.fromCharCode(0x2028)).join('\\u2028')
  .split(String.fromCharCode(0x2029)).join('\\u2029');

const fill = (s, key, val) => { if (s.indexOf(key) < 0) throw new Error('missing ' + key); return s.split(key).join(val); };
let out = R('shell.html');
out = fill(out, '/*{{SHELL_CSS}}*/', R('shell.css'));
out = fill(out, '/*{{SPLASH_CSS}}*/', R('splash.css'));
out = fill(out, '<!--{{SPLASH_HTML}}-->', R('splash.html'));
out = fill(out, '/*{{TOOLS_JS}}*/', R('tools.js'));
out = fill(out, '/*{{SHELL_JS}}*/', R('shell.js'));
out = fill(out, '/*{{SPLASH_JS}}*/', R('splash.js'));
out = fill(out, '/*{{PAGES}}*/{}', pagesJson);
fs.writeFileSync(path.join(__dirname, 'index.html'), out);
console.log('index.html', (out.length / 1024).toFixed(0) + ' KB,', Object.keys(PAGES).length, 'pages');
