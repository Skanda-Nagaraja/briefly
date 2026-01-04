import fs from 'fs/promises';
import path from 'path';
import { categorizeFiles, getFileStats } from './scanner.js';

/**
 * Analyze a project and extract key information
 * @param {string} projectPath - Root path of the project
 * @param {string[]} files - Array of file paths
 * @returns {Promise<Object>} - Project analysis
 */
export async function analyzeProject(projectPath, files) {
  const analysis = {
    name: path.basename(projectPath),
    path: projectPath,
    files: files,
    stats: await getFileStats(files),
    categories: categorizeFiles(files),
    structure: await analyzeStructure(projectPath, files),
    dependencies: await analyzeDependencies(projectPath),
    entryPoints: await findEntryPoints(projectPath, files),
    techStack: [],
  };

  // Detect tech stack
  analysis.techStack = detectTechStack(analysis);

  return analysis;
}

/**
 * Analyze directory structure
 * @param {string} projectPath - Root path
 * @param {string[]} files - Array of file paths
 * @returns {Object} - Directory structure
 */
async function analyzeStructure(projectPath, files) {
  const structure = {
    directories: new Set(),
    depth: 0,
    tree: {},
  };

  for (const file of files) {
    const relativePath = path.relative(projectPath, file);
    const parts = relativePath.split(path.sep);

    // Track directories
    let currentPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      currentPath = currentPath ? path.join(currentPath, parts[i]) : parts[i];
      structure.directories.add(currentPath);
    }

    // Track depth
    structure.depth = Math.max(structure.depth, parts.length);
  }

  structure.directories = Array.from(structure.directories).sort();
  return structure;
}

/**
 * Analyze project dependencies
 * @param {string} projectPath - Root path
 * @returns {Promise<Object>} - Dependencies info
 */
async function analyzeDependencies(projectPath) {
  const deps = {
    manager: null,
    dependencies: {},
    devDependencies: {},
  };

  // Check for package.json (Node.js)
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
    );
    deps.manager = 'npm';
    deps.dependencies = packageJson.dependencies || {};
    deps.devDependencies = packageJson.devDependencies || {};
    return deps;
  } catch {
    // Not a Node.js project
  }

  // Check for requirements.txt (Python)
  try {
    const requirements = await fs.readFile(
      path.join(projectPath, 'requirements.txt'),
      'utf-8'
    );
    deps.manager = 'pip';
    deps.dependencies = parseRequirements(requirements);
    return deps;
  } catch {
    // Not a Python project with requirements.txt
  }

  // Check for pyproject.toml (Python)
  try {
    await fs.access(path.join(projectPath, 'pyproject.toml'));
    deps.manager = 'poetry/pip';
    return deps;
  } catch {
    // Not a Python project with pyproject.toml
  }

  return deps;
}

/**
 * Parse Python requirements.txt
 * @param {string} content - Requirements file content
 * @returns {Object} - Parsed dependencies
 */
function parseRequirements(content) {
  const deps = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)([<>=!]+.+)?$/);
      if (match) {
        deps[match[1]] = match[2] || '*';
      }
    }
  }

  return deps;
}

/**
 * Find likely entry points
 * @param {string} projectPath - Root path
 * @param {string[]} files - Array of file paths
 * @returns {Promise<string[]>} - Entry point files
 */
async function findEntryPoints(projectPath, files) {
  const entryPoints = [];
  const commonEntries = [
    'index.js', 'index.ts', 'main.js', 'main.ts',
    'app.js', 'app.ts', 'server.js', 'server.ts',
    'src/index.js', 'src/index.ts', 'src/main.js', 'src/main.ts',
    'src/app.js', 'src/app.ts',
    'main.py', 'app.py', '__main__.py',
    'cmd/main.go', 'main.go',
  ];

  for (const entry of commonEntries) {
    const fullPath = path.join(projectPath, entry);
    if (files.includes(fullPath)) {
      entryPoints.push(entry);
    }
  }

  // Check package.json for main/bin
  try {
    const packageJson = JSON.parse(
      await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8')
    );
    if (packageJson.main) entryPoints.push(packageJson.main);
    if (packageJson.bin) {
      const bins = typeof packageJson.bin === 'string'
        ? [packageJson.bin]
        : Object.values(packageJson.bin);
      entryPoints.push(...bins);
    }
  } catch {
    // No package.json
  }

  return [...new Set(entryPoints)];
}

/**
 * Detect technology stack
 * @param {Object} analysis - Project analysis
 * @returns {string[]} - Detected technologies
 */
function detectTechStack(analysis) {
  const stack = [];
  const { dependencies, devDependencies } = analysis.dependencies;
  const allDeps = { ...dependencies, ...devDependencies };
  const fileExts = Object.keys(analysis.stats.byExtension);

  // Languages
  if (fileExts.some((e) => ['.js', '.mjs', '.cjs'].includes(e))) stack.push('JavaScript');
  if (fileExts.some((e) => ['.ts', '.tsx'].includes(e))) stack.push('TypeScript');
  if (fileExts.some((e) => e === '.py')) stack.push('Python');
  if (fileExts.some((e) => e === '.go')) stack.push('Go');
  if (fileExts.some((e) => e === '.rs')) stack.push('Rust');

  // Frameworks
  if (allDeps['react'] || allDeps['react-dom']) stack.push('React');
  if (allDeps['vue']) stack.push('Vue');
  if (allDeps['@angular/core']) stack.push('Angular');
  if (allDeps['next']) stack.push('Next.js');
  if (allDeps['express']) stack.push('Express');
  if (allDeps['fastify']) stack.push('Fastify');
  if (allDeps['nestjs'] || allDeps['@nestjs/core']) stack.push('NestJS');

  // Tools
  if (allDeps['webpack']) stack.push('Webpack');
  if (allDeps['vite']) stack.push('Vite');
  if (allDeps['jest']) stack.push('Jest');
  if (allDeps['mocha']) stack.push('Mocha');
  if (allDeps['tailwindcss']) stack.push('Tailwind CSS');

  return stack;
}

