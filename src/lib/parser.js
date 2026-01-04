import * as acorn from 'acorn';
import * as walk from 'acorn-walk';
import path from 'path';

/**
 * Parse a file and extract its structure
 * @param {string} filePath - Path to the file
 * @param {string} content - File content
 * @param {Object} options - Parsing options
 * @returns {Promise<Object>} - Parsed structure
 */
export async function parseFile(filePath, content, options = {}) {
  const ext = path.extname(filePath);
  const result = {
    filePath,
    fileName: path.basename(filePath),
    extension: ext,
    lines: content.split('\n').length,
    size: content.length,
    exports: [],
    imports: [],
    functions: [],
    classes: [],
    variables: [],
    comments: [],
    ast: null,
  };

  // Parse based on file type
  if (['.js', '.mjs', '.cjs'].includes(ext)) {
    return parseJavaScript(content, result, options);
  } else if (['.ts', '.tsx'].includes(ext)) {
    // For TypeScript, we do a basic parse (would need @typescript-eslint/parser for full support)
    return parseJavaScript(content, result, options);
  } else if (['.jsx'].includes(ext)) {
    return parseJavaScript(content, result, options);
  } else if (ext === '.py') {
    return parsePython(content, result);
  } else if (ext === '.json') {
    return parseJSON(content, result);
  }

  // For unsupported files, return basic info
  return result;
}

/**
 * Parse JavaScript/TypeScript files
 * @param {string} content - File content
 * @param {Object} result - Result object to populate
 * @param {Object} options - Parsing options
 * @returns {Object} - Parsed structure
 */
function parseJavaScript(content, result, options = {}) {
  try {
    const ast = acorn.parse(content, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true,
      onComment: (block, text, start, end) => {
        result.comments.push({
          type: block ? 'block' : 'line',
          value: text.trim(),
          start,
          end,
        });
      },
    });

    if (options.showAst) {
      result.ast = ast;
    }

    // Walk the AST to extract structure
    walk.simple(ast, {
      ImportDeclaration(node) {
        result.imports.push({
          source: node.source.value,
          specifiers: node.specifiers.map((s) => ({
            type: s.type,
            name: s.local.name,
            imported: s.imported?.name,
          })),
          line: node.loc.start.line,
        });
      },

      ExportNamedDeclaration(node) {
        if (node.declaration) {
          if (node.declaration.type === 'FunctionDeclaration') {
            result.exports.push({
              type: 'function',
              name: node.declaration.id?.name,
              line: node.loc.start.line,
            });
          } else if (node.declaration.type === 'VariableDeclaration') {
            for (const decl of node.declaration.declarations) {
              result.exports.push({
                type: 'variable',
                name: decl.id.name,
                line: node.loc.start.line,
              });
            }
          } else if (node.declaration.type === 'ClassDeclaration') {
            result.exports.push({
              type: 'class',
              name: node.declaration.id?.name,
              line: node.loc.start.line,
            });
          }
        }
        if (node.specifiers) {
          for (const spec of node.specifiers) {
            result.exports.push({
              type: 'reexport',
              name: spec.exported.name,
              line: node.loc.start.line,
            });
          }
        }
      },

      ExportDefaultDeclaration(node) {
        result.exports.push({
          type: 'default',
          name: node.declaration.name || node.declaration.id?.name || 'anonymous',
          line: node.loc.start.line,
        });
      },

      FunctionDeclaration(node) {
        result.functions.push({
          name: node.id?.name || 'anonymous',
          params: node.params.map((p) => p.name || p.left?.name || 'param'),
          async: node.async,
          generator: node.generator,
          line: node.loc.start.line,
          exported: false,
        });
      },

      ClassDeclaration(node) {
        const methods = [];
        if (node.body && node.body.body) {
          for (const item of node.body.body) {
            if (item.type === 'MethodDefinition') {
              methods.push({
                name: item.key.name,
                kind: item.kind,
                static: item.static,
              });
            }
          }
        }

        result.classes.push({
          name: node.id?.name,
          superClass: node.superClass?.name,
          methods,
          line: node.loc.start.line,
        });
      },

      VariableDeclaration(node) {
        for (const decl of node.declarations) {
          if (decl.id.type === 'Identifier') {
            const isFunction = decl.init && 
              (decl.init.type === 'ArrowFunctionExpression' || 
               decl.init.type === 'FunctionExpression');

            if (isFunction) {
              result.functions.push({
                name: decl.id.name,
                params: decl.init.params.map((p) => p.name || p.left?.name || 'param'),
                async: decl.init.async,
                arrow: decl.init.type === 'ArrowFunctionExpression',
                line: node.loc.start.line,
              });
            } else {
              result.variables.push({
                name: decl.id.name,
                kind: node.kind,
                line: node.loc.start.line,
              });
            }
          }
        }
      },
    });

    // Mark exported functions
    const exportedNames = new Set(result.exports.map((e) => e.name));
    for (const func of result.functions) {
      func.exported = exportedNames.has(func.name);
    }
    for (const cls of result.classes) {
      cls.exported = exportedNames.has(cls.name);
    }

  } catch (err) {
    result.parseError = err.message;
  }

  return result;
}

/**
 * Parse Python files (basic regex-based parsing)
 * @param {string} content - File content
 * @param {Object} result - Result object to populate
 * @returns {Object} - Parsed structure
 */
function parsePython(content, result) {
  const lines = content.split('\n');

  // Find imports
  const importRegex = /^(?:from\s+(\S+)\s+)?import\s+(.+)$/;
  // Find function definitions
  const funcRegex = /^(\s*)def\s+(\w+)\s*\(([^)]*)\)/;
  // Find class definitions
  const classRegex = /^class\s+(\w+)(?:\(([^)]*)\))?:/;
  // Find variable assignments at module level
  const varRegex = /^([A-Z_][A-Z0-9_]*)\s*=/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const importMatch = line.match(importRegex);
    if (importMatch) {
      result.imports.push({
        source: importMatch[1] || importMatch[2],
        line: lineNum,
      });
      continue;
    }

    const funcMatch = line.match(funcRegex);
    if (funcMatch) {
      const indent = funcMatch[1].length;
      result.functions.push({
        name: funcMatch[2],
        params: funcMatch[3].split(',').map((p) => p.trim()).filter(Boolean),
        line: lineNum,
        isMethod: indent > 0,
      });
      continue;
    }

    const classMatch = line.match(classRegex);
    if (classMatch) {
      result.classes.push({
        name: classMatch[1],
        superClass: classMatch[2],
        line: lineNum,
      });
      continue;
    }

    const varMatch = line.match(varRegex);
    if (varMatch) {
      result.variables.push({
        name: varMatch[1],
        line: lineNum,
      });
    }
  }

  return result;
}

/**
 * Parse JSON files
 * @param {string} content - File content
 * @param {Object} result - Result object to populate
 * @returns {Object} - Parsed structure
 */
function parseJSON(content, result) {
  try {
    const json = JSON.parse(content);
    result.structure = getJSONStructure(json);
  } catch (err) {
    result.parseError = err.message;
  }
  return result;
}

/**
 * Get structure of a JSON object
 * @param {any} obj - JSON object
 * @param {number} depth - Current depth
 * @returns {Object} - Structure description
 */
function getJSONStructure(obj, depth = 0) {
  if (depth > 3) return '...';

  if (Array.isArray(obj)) {
    return {
      type: 'array',
      length: obj.length,
      items: obj.length > 0 ? getJSONStructure(obj[0], depth + 1) : null,
    };
  }

  if (obj && typeof obj === 'object') {
    const structure = {};
    for (const key of Object.keys(obj).slice(0, 10)) {
      structure[key] = getJSONStructure(obj[key], depth + 1);
    }
    if (Object.keys(obj).length > 10) {
      structure['...'] = `${Object.keys(obj).length - 10} more keys`;
    }
    return { type: 'object', keys: structure };
  }

  return typeof obj;
}

