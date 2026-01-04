import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { scanDirectory } from '../lib/scanner.js';
import { analyzeProject } from '../lib/analyzer.js';
import { parseFile } from '../lib/parser.js';
import { summarizeWithAI } from '../lib/summarizer.js';
import { generateMarkdownDocs } from '../lib/markdown.js';
import { writeOutput } from '../lib/output.js';
import fs from 'fs/promises';

export async function exportCommand(options) {
  const targetPath = path.resolve(options.path);
  const outputFile = options.output;
  const spinner = ora(`Exporting documentation for ${chalk.cyan(targetPath)}...`).start();

  try {
    // Step 1: Scan and analyze project
    spinner.text = 'Scanning project structure...';
    const files = await scanDirectory(targetPath, { maxDepth: 5 });
    const analysis = await analyzeProject(targetPath, files);

    // Step 2: Parse important files
    spinner.text = 'Parsing source files...';
    const parsedFiles = [];
    const codeFiles = files.filter((f) =>
      ['.js', '.ts', '.jsx', '.tsx', '.py', '.rb', '.go'].some((ext) =>
        f.endsWith(ext)
      )
    );

    for (const file of codeFiles.slice(0, 20)) {
      // Limit to 20 files for performance
      try {
        const content = await fs.readFile(file, 'utf-8');
        const parsed = await parseFile(file, content);
        parsedFiles.push({ file, content, parsed });
      } catch {
        // Skip files that can't be parsed
      }
    }

    // Step 3: Generate AI summaries
    spinner.text = 'Generating AI summaries...';
    let projectSummary = null;
    const fileSummaries = [];

    try {
      projectSummary = await summarizeWithAI(analysis, 'project');

      for (const { file, content, parsed } of parsedFiles.slice(0, 10)) {
        try {
          const summary = await summarizeWithAI(
            { content, parsed, filePath: file },
            'module'
          );
          fileSummaries.push({ file, summary, parsed });
        } catch {
          // Skip files that fail summarization
        }
      }
    } catch (err) {
      spinner.warn(chalk.yellow('AI summarization unavailable: ') + err.message);
    }

    // Step 4: Generate Markdown documentation
    spinner.text = 'Generating Markdown...';
    const markdown = generateMarkdownDocs({
      projectPath: targetPath,
      analysis,
      projectSummary,
      fileSummaries,
      includeCode: options.includeCode,
    });

    // Step 5: Write output
    await writeOutput(outputFile, markdown);
    spinner.succeed(chalk.green(`Documentation exported to ${outputFile}`));

    console.log(
      chalk.dim(`\n  Documented ${parsedFiles.length} files with ${fileSummaries.length} AI summaries`)
    );
  } catch (error) {
    spinner.fail(chalk.red('Error: ') + error.message);
    process.exit(1);
  }
}

