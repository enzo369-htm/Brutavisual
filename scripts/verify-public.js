/**
 * Comprueba que src/href locales en public/*.html apunten a archivos existentes.
 * Uso: node scripts/verify-public.js
 */
const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const files = ["index.html", "informacion.html", "talleres.html"];
const re = /(?:src|href)\s*=\s*["']([^"']+)["']/gi;

function isLocalAsset(ref) {
  if (!ref) return false;
  const t = ref.trim();
  if (t.startsWith("#") || t.startsWith("data:") || t.startsWith("javascript:")) {
    return false;
  }
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("//")) {
    return false;
  }
  if (t.startsWith("mailto:") || t.startsWith("tel:")) {
    return false;
  }
  return true;
}

let failed = 0;
for (const f of files) {
  const full = path.join(publicDir, f);
  if (!fs.existsSync(full)) {
    console.error("Falta el archivo listado:", f);
    failed++;
    continue;
  }
  const html = fs.readFileSync(full, "utf8");
  let m;
  re.lastIndex = 0;
  while ((m = re.exec(html)) !== null) {
    const ref = m[1];
    if (!isLocalAsset(ref)) continue;
    let clean = ref.split("?")[0].split("#")[0];
    if (clean.startsWith("/")) {
      clean = clean.slice(1) || "index.html";
    }
    if (!clean) continue;
    const resolved = path.join(publicDir, path.normalize(clean));
    if (!resolved.startsWith(publicDir)) {
      console.error("Ruta sospechosa:", ref, "en", f);
      failed++;
      continue;
    }
    if (!fs.existsSync(resolved)) {
      console.error("Falta recurso local:", ref, "referenciado en", f);
      failed++;
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log("verify-public: OK (", files.length, "páginas, referencias locales comprobadas)");
