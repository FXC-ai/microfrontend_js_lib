const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function logStep(message) {
  console.log(`\n🔧 ${message}`);
}

function runCommand(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de : ${command}`);
    process.exit(1);
  }
}

console.log('🚀 Début du build...');

//
// 1. Compiler UIElement.ts vers UIElement.js
//
logStep('Compilation de UIElement.ts → UIElement.js');
runCommand('npx tsc src/UIElement.ts --outDir src --target es2020 --module es2020');

// Copier UIElement.js dans dist/
const uiElementSrc = 'src/UIElement.js';
const uiElementDest = 'dist/UIElement.js';

if (fs.existsSync(uiElementSrc)) {
  fs.mkdirSync('dist', { recursive: true });
  fs.copyFileSync(uiElementSrc, uiElementDest);
  console.log(`✅ Copié : ${uiElementDest}`);
} else {
  console.warn(`⚠️ Fichier non trouvé : ${uiElementSrc}`);
}

//
// 2. Copier les fichiers de d3CalendarDensity
//
logStep('Création du dossier dist/d3CalendarDensity et copie des fichiers JS');

const srcDensityDir = 'src/d3CalendarDensity';
const distDensityDir = 'dist/d3CalendarDensity';

fs.mkdirSync(distDensityDir, { recursive: true });

if (fs.existsSync(srcDensityDir)) {
  const files = fs.readdirSync(srcDensityDir).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const srcFile = path.join(srcDensityDir, file);
    const destFile = path.join(distDensityDir, file);
    fs.copyFileSync(srcFile, destFile);
    console.log(`✅ Copié : ${destFile}`);
  }
} else {
  console.warn(`⚠️ Dossier source introuvable : ${srcDensityDir}`);
}

//
// 3. Compiler SCSS vers CSS
//
logStep('Compilation SCSS → CSS');
runCommand('npx sass src/main.scss dist/main.css');

//
// 4. Bundler TypeScript principal
//
logStep('Bundle de main.ts → main.js');
runCommand('npx esbuild src/main.ts --bundle --outfile=dist/main.js --format=iife');

console.log('\n🎉 Build terminé avec succès !');
