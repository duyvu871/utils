import * as fs from 'fs';
import * as path from 'path';
import { logDebug } from './logger';

export interface LineCount {
  total: number;
  code: number;
  comments: number;
  blank: number;
}

export interface FileLineInfo {
  extension: string;
  lineCount: LineCount;
  isCodeFile: boolean;
}

export class LineCounter {
  // Define code file extensions
  private static readonly CODE_EXTENSIONS = new Set([
    '.js',
    '.jsx',
    '.ts',
    '.tsx',
    '.java',
    '.py',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.php',
    '.rb',
    '.go',
    '.rs',
    '.swift',
    '.kt',
    '.scala',
    '.dart',
    '.vue',
    '.svelte',
    '.html',
    '.css',
    '.scss',
    '.sass',
    '.less',
    '.sql',
    '.xml',
    '.json',
    '.yaml',
    '.yml',
    '.toml',
    '.ini',
    '.conf',
    '.sh',
    '.bat',
    '.ps1',
    '.r',
    '.m',
    '.pl',
    '.lua',
    '.vim',
    '.dockerfile',
    '.makefile',
  ]);

  // Comment patterns for different languages
  private static readonly COMMENT_PATTERNS = {
    // Single line comments
    singleLine: [
      /^\s*\/\/.*$/, // JavaScript, Java, C++, etc.
      /^\s*#.*$/, // Python, Ruby, Shell, etc.
      /^\s*--.*$/, // SQL, Haskell, etc.
      /^\s*;.*$/, // Assembly, Lisp, etc.
      /^\s*'.*$/, // VB.NET, etc.
      /^\s*\*.*$/, // Some configs
    ],
    // Multi-line comment start
    multiLineStart: [
      /^\s*\/\*.*$/, // C-style
      /^\s*<!--.*$/, // HTML, XML
      /^\s*""".*$/, // Python docstrings
      /^\s*'''.*$/, // Python docstrings
    ],
    // Multi-line comment end
    multiLineEnd: [
      /.*\*\/\s*$/, // C-style
      /.*-->\s*$/, // HTML, XML
      /.*"""\s*$/, // Python docstrings
      /.*'''\s*$/, // Python docstrings
    ],
  };

  static countLinesInFile(filePath: string): FileLineInfo | null {
    try {
      const ext = path.extname(filePath).toLowerCase();
      const isCodeFile = this.CODE_EXTENSIONS.has(ext);

      logDebug(
        `Processing file: ${filePath}, extension: ${ext}, isCodeFile: ${isCodeFile}`
      );

      if (!isCodeFile) {
        // For non-code files, just count total lines
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        logDebug(`Non-code file ${filePath}: ${lines.length} total lines`);
        return {
          extension: ext || '(no extension)',
          lineCount: {
            total: lines.length,
            code: 0,
            comments: 0,
            blank: 0,
          },
          isCodeFile: false,
        };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');

      let codeLines = 0;
      let commentLines = 0;
      let blankLines = 0;
      let inMultiLineComment = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (trimmedLine === '') {
          blankLines++;
          continue;
        }

        // Check for multi-line comment end first
        if (inMultiLineComment) {
          commentLines++;
          if (
            this.COMMENT_PATTERNS.multiLineEnd.some((pattern) =>
              pattern.test(line)
            )
          ) {
            inMultiLineComment = false;
          }
          continue;
        }

        // Check for multi-line comment start
        if (
          this.COMMENT_PATTERNS.multiLineStart.some((pattern) =>
            pattern.test(line)
          )
        ) {
          commentLines++;
          inMultiLineComment = true;
          // Check if it also ends on the same line
          if (
            this.COMMENT_PATTERNS.multiLineEnd.some((pattern) =>
              pattern.test(line)
            )
          ) {
            inMultiLineComment = false;
          }
          continue;
        }

        // Check for single-line comments
        if (
          this.COMMENT_PATTERNS.singleLine.some((pattern) => pattern.test(line))
        ) {
          commentLines++;
          continue;
        }

        // If we get here, it's a code line
        codeLines++;
      }

      const result: FileLineInfo = {
        extension: ext || '(no extension)',
        lineCount: {
          total: lines.length,
          code: codeLines,
          comments: commentLines,
          blank: blankLines,
        },
        isCodeFile: true,
      };

      logDebug(
        `Code file ${filePath}: total=${result.lineCount.total}, code=${result.lineCount.code}, comments=${result.lineCount.comments}, blank=${result.lineCount.blank}`
      );
      return result;
    } catch (error: any) {
      logDebug(`Error counting lines in ${filePath}: ${error.message}`);
      return null;
    }
  }

  static isCodeFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return this.CODE_EXTENSIONS.has(ext);
  }
}
