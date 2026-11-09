// Copie les fichiers statiques (HTML, CSS) dans dist/ après la compilation TypeScript.
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

mkdirSync('dist', { recursive: true });
for (const f of ['index.html', 'privacy.html', 'style.css', 'manifest.webmanifest', 'icon-180.png', 'icon-512.png']) copyFileSync(f, `dist/${f}`);
// la police (téléchargée par la compilation chez GitHub, cf. .github/workflows)
if (existsSync('fonts/VT323-Regular.ttf')) {
  mkdirSync('dist/fonts', { recursive: true });
  copyFileSync('fonts/VT323-Regular.ttf', 'dist/fonts/VT323-Regular.ttf');
}
writeFileSync('dist/.nojekyll', '');

// Contre le cache des navigateurs (Safari sur iPhone surtout) : chaque version reçoit un numéro, ajouté à
// l'adresse de tous les fichiers JavaScript. Une nouvelle version = de nouvelles adresses = pas de vieux fichiers.
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // AAAAMMJJhhmm
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
if (existsSync('dist/js')) {
  for (const f of walk('dist/js').filter((f) => f.endsWith('.js'))) {
    const src = readFileSync(f, 'utf8');
    const out = src.replace(/((?:from|import)\s*\(?\s*['"])(\.{1,2}\/[^'"?]+\.js)(['"])/g, `$1$2?v=${stamp}$3`);
    if (out !== src) writeFileSync(f, out);
  }
}
const html = readFileSync('dist/index.html', 'utf8').replace('src="js/main.js"', `src="js/main.js?v=${stamp}"`).replace('href="style.css"', `href="style.css?v=${stamp}"`).replace('</body>', `<!-- version ${stamp} -->\n</body>`);
const label = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(' ', ' · ');
writeFileSync('dist/index.html', html.replace('__VERSION__', label));
console.log(`Version ${stamp}`);
console.log('Fichiers statiques copiés dans dist/');
