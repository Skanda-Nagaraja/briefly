import chalk from 'chalk';

/**
 * Format project summary for console output
 * @param {Object} analysis - Project analysis
 * @param {string|null} aiSummary - AI-generated summary
 * @returns {string} - Formatted output
 */
export function formatProjectSummary(analysis, aiSummary) {
  const lines = [];

  // Header
  lines.push(chalk.bold.cyan('━'.repeat(60)));
  lines.push(chalk.bold.white(`  📁 Project: ${analysis.name}`));
  lines.push(chalk.bold.cyan('━'.repeat(60)));
  lines.push('');

  // AI Summary (if available)
  if (aiSummary) {
    lines.push(chalk.bold.yellow('🤖 AI Summary'));
    lines.push(chalk.dim('─'.repeat(40)));
    lines.push(formatAISummary(aiSummary));
    lines.push('');
  }

  // Tech Stack
  if (analysis.techStack.length > 0) {
    lines.push(chalk.bold.magenta('🛠  Tech Stack'));
    lines.push(chalk.dim('─'.repeat(40)));
    lines.push('  ' + analysis.techStack.map((t) => chalk.cyan(t)).join(', '));
    lines.push('');
  }

  // File Statistics
  lines.push(chalk.bold.blue('📊 Statistics'));
  lines.push(chalk.dim('─'.repeat(40)));
  lines.push(`  ${chalk.white('Files:')} ${chalk.green(analysis.stats.total)}`);
  lines.push(`  ${chalk.white('Size:')} ${chalk.green(formatBytes(analysis.stats.totalSize))}`);
  lines.push(`  ${chalk.white('Depth:')} ${chalk.green(analysis.structure.depth)} levels`);
  lines.push('');

  // File Types
  const extensions = Object.entries(analysis.stats.byExtension)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if (extensions.length > 0) {
    lines.push(chalk.bold.green('📄 File Types'));
    lines.push(chalk.dim('─'.repeat(40)));
    for (const [ext, count] of extensions) {
      const bar = '█'.repeat(Math.min(count, 20));
      lines.push(`  ${chalk.yellow(ext.padEnd(15))} ${chalk.dim(bar)} ${count}`);
    }
    lines.push('');
  }

  // Entry Points
  if (analysis.entryPoints.length > 0) {
    lines.push(chalk.bold.red('🚀 Entry Points'));
    lines.push(chalk.dim('─'.repeat(40)));
    for (const entry of analysis.entryPoints) {
      lines.push(`  ${chalk.green('→')} ${entry}`);
    }
    lines.push('');
  }

  // Key Dependencies
  const deps = Object.keys(analysis.dependencies.dependencies);
  if (deps.length > 0) {
    lines.push(chalk.bold.yellow('📦 Key Dependencies'));
    lines.push(chalk.dim('─'.repeat(40)));
    const depList = deps.slice(0, 12).map((d) => chalk.cyan(d)).join(', ');
    lines.push('  ' + depList);
    if (deps.length > 12) {
      lines.push(chalk.dim(`  ... and ${deps.length - 12} more`));
    }
    lines.push('');
  }

  // Key Directories
  if (analysis.structure.directories.length > 0) {
    lines.push(chalk.bold.white('📂 Key Directories'));
    lines.push(chalk.dim('─'.repeat(40)));
    for (const dir of analysis.structure.directories.slice(0, 10)) {
      lines.push(`  ${chalk.blue('└─')} ${dir}`);
    }
    if (analysis.structure.directories.length > 10) {
      lines.push(chalk.dim(`  ... and ${analysis.structure.directories.length - 10} more`));
    }
    lines.push('');
  }

  lines.push(chalk.bold.cyan('━'.repeat(60)));

  return lines.join('\n');
}

/**
 * Format module summary for console output
 * @param {Object} parsed - Parsed file data
 * @param {string|null} aiSummary - AI-generated summary
 * @param {Object} options - Display options
 * @returns {string} - Formatted output
 */
export function formatModuleSummary(parsed, aiSummary, options = {}) {
  const lines = [];

  // Header
  lines.push(chalk.bold.cyan('━'.repeat(60)));
  lines.push(chalk.bold.white(`  📄 File: ${parsed.fileName}`));
  lines.push(chalk.bold.cyan('━'.repeat(60)));
  lines.push('');

  // Basic Info
  lines.push(chalk.bold.blue('📊 Info'));
  lines.push(chalk.dim('─'.repeat(40)));
  lines.push(`  ${chalk.white('Path:')} ${parsed.filePath}`);
  lines.push(`  ${chalk.white('Lines:')} ${chalk.green(parsed.lines)}`);
  lines.push(`  ${chalk.white('Size:')} ${chalk.green(formatBytes(parsed.size))}`);
  lines.push('');

  // AI Summary (if available)
  if (aiSummary) {
    lines.push(chalk.bold.yellow('🤖 AI Summary'));
    lines.push(chalk.dim('─'.repeat(40)));
    lines.push(formatAISummary(aiSummary));
    lines.push('');
  }

  // Imports
  if (parsed.imports.length > 0) {
    lines.push(chalk.bold.magenta(`📥 Imports (${parsed.imports.length})`));
    lines.push(chalk.dim('─'.repeat(40)));
    for (const imp of parsed.imports.slice(0, 10)) {
      lines.push(`  ${chalk.green('←')} ${chalk.cyan(imp.source)}`);
    }
    if (parsed.imports.length > 10) {
      lines.push(chalk.dim(`  ... and ${parsed.imports.length - 10} more`));
    }
    lines.push('');
  }

  // Exports
  if (parsed.exports.length > 0) {
    lines.push(chalk.bold.green(`📤 Exports (${parsed.exports.length})`));
    lines.push(chalk.dim('─'.repeat(40)));
    for (const exp of parsed.exports) {
      const icon = exp.type === 'default' ? '★' : '→';
      lines.push(`  ${chalk.yellow(icon)} ${exp.name} ${chalk.dim(`(${exp.type})`)}`);
    }
    lines.push('');
  }

  // Functions
  if (parsed.functions.length > 0) {
    lines.push(chalk.bold.blue(`⚡ Functions (${parsed.functions.length})`));
    lines.push(chalk.dim('─'.repeat(40)));
    for (const func of parsed.functions.slice(0, 15)) {
      const params = func.params?.join(', ') || '';
      const badges = [];
      if (func.async) badges.push(chalk.magenta('async'));
      if (func.exported) badges.push(chalk.green('exported'));
      if (func.arrow) badges.push(chalk.cyan('arrow'));

      const badgeStr = badges.length > 0 ? ' ' + badges.join(' ') : '';
      lines.push(`  ${chalk.yellow('ƒ')} ${chalk.white(func.name)}(${chalk.dim(params)})${badgeStr}`);
    }
    if (parsed.functions.length > 15) {
      lines.push(chalk.dim(`  ... and ${parsed.functions.length - 15} more`));
    }
    lines.push('');
  }

  // Classes
  if (parsed.classes.length > 0) {
    lines.push(chalk.bold.red(`🏛  Classes (${parsed.classes.length})`));
    lines.push(chalk.dim('─'.repeat(40)));
    for (const cls of parsed.classes) {
      const ext = cls.superClass ? chalk.dim(` extends ${cls.superClass}`) : '';
      lines.push(`  ${chalk.red('◆')} ${chalk.white(cls.name)}${ext}`);
      if (cls.methods) {
        for (const method of cls.methods.slice(0, 5)) {
          const icon = method.kind === 'constructor' ? '⚙' : '·';
          lines.push(`    ${icon} ${chalk.dim(method.name)}()`);
        }
        if (cls.methods.length > 5) {
          lines.push(chalk.dim(`    ... and ${cls.methods.length - 5} more methods`));
        }
      }
    }
    lines.push('');
  }

  // Variables
  if (parsed.variables.length > 0 && parsed.variables.length <= 20) {
    lines.push(chalk.bold.yellow(`📌 Variables (${parsed.variables.length})`));
    lines.push(chalk.dim('─'.repeat(40)));
    for (const v of parsed.variables.slice(0, 10)) {
      lines.push(`  ${chalk.yellow(v.kind)} ${chalk.white(v.name)}`);
    }
    if (parsed.variables.length > 10) {
      lines.push(chalk.dim(`  ... and ${parsed.variables.length - 10} more`));
    }
    lines.push('');
  }

  // Parse Error
  if (parsed.parseError) {
    lines.push(chalk.bold.red('⚠️  Parse Warning'));
    lines.push(chalk.dim('─'.repeat(40)));
    lines.push(`  ${chalk.red(parsed.parseError)}`);
    lines.push('');
  }

  // AST (if requested)
  if (options.showAst && parsed.ast) {
    lines.push(chalk.bold.cyan('🌳 AST Structure'));
    lines.push(chalk.dim('─'.repeat(40)));
    lines.push(chalk.dim(JSON.stringify(parsed.ast, null, 2).slice(0, 2000)));
    lines.push('');
  }

  lines.push(chalk.bold.cyan('━'.repeat(60)));

  return lines.join('\n');
}

/**
 * Format AI summary with proper indentation
 * @param {string} summary - AI summary text
 * @returns {string} - Formatted summary
 */
function formatAISummary(summary) {
  return summary
    .split('\n')
    .map((line) => '  ' + line)
    .join('\n');
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

