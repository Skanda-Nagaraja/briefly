import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs/promises';
import { parseFile } from '../lib/parser.js';
import { summarizeWithAI } from '../lib/summarizer.js';
import { formatModuleSummary } from '../lib/formatter.js';
import { writeOutput } from '../lib/output.js';

export async function moduleCommand(file, options) {
  const absolutePath = path.resolve(file);
  const spinner = ora(`Analyzing ${chalk.cyan(path.basename(file))}...`).start();

  try {
    // Step 1: Read and parse the file
    const content = await fs.readFile(absolutePath, 'utf-8');
    const parsed = await parseFile(absolutePath, content, {
      showAst: options.showAst,
    });

    spinner.text = 'Generating summary...';

    // Step 2: Generate AI summary
    let aiSummary = null;
    try {
      aiSummary = await summarizeWithAI(
        { content, parsed, filePath: absolutePath },
        'module'
      );
    } catch (err) {
      spinner.warn(chalk.yellow('AI summarization unavailable: ') + err.message);
    }

    spinner.succeed('Analysis complete!');

    // Step 3: Format and display output
    const output = formatModuleSummary(parsed, aiSummary, options);
    console.log('\n' + output);

    // Step 4: Write to file if requested
    if (options.output) {
      await writeOutput(options.output, output);
      console.log(chalk.green(`\n✓ Summary saved to ${options.output}`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Error: ') + error.message);
    process.exit(1);
  }
}

