const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');


function runCommand(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de : ${command}`);
    process.exit(1);
  }
}


//
// 1. Compiler UIElement.ts vers UIElement.js
//
runCommand('npx tsc src/UIElement.ts --outDir src --target es2020 --module es2020');

// Copier UIElement.js dans dist/
const uiElementSrc = 'src/UIElement.js';
const uiElementDest = 'dist/UIElement.js';

if (fs.existsSync(uiElementSrc)) {
  fs.mkdirSync('dist', { recursive: true });
  fs.copyFileSync(uiElementSrc, uiElementDest);
} else {
  console.warn(`⚠️ Fichier non trouvé : ${uiElementSrc}`);
}

//
// 2. Copier les fichiers de d3CalendarDensity
//

const srcDensityDir = 'src/d3CalendarDensity';
const distDensityDir = 'dist/d3CalendarDensity';

fs.mkdirSync(distDensityDir, { recursive: true });

if (fs.existsSync(srcDensityDir)) {
  const files = fs.readdirSync(srcDensityDir).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const srcFile = path.join(srcDensityDir, file);
    const destFile = path.join(distDensityDir, file);
    fs.copyFileSync(srcFile, destFile);
  }
} else {
  console.warn(`⚠️ Dossier source introuvable : ${srcDensityDir}`);
}

//
// 3. Copier les fichiers de SHB
//

const srcSHBDir = 'src/StackedHorizontalBar';
const distSHBDir = 'dist/StackedHorizontalBar';

fs.mkdirSync(distSHBDir, { recursive: true });

if (fs.existsSync(srcSHBDir)) {
  const files = fs.readdirSync(srcSHBDir).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const srcFile = path.join(srcSHBDir, file);
    const destFile = path.join(distSHBDir, file);
    fs.copyFileSync(srcFile, destFile);
  }
} else {
  console.warn(`⚠️ Dossier source introuvable : ${srcSHBDir}`);
}

//
// 4. Copier les fichiers de Gantt
//

const srcGanttDir = 'src/Gantt';
const distGanttDir = 'dist/Gantt';

fs.mkdirSync(distGanttDir, { recursive: true });

if (fs.existsSync(srcGanttDir)) {
  const files = fs.readdirSync(srcGanttDir).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const srcFile = path.join(srcGanttDir, file);
    const destFile = path.join(distGanttDir, file);
    fs.copyFileSync(srcFile, destFile);
  }
} else {
  console.warn(`⚠️ Dossier source introuvable : ${srcGanttDir}`);
}

//
// 5. Copier les fichiers du Multiline
//
{
const srcMultilineDir = 'src/Multiline';
const distMultilineDir = 'dist/Gantt';

fs.mkdirSync(distMultilineDir, { recursive: true });

if (fs.existsSync(srcMultilineDir)) {
  const files = fs.readdirSync(srcMultilineDir).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const srcFile = path.join(srcMultilineDir, file);
    const destFile = path.join(distMultilineDir, file);
    fs.copyFileSync(srcFile, destFile);
  }
} else {
  console.warn(`⚠️ Dossier source introuvable : ${srcGanttDir}`);
}
}

//
// 3. Compiler SCSS vers CSS
//
runCommand('npx sass src/main.scss dist/main.css');

//
// 4. Bundler TypeScript principal
//
runCommand('npx esbuild src/main.ts --bundle --outfile=dist/main.js --format=iife');

console.log('\n🎉 Build terminé avec succès !');
