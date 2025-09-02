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

if (fs.existsSync(srcGanttDir))
{
  const files = fs.readdirSync(srcGanttDir).filter(file => file.endsWith('.js'));

  // runCommand('npx esbuild src/Gantt/Gantt.js --bundle --outfile=dist/Gantt/Gantt.js --format=iife');
  // runCommand('npx tsc src/Gantt/Gantt.js --allowJs --outDir dist/Gantt --target es2020 --module es2020');

  for (const file of files)
  {
    const srcFile = path.join(srcGanttDir, file);
    const destFile = path.join(distGanttDir, file);
    fs.copyFileSync(srcFile, destFile);
  }
}
else
{
  console.warn(`⚠️ Dossier source introuvable : ${srcGanttDir}`);
}

//
// 5. Copier les fichiers du Multiline
//

const srcMultilineDir = 'src/Multiline';
const distMultilineDir = 'dist/Multiline';

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

// 6. Copier les fichiers du Pie
const srcPieDir = 'src/Pie';
const distPieDir = 'dist/Pie';

fs.mkdirSync(distPieDir, { recursive: true });
if (fs.existsSync(srcPieDir))
{
  const files = fs.readdirSync(srcPieDir).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const srcFile = path.join(srcPieDir, file);
    const destFile = path.join(distPieDir, file);
    fs.copyFileSync(srcFile, destFile);
  }
} 
else
{
  console.warn(`⚠️ Dossier source introuvable : ${srcPieDir}`);
}

// 7. Copier les fichiers du HorizontalBar

const srcHbDir = 'src/HorizontalBar';
const distHbDir = 'dist/HorizontalBar';

fs.mkdirSync(distHbDir, { recursive: true });
if (fs.existsSync(srcHbDir))
{
  const files = fs.readdirSync(srcHbDir).filter(file => file.endsWith('.js'));
  for (const file of files) {
    const srcFile = path.join(srcHbDir, file);
    const destFile = path.join(distHbDir, file);
    fs.copyFileSync(srcFile, destFile);
  }
} 
else
{
  console.warn(`⚠️ Dossier source introuvable : ${srcHbDir}`);
}

// 8. Transpilation de ts en js depuis le dossier src vers le dossier dist pour CalendarMonth

const srcCalendarMonthDir = 'src/CalendarMonth';
const distCalendarMonthDir = 'dist/CalendarMonth';

fs.mkdirSync(distCalendarMonthDir, { recursive: true });
if (fs.existsSync(srcCalendarMonthDir))
{
  runCommand('npx tsc src/CalendarMonth/CalendarMonth.ts --outDir dist/CalendarMonth --target es2020 --module es2020');
} 
else
{
  console.warn(`⚠️ Dossier source introuvable : ${srcCalendarMonthDir}`);
}

// 9. Transpilation de ts vers js depuis le dossier src vers le dossier dist pour Dataframe

const srcDataframeDir = 'src/Dataframe';
const distDataframeDir = 'dist/Dataframe';

fs.mkdirSync(distDataframeDir, { recursive: true });
if (fs.existsSync(srcDataframeDir))
{
  runCommand('npx tsc src/Dataframe/Dataframe.ts --outDir dist/Dataframe --target es2020 --module es2020');
} 
else
{
  console.warn(`⚠️ Dossier source introuvable : ${srcDataframeDir}`);
}

//
// 3. Compiler SCSS vers CSS
//
runCommand('npx sass src/Dataframe/Dataframe.scss dist/Dataframe/Dataframe.css');

runCommand('npx sass src/HorizontalBar/HorizontalBar.scss dist/HorizontalBar/HorizontalBar.css');
runCommand('npx sass src/StackedHorizontalBar/StackedHorizontalBar.scss dist/StackedHorizontalBar/StackedHorizontalBar.css');
runCommand('npx sass src/CalendarMonth/calendar_month.scss dist/CalendarMonth/calendar_month.css');
runCommand('npx sass src/d3CalendarDensity/CalendarDensity.scss dist/d3CalendarDensity/CalendarDensity.css');
runCommand('npx sass src/pie/pie.scss dist/pie/pie.css');

//
// 4. Bundler TypeScript principal
//
runCommand('npx esbuild src/main.ts --bundle --outfile=dist/main.js --format=esm');

console.log('\n🎉 Build terminé avec succès !');
