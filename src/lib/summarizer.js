import OpenAI from 'openai';

let openai = null;

/**
 * Initialize OpenAI client
 * @returns {OpenAI} - OpenAI client instance
 */
function getOpenAIClient() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY environment variable is required for AI summarization.\n' +
        'Set it with: export OPENAI_API_KEY=your-key-here\n' +
        'Or use --no-ai flag to skip AI summarization.'
      );
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

/**
 * Generate AI-powered summary
 * @param {Object} data - Data to summarize
 * @param {string} type - Type of summary ('project' or 'module')
 * @returns {Promise<string>} - Generated summary
 */
export async function summarizeWithAI(data, type) {
  const client = getOpenAIClient();
  const prompt = buildPrompt(data, type);

  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: getSystemPrompt(type),
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}

/**
 * Get system prompt based on summary type
 * @param {string} type - Summary type
 * @returns {string} - System prompt
 */
function getSystemPrompt(type) {
  if (type === 'project') {
    return `You are a technical documentation expert. Your task is to analyze project information and generate a clear, concise summary. Focus on:
- What the project does (purpose)
- Key technologies used
- Architecture overview
- Main components and their relationships
- Notable patterns or design decisions

Be concise but comprehensive. Use bullet points for clarity. Avoid obvious statements.`;
  }

  if (type === 'module') {
    return `You are a technical documentation expert. Your task is to analyze a source file and generate a clear, concise summary. Focus on:
- What this file/module does
- Key functions and their purposes
- Important exports
- Dependencies and how they're used
- Edge cases or important considerations
- How this module fits into a larger system

Be concise but comprehensive. Highlight anything unusual or important for developers to know.`;
  }

  return 'You are a technical documentation expert. Provide clear, concise summaries.';
}

/**
 * Build prompt for AI summarization
 * @param {Object} data - Data to summarize
 * @param {string} type - Summary type
 * @returns {string} - Formatted prompt
 */
function buildPrompt(data, type) {
  if (type === 'project') {
    return buildProjectPrompt(data);
  }

  if (type === 'module') {
    return buildModulePrompt(data);
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Build prompt for project summary
 * @param {Object} analysis - Project analysis
 * @returns {string} - Formatted prompt
 */
function buildProjectPrompt(analysis) {
  const sections = [];

  sections.push(`# Project: ${analysis.name}`);
  sections.push(`\n## File Statistics`);
  sections.push(`- Total files: ${analysis.stats.total}`);
  sections.push(`- Total size: ${formatBytes(analysis.stats.totalSize)}`);

  if (Object.keys(analysis.stats.byExtension).length > 0) {
    sections.push(`\n## File Types`);
    for (const [ext, count] of Object.entries(analysis.stats.byExtension).slice(0, 10)) {
      sections.push(`- ${ext}: ${count} files`);
    }
  }

  if (analysis.techStack.length > 0) {
    sections.push(`\n## Detected Technologies`);
    sections.push(analysis.techStack.join(', '));
  }

  if (analysis.entryPoints.length > 0) {
    sections.push(`\n## Entry Points`);
    sections.push(analysis.entryPoints.join(', '));
  }

  if (Object.keys(analysis.dependencies.dependencies).length > 0) {
    sections.push(`\n## Key Dependencies`);
    const deps = Object.keys(analysis.dependencies.dependencies).slice(0, 15);
    sections.push(deps.join(', '));
  }

  sections.push(`\n## Directory Structure`);
  sections.push(`- Depth: ${analysis.structure.depth} levels`);
  sections.push(`- Directories: ${analysis.structure.directories.slice(0, 10).join(', ')}`);

  if (analysis.categories.code.length > 0) {
    sections.push(`\n## Key Source Files`);
    sections.push(analysis.categories.code.slice(0, 10).map((f) => `- ${f}`).join('\n'));
  }

  return sections.join('\n');
}

/**
 * Build prompt for module summary
 * @param {Object} data - Module data
 * @returns {string} - Formatted prompt
 */
function buildModulePrompt(data) {
  const { content, parsed, filePath } = data;
  const sections = [];

  sections.push(`# File: ${parsed.fileName}`);
  sections.push(`- Path: ${filePath}`);
  sections.push(`- Lines: ${parsed.lines}`);
  sections.push(`- Size: ${formatBytes(parsed.size)}`);

  if (parsed.imports.length > 0) {
    sections.push(`\n## Imports (${parsed.imports.length})`);
    for (const imp of parsed.imports.slice(0, 10)) {
      sections.push(`- ${imp.source}`);
    }
  }

  if (parsed.exports.length > 0) {
    sections.push(`\n## Exports (${parsed.exports.length})`);
    for (const exp of parsed.exports) {
      sections.push(`- ${exp.type}: ${exp.name}`);
    }
  }

  if (parsed.functions.length > 0) {
    sections.push(`\n## Functions (${parsed.functions.length})`);
    for (const func of parsed.functions.slice(0, 15)) {
      const params = func.params?.join(', ') || '';
      const modifiers = [
        func.async && 'async',
        func.exported && 'exported',
        func.arrow && 'arrow',
      ].filter(Boolean).join(', ');
      sections.push(`- ${func.name}(${params})${modifiers ? ` [${modifiers}]` : ''}`);
    }
  }

  if (parsed.classes.length > 0) {
    sections.push(`\n## Classes (${parsed.classes.length})`);
    for (const cls of parsed.classes) {
      const ext = cls.superClass ? ` extends ${cls.superClass}` : '';
      sections.push(`- ${cls.name}${ext}`);
      if (cls.methods) {
        for (const method of cls.methods.slice(0, 5)) {
          sections.push(`  - ${method.name}()`);
        }
      }
    }
  }

  // Include a snippet of the actual code (first 100 lines)
  const codeSnippet = content.split('\n').slice(0, 100).join('\n');
  sections.push(`\n## Code Preview\n\`\`\`\n${codeSnippet}\n\`\`\``);

  return sections.join('\n');
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

