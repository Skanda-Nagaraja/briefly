import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { scanDirectory } from '../lib/scanner.js';
import { analyzeProject } from '../lib/analyzer.js';
import { summarizeWithAI } from '../lib/summarizer.js';
import { formatProjectSummary } from '../lib/formatter.js';
import { writeOutput } from '../lib/output.js';

export async function summaryCommand(targetPath, options) {
  const absolutePath = path.resolve(targetPath);
  const spinner = ora(`Scanning ${chalk.cyan(absolutePath)}...`).start();

  try {
    // Step 1: Scan directory structure
    const files = await scanDirectory(absolutePath, {
      maxDepth: parseInt(options.depth, 10),
    });

    spinner.text = `Found ${chalk.green(files.length)} files. Analyzing...`;

    // Step 2: Analyze project structure
    const analysis = await analyzeProject(absolutePath, files);

    spinner.text = 'Generating summary...';

    // Step 3: Generate AI summary (if enabled)
    let aiSummary = null;
    if (options.ai !== false) {
      try {
        aiSummary = await summarizeWithAI(analysis, 'project');
      } catch (err) {
        spinner.warn(
          chalk.yellow('AI summarization unavailable: ') + err.message
        );
      }
    }

    spinner.succeed('Analysis complete!');

    // Step 4: Format and display output
    const output = formatProjectSummary(analysis, aiSummary);
    console.log('\n' + output);

    // Step 5: Write to file if requested
    if (options.output) {
      await writeOutput(options.output, output);
      console.log(chalk.green(`\n✓ Summary saved to ${options.output}`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Error: ') + error.message);
    process.exit(1);
  }
}

