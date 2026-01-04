import path from 'path';

/**
 * Generate Markdown documentation for a project
 * @param {Object} options - Generation options
 * @returns {string} - Markdown content
 */
export function generateMarkdownDocs(options) {
  const {
    projectPath,
    analysis,
    projectSummary,
    fileSummaries,
    includeCode = false,
  } = options;

  const sections = [];
  const projectName = path.basename(projectPath);

  // Title
  sections.push(`# ${projectName}`);
  sections.push('');
  sections.push(`> Auto-generated documentation by **briefly**`);
  sections.push(`> Generated: ${new Date().toISOString()}`);
  sections.push('');

  // Table of Contents
  sections.push('## Table of Contents');
  sections.push('');
  sections.push('- [Overview](#overview)');
  sections.push('- [Tech Stack](#tech-stack)');
  sections.push('- [Project Structure](#project-structure)');
  sections.push('- [Dependencies](#dependencies)');
  sections.push('- [File Documentation](#file-documentation)');
  sections.push('');

  // Overview
  sections.push('## Overview');
  sections.push('');
  if (projectSummary) {
    sections.push(projectSummary);
  } else {
    sections.push(`${projectName} is a project containing ${analysis.stats.total} files.`);
  }
  sections.push('');

  // Quick Stats
  sections.push('### Quick Stats');
  sections.push('');
  sections.push(`| Metric | Value |`);
  sections.push(`|--------|-------|`);
  sections.push(`| Total Files | ${analysis.stats.total} |`);
  sections.push(`| Total Size | ${formatBytes(analysis.stats.totalSize)} |`);
  sections.push(`| Directory Depth | ${analysis.structure.depth} |`);
  sections.push(`| Source Files | ${analysis.categories.code.length} |`);
  sections.push(`| Test Files | ${analysis.categories.tests.length} |`);
  sections.push('');

  // Tech Stack
  if (analysis.techStack.length > 0) {
    sections.push('## Tech Stack');
    sections.push('');
    for (const tech of analysis.techStack) {
      sections.push(`- ${tech}`);
    }
    sections.push('');
  }

  // Project Structure
  sections.push('## Project Structure');
  sections.push('');
  sections.push('```');
  sections.push(projectName + '/');
  for (const dir of analysis.structure.directories.slice(0, 20)) {
    const depth = dir.split(path.sep).length;
    const indent = '  '.repeat(depth);
    const name = path.basename(dir);
    sections.push(`${indent}├── ${name}/`);
  }
  if (analysis.structure.directories.length > 20) {
    sections.push(`  ... and ${analysis.structure.directories.length - 20} more directories`);
  }
  sections.push('```');
  sections.push('');

  // Entry Points
  if (analysis.entryPoints.length > 0) {
    sections.push('### Entry Points');
    sections.push('');
    for (const entry of analysis.entryPoints) {
      sections.push(`- \`${entry}\``);
    }
    sections.push('');
  }

  // Dependencies
  const deps = analysis.dependencies.dependencies;
  const devDeps = analysis.dependencies.devDependencies;

  if (Object.keys(deps).length > 0 || Object.keys(devDeps).length > 0) {
    sections.push('## Dependencies');
    sections.push('');

    if (Object.keys(deps).length > 0) {
      sections.push('### Production Dependencies');
      sections.push('');
      sections.push('| Package | Version |');
      sections.push('|---------|---------|');
      for (const [name, version] of Object.entries(deps).slice(0, 30)) {
        sections.push(`| ${name} | ${version} |`);
      }
      if (Object.keys(deps).length > 30) {
        sections.push(`| ... | ${Object.keys(deps).length - 30} more |`);
      }
      sections.push('');
    }

    if (Object.keys(devDeps).length > 0) {
      sections.push('### Dev Dependencies');
      sections.push('');
      sections.push('| Package | Version |');
      sections.push('|---------|---------|');
      for (const [name, version] of Object.entries(devDeps).slice(0, 20)) {
        sections.push(`| ${name} | ${version} |`);
      }
      if (Object.keys(devDeps).length > 20) {
        sections.push(`| ... | ${Object.keys(devDeps).length - 20} more |`);
      }
      sections.push('');
    }
  }

  // File Documentation
  if (fileSummaries.length > 0) {
    sections.push('## File Documentation');
    sections.push('');

    for (const { file, summary, parsed } of fileSummaries) {
      const relativePath = path.relative(projectPath, file);
      sections.push(`### \`${relativePath}\``);
      sections.push('');

      // Basic info
      sections.push(`- **Lines:** ${parsed.lines}`);
      sections.push(`- **Functions:** ${parsed.functions.length}`);
      sections.push(`- **Classes:** ${parsed.classes.length}`);
      sections.push('');

      // AI Summary
      if (summary) {
        sections.push('#### Summary');
        sections.push('');
        sections.push(summary);
        sections.push('');
      }

      // Exports
      if (parsed.exports.length > 0) {
        sections.push('#### Exports');
        sections.push('');
        for (const exp of parsed.exports) {
          sections.push(`- \`${exp.name}\` (${exp.type})`);
        }
        sections.push('');
      }

      // Functions
      if (parsed.functions.length > 0) {
        sections.push('#### Functions');
        sections.push('');
        for (const func of parsed.functions.slice(0, 10)) {
          const params = func.params?.join(', ') || '';
          const modifiers = [];
          if (func.async) modifiers.push('async');
          if (func.exported) modifiers.push('exported');
          const modStr = modifiers.length > 0 ? ` *(${modifiers.join(', ')})*` : '';
          sections.push(`- \`${func.name}(${params})\`${modStr}`);
        }
        if (parsed.functions.length > 10) {
          sections.push(`- *... and ${parsed.functions.length - 10} more functions*`);
        }
        sections.push('');
      }

      // Include code if requested
      if (includeCode) {
        sections.push('#### Source');
        sections.push('');
        sections.push('```' + getLanguageFromExtension(parsed.extension));
        // Would include code here, but we don't have access to content
        sections.push('// Code snippet not available');
        sections.push('```');
        sections.push('');
      }

      sections.push('---');
      sections.push('');
    }
  }

  // File Types Summary
  sections.push('## File Types');
  sections.push('');
  sections.push('| Extension | Count |');
  sections.push('|-----------|-------|');
  const sortedExts = Object.entries(analysis.stats.byExtension)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);
  for (const [ext, count] of sortedExts) {
    sections.push(`| ${ext} | ${count} |`);
  }
  sections.push('');

  // Footer
  sections.push('---');
  sections.push('');
  sections.push('*Generated with [briefly](https://github.com/Skanda-Nagaraja/briefly)*');

  return sections.join('\n');
}

/**
 * Get language identifier from file extension
 * @param {string} ext - File extension
 * @returns {string} - Language identifier
 */
function getLanguageFromExtension(ext) {
  const map = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.md': 'markdown',
  };
  return map[ext] || '';
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Byte count
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

