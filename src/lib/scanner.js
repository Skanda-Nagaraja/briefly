import { glob } from 'glob';
import path from 'path';
import fs from 'fs/promises';

// Default patterns to ignore
const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/coverage/**',
  '**/*.min.js',
  '**/*.map',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
];

/**
 * Scan a directory and return all relevant files
 * @param {string} dirPath - Directory path to scan
 * @param {Object} options - Scan options
 * @returns {Promise<string[]>} - Array of file paths
 */
export async function scanDirectory(dirPath, options = {}) {
  const { maxDepth = 10, ignore = [] } = options;

  // Verify directory exists
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`${dirPath} is not a directory`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    throw err;
  }

  // Build glob pattern with depth limit
  const depthPattern = maxDepth > 0 ? `**/*` : '*';

  const files = await glob(depthPattern, {
    cwd: dirPath,
    absolute: true,
    nodir: true,
    ignore: [...DEFAULT_IGNORE, ...ignore],
    maxDepth,
  });

  return files.sort();
}

/**
 * Get file statistics for a list of files
 * @param {string[]} files - Array of file paths
 * @returns {Promise<Object>} - File statistics
 */
export async function getFileStats(files) {
  const stats = {
    total: files.length,
    byExtension: {},
    byDirectory: {},
    totalSize: 0,
  };

  for (const file of files) {
    // Count by extension
    const ext = path.extname(file) || '(no extension)';
    stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;

    // Count by top-level directory
    const dir = path.dirname(file).split(path.sep)[0] || '.';
    stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1;

    // Get file size
    try {
      const fileStat = await fs.stat(file);
      stats.totalSize += fileStat.size;
    } catch {
      // Skip files that can't be accessed
    }
  }

  return stats;
}

/**
 * Categorize files by type
 * @param {string[]} files - Array of file paths
 * @returns {Object} - Categorized files
 */
export function categorizeFiles(files) {
  const categories = {
    code: [],
    config: [],
    docs: [],
    tests: [],
    assets: [],
    other: [],
  };

  const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go', '.java', '.c', '.cpp', '.rs'];
  const configFiles = ['package.json', 'tsconfig.json', '.eslintrc', '.prettierrc', 'webpack.config.js', 'vite.config.js'];
  const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
  const testPatterns = ['.test.', '.spec.', '__tests__', 'test/', 'tests/'];
  const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'];

  for (const file of files) {
    const ext = path.extname(file);
    const basename = path.basename(file);

    if (testPatterns.some((p) => file.includes(p))) {
      categories.tests.push(file);
    } else if (codeExtensions.includes(ext)) {
      categories.code.push(file);
    } else if (configFiles.some((c) => basename.includes(c)) || ext === '.json' || ext === '.yaml' || ext === '.yml') {
      categories.config.push(file);
    } else if (docExtensions.includes(ext)) {
      categories.docs.push(file);
    } else if (assetExtensions.includes(ext)) {
      categories.assets.push(file);
    } else {
      categories.other.push(file);
    }
  }

  return categories;
}

