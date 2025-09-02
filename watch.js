const { execSync, spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

console.log('🚀 Mode développement démarré !');

// Build initial
console.log('📦 Build initial...');
execSync('node build.js', { stdio: 'inherit' });

// Surveiller les fichiers
console.log('👀 Surveillance des fichiers...');


function runCommand(command, options = {}) {
  try {
    execSync(command, { stdio: 'inherit', ...options });
    return true; // Succès
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de : ${command}`);
    console.error(`   Détail: ${error.message}`);
    // ✅ ON NE FAIT PLUS process.exit(1) !
    return false; // Échec
  }
}


function copyFiles(srcDir, distDir, extension = '.js') {
  try {
    const fs = require('fs');
    
    // Vérifier que le répertoire source existe
    if (!fs.existsSync(srcDir)) {
      console.warn(`⚠️  Répertoire source inexistant: ${srcDir}`);
      return false;
    }

    // Créer le répertoire de destination s'il n'existe pas
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    const files = fs.readdirSync(srcDir).filter(file => file.endsWith(extension));
    
    for (const file of files) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(distDir, file);
      fs.copyFileSync(srcFile, destFile);
      console.log(`   📁 Copié: ${file}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la copie de ${srcDir}:`, error.message);
    return false;
  }
}

chokidar.watch(['src/**/*'], { ignoreInitial: true }).on('change', (filePath) => {
  console.log(`\n🔄 Fichier modifié: ${filePath} à ${new Date().toISOString()}`);
  console.log('🔨 Rebuild...');

  // SOLUTION 3: Try/catch global pour capturer TOUTES les erreurs
  try {
    const ext = path.extname(filePath);
    const fs = require('fs');
    let buildSuccess = true;

    // Gestion des fichiers TypeScript
    if (ext === '.ts') {
      if (filePath.includes('UIElement.ts')) {
        console.log('🔨 Compilation UIElement.ts...');
        const success = runCommand('npx tsc src/UIElement.ts --outDir src --target es2020 --module es2020');
        if (success && fs.existsSync('src/UIElement.js')) {
          try {
            fs.copyFileSync('src/UIElement.js', 'dist/UIElement.js');
            console.log('   ✅ UIElement.js copié');
          } catch (copyError) {
            console.error('❌ Erreur copie UIElement.js:', copyError.message);
            buildSuccess = false;
          }
        } else {
          buildSuccess = false;
        }
      }

      if (filePath.includes('CalendarMonth.ts')) {
        console.log('🔨 Compilation CalendarMonth.ts...');
        const success = runCommand('npx tsc src/CalendarMonth/CalendarMonth.ts --outDir dist/ --target es2020 --module es2020');
        if (!success) buildSuccess = false;
      }

      if (filePath.includes('Dataframe'))
      {
        console.log('🔨 Compilation CalendarMonth.ts...');
        const success = runCommand('npx tsc src/Dataframe/Dataframe.ts --outDir dist/ --target es2020 --module es2020');
        if(!success) buildSuccess = false;
      }
    }

    // Gestion des fichiers JavaScript
    if (ext === '.js') {
      const componentsMap = {
        'd3CalendarDensity': { src: 'src/d3CalendarDensity', dist: 'dist/d3CalendarDensity' },
        'StackedHorizontalBar': { src: 'src/StackedHorizontalBar', dist: 'dist/StackedHorizontalBar' },
        'Gantt': { src: 'src/Gantt', dist: 'dist/Gantt' },
        'Multiline': { src: 'src/Multiline', dist: 'dist/Multiline' },
        'Pie': { src: 'src/Pie', dist: 'dist/Pie' },
        'HorizontalBar': { src: 'src/HorizontalBar', dist: 'dist/HorizontalBar' }
      };

      // Traitement optimisé pour tous les composants
      for (const [componentName, paths] of Object.entries(componentsMap)) {
        if (filePath.includes(componentName)) {
          console.log(`🔨 Copie des fichiers ${componentName}...`);
          const success = copyFiles(paths.src, paths.dist, '.js');
          if (!success) buildSuccess = false;
          break; // Sortir de la boucle une fois le bon composant trouvé
        }
      }
    }

    // Gestion des fichiers SCSS
    if (ext === '.scss') {
      console.log('🔨 Compilation SCSS...');
      const success = runCommand('npx sass src/main.scss dist/main.css');
      if (!success) buildSuccess = false;
    }

    // Build final avec esbuild
    console.log('🔨 Build final avec esbuild...');
    const esbuildSuccess = runCommand('npx esbuild src/main.ts --bundle --outfile=dist/main.js --format=iife');
    if (!esbuildSuccess) buildSuccess = false;

    // Message de fin
    if (buildSuccess) {
      console.log('✅ Build terminé avec succès ! Rechargez votre navigateur.\n');
    } else {
      console.log('⚠️  Build terminé avec des erreurs. Corrigez les erreurs et sauvegardez à nouveau.\n');
    }

  } catch (error) {
    // SOLUTION 4: Capturer les erreurs non prévues sans faire crasher
    console.error('💥 Erreur inattendue dans le build:', error.message);
    console.error('📍 Stack trace:', error.stack);
    console.log('🔄 Le script continue à surveiller les fichiers...\n');
  }
});

// Nettoyage quand on arrête
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du mode dev...');
  process.exit();
});

// SOLUTION 5: Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('💥 Erreur non capturée:', error.message);
  console.log('🔄 Le script continue...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Promise rejetée:', reason);
  console.log('🔄 Le script continue...');
});