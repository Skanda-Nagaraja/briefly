import fs from 'fs/promises';
import path from 'path';

/**
 * Write output to a file
 * @param {string} filePath - Output file path
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
export async function writeOutput(filePath, content) {
  const absolutePath = path.resolve(filePath);
  const dir = path.dirname(absolutePath);

  // Ensure directory exists
  await fs.mkdir(dir, { recursive: true });

  // Strip ANSI codes for file output
  const cleanContent = stripAnsi(content);

  await fs.writeFile(absolutePath, cleanContent, 'utf-8');
}

/**
 * Strip ANSI escape codes from string
 * @param {string} str - String with ANSI codes
 * @returns {string} - Clean string
 */
function stripAnsi(str) {
  // Regex to match ANSI escape codes
  const ansiRegex = /\x1B\[[0-9;]*[a-zA-Z]/g;
  return str.replace(ansiRegex, '');
}

/**
 * Append to a file
 * @param {string} filePath - Output file path
 * @param {string} content - Content to append
 * @returns {Promise<void>}
 */
export async function appendOutput(filePath, content) {
  const absolutePath = path.resolve(filePath);
  const cleanContent = stripAnsi(content);

  await fs.appendFile(absolutePath, cleanContent + '\n', 'utf-8');
}

