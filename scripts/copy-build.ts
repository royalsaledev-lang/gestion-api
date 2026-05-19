import fs from 'fs-extra';

async function run() {
  try {
    await fs.copy('prisma', 'dist/prisma');
    await fs.copy('src/templates', 'dist/src/templates');

    console.log('✅ Build copied successfully');
  } catch (err) {
    console.error('❌ Copy failed:', err);
    process.exit(1);
  }
}

run();
