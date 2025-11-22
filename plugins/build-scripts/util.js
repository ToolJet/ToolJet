import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises'; // Note the '/promises' for async operations

// Setup for __dirname (same as above)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPrivatePackage = async (name) => {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  const filePath = path.join(__dirname, '..', 'packages', name, 'package.json')
  const pkg = await loadPackageJson(filePath);
  return pkg.private;
};

// Use await to read the file content
async function loadPackageJson(filePath) {
  try {
    // Read the file asynchronously
    const data = await fs.readFile(filePath, 'utf8');
    const pkg = JSON.parse(data);
    return pkg;
  } catch (error) {
    console.error("Failed to load package.json:", error);
    throw error;
  }
}

// Note: This code must be run inside an async function or a top-level await context.
const getPackages = async () => {
  // 1. Read directories asynchronously
  const dirents = await fs.readdir('./packages', { withFileTypes: true });

  // 2. Perform the initial synchronous filtering
  const directories = dirents.filter(
    (dirent) => dirent.isDirectory() && dirent.name !== 'common'
  );

  // 3. Map the directories to an array of promises (the privatization check)
  const checkPromises = directories.map((dirent) => isPrivatePackage(dirent.name));

  // 4. Await all checks to run in **parallel** (this is fast)
  const isPrivateResults = await Promise.all(checkPromises);

  // 5. Filter the original directory list based on the parallel results
  const packages = directories.filter((_, index) => {
    // We only keep the package if isPrivatePackage(dirent.name) was NOT true.
    return !isPrivateResults[index];
  });
  
  return packages;
};

export { getPackages };
