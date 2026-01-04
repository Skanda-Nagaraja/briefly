import { program } from 'commander';
import chalk from 'chalk';
import { summaryCommand } from './commands/summary.js';
import { moduleCommand } from './commands/module.js';
import { exportCommand } from './commands/export.js';

export function main() {
  program
    .name('briefly')
    .description(
      chalk.cyan('🔍 briefly') +
        ' — AI-powered CLI for generating project and file summaries'
    )
    .version('0.1.0');

  // Command: briefly summary <path>
  program
    .command('summary <path>')
    .description('Generate a high-level summary of a project or directory')
    .option('-d, --depth <number>', 'Max directory depth to scan', '3')
    .option('-o, --output <file>', 'Output file for the summary')
    .option('--no-ai', 'Skip AI summarization, show structure only')
    .action(summaryCommand);

  // Command: briefly module <file>
  program
    .command('module <file>')
    .description('Generate a detailed summary of a single file')
    .option('-o, --output <file>', 'Output file for the summary')
    .option('--show-ast', 'Include AST structure in output')
    .action(moduleCommand);

  // Command: briefly export
  program
    .command('export')
    .description('Export documentation to Markdown')
    .option('-p, --path <path>', 'Project path to document', '.')
    .option('-o, --output <file>', 'Output file', 'SUMMARY.md')
    .option('--include-code', 'Include code snippets in export')
    .action(exportCommand);

  // Show help if no command provided
  if (process.argv.length === 2) {
    program.help();
  }

  program.parse(process.argv);
}

