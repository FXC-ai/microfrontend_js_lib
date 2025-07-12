const { execSync, spawn } = require('child_process');
const chokidar = require('chokidar');

console.log('🚀 Mode développement démarré !');

// Build initial
console.log('📦 Build initial...');
execSync('node build.js', { stdio: 'inherit' });

// Démarrer le serveur
// console.log('🌐 Démarrage du serveur...');
// const server = spawn('npx', ['http-server', '.', '-p', '8080'], { 
//   stdio: 'inherit' 
// });

// Surveiller les fichiers
console.log('👀 Surveillance des fichiers...');
chokidar.watch(['src/**/*'], { ignoreInitial: true })
  .on('change', (path) => {
    console.log(`\n🔄 Fichier modifié: ${path}`);
    console.log('🔨 Rebuild...');
    try {
      execSync('node build.js', { stdio: 'inherit' });
      console.log('✅ Build terminé ! Rechargez votre navigateur.\n');
    } catch (error) {
      console.log('❌ Erreur build:', error.message);
    }
  });

// Nettoyage quand on arrête
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du mode dev...');
  server.kill();
  process.exit();
});