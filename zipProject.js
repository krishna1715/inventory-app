// Script to create a zip file of the project
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the zip file stream
const output = fs.createWriteStream('inventory-master-app.zip');
const archive = archiver('zip', {
  zlib: { level: 9 } // Maximum compression
});

// Listen for warnings and errors
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Get all directories to exclude
const excludeDirs = [
  '.git',
  'node_modules',
  'client/node_modules',
  'mobile-app/node_modules',
  '.next',
  'build',
  'dist'
];

// Function to recursively add files to the archive
function addDirectory(directoryPath, archivePath) {
  const files = fs.readdirSync(directoryPath);
  
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const relativePath = path.join(archivePath, file);
    
    // Skip excluded directories
    if (excludeDirs.some(dir => filePath.includes(dir))) {
      continue;
    }
    
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Recursively add subdirectories
      addDirectory(filePath, relativePath);
    } else {
      // Skip zip files to avoid adding the output to itself
      if (file.endsWith('.zip')) {
        continue;
      }
      
      // Add file to the archive
      archive.file(filePath, { name: relativePath });
    }
  }
}

// Add the root directory to the archive
addDirectory('.', '');

// Finalize the archive
archive.finalize();

output.on('close', function() {
  console.log(`Archive created: ${archive.pointer()} total bytes`);
  console.log('Zip file created: inventory-master-app.zip');
});