import * as fs from 'fs';
import * as path from 'path';
import { LineCounter, FileLineInfo, LineCount } from './lineCounter';
import { logDebug } from './logger';
import { ProgressManager } from './progressManager';
import { Config } from './config';

export interface FileStats {
  totalFiles: number;
  totalDirectories: number;
  totalSize: number;
  filesByExtension: Map<string, number>;
  sizeByExtension: Map<string, number>;
  largestFiles: Array<{ name: string; size: number; path: string }>;
  deepestPath: { path: string; depth: number };
  avgFileSize: number;
  // Line counting stats
  totalLines: LineCount;
  linesByExtension: Map<string, LineCount>;
  codeFileCount: number;
  nonCodeFileCount: number;
}

export class StatisticsCollector {
  private stats: FileStats = {
    totalFiles: 0,
    totalDirectories: 0,
    totalSize: 0,
    filesByExtension: new Map(),
    sizeByExtension: new Map(),
    largestFiles: [],
    deepestPath: { path: '', depth: 0 },
    avgFileSize: 0,
    totalLines: { total: 0, code: 0, comments: 0, blank: 0 },
    linesByExtension: new Map(),
    codeFileCount: 0,
    nonCodeFileCount: 0,
  };

  private countLines: boolean = false;
  private progressManager: ProgressManager;
  private config: Config;

  constructor(countLines: boolean = false, isConsoleOutput: boolean = true, config: Config) {
    this.countLines = countLines;
    this.progressManager = new ProgressManager(isConsoleOutput);
    this.config = config;
  }

  addFile(filePath: string, size: number) {
    this.stats.totalFiles++;
    this.stats.totalSize += size;

    // Track extension
    const ext = path.extname(filePath).toLowerCase() || '(no extension)';
    this.stats.filesByExtension.set(ext, (this.stats.filesByExtension.get(ext) || 0) + 1);
    this.stats.sizeByExtension.set(ext, (this.stats.sizeByExtension.get(ext) || 0) + size);

    // Count lines if enabled
    if (this.countLines) {
      logDebug(`Attempting to count lines for: ${filePath}`);
      const lineInfo = LineCounter.countLinesInFile(filePath);
      if (lineInfo) {
        logDebug(`Line info result for ${filePath}:`, lineInfo);
        if (lineInfo.isCodeFile) {
          this.stats.codeFileCount++;
          logDebug(`Code file count incremented to: ${this.stats.codeFileCount}`);
        } else {
          this.stats.nonCodeFileCount++;
          logDebug(`Non-code file count incremented to: ${this.stats.nonCodeFileCount}`);
        }

        // Add to total lines
        this.stats.totalLines.total += lineInfo.lineCount.total;
        this.stats.totalLines.code += lineInfo.lineCount.code;
        this.stats.totalLines.comments += lineInfo.lineCount.comments;
        this.stats.totalLines.blank += lineInfo.lineCount.blank;

        logDebug(`Updated total lines:`, this.stats.totalLines);

        // Add to extension-specific lines
        const existingLines = this.stats.linesByExtension.get(ext) || 
          { total: 0, code: 0, comments: 0, blank: 0 };
        
        this.stats.linesByExtension.set(ext, {
          total: existingLines.total + lineInfo.lineCount.total,
          code: existingLines.code + lineInfo.lineCount.code,
          comments: existingLines.comments + lineInfo.lineCount.comments,
          blank: existingLines.blank + lineInfo.lineCount.blank,
        });
      } else {
        logDebug(`Failed to get line info for: ${filePath}`);
      }
    }

    // Track largest files (keep top 5)
    this.stats.largestFiles.push({ 
      name: path.basename(filePath), 
      size, 
      path: filePath 
    });
    this.stats.largestFiles.sort((a, b) => b.size - a.size);
    if (this.stats.largestFiles.length > 5) {
      this.stats.largestFiles = this.stats.largestFiles.slice(0, 5);
    }

    // Track deepest path
    const depth = filePath.split(path.sep).length;
    if (depth > this.stats.deepestPath.depth) {
      this.stats.deepestPath = { path: filePath, depth };
    }
  }

  addDirectory() {
    this.stats.totalDirectories++;
  }

  finalize() {
    this.stats.avgFileSize = this.stats.totalFiles > 0 
      ? this.stats.totalSize / this.stats.totalFiles 
      : 0;
  }

  getStats(): FileStats {
    return this.stats;
  }

  /**
   * Generate Enhanced Report with Tables
   * ===================================
   * 
   * Creates beautifully formatted report using tables for console output
   */
  generateReport(): string[] {
    this.finalize();
    const report: string[] = [];
    
    // Main Statistics Table
    const statsTable = this.progressManager.createStatsTable();
    
    statsTable.push(
      ['📁 Total Directories', this.progressManager.formatNumber(this.stats.totalDirectories), 'Scanned folder count'],
      ['📄 Total Files', this.progressManager.formatNumber(this.stats.totalFiles), 'All file types included']
    );

    if (this.countLines) {
      statsTable.push(
        ['💻 Code Files', this.progressManager.formatNumber(this.stats.codeFileCount), 'Programming language files'],
        ['📋 Other Files', this.progressManager.formatNumber(this.stats.nonCodeFileCount), 'Documentation, config, etc.']
      );
    }

    statsTable.push(
      ['💾 Total Size', this.progressManager.formatBytes(this.stats.totalSize), 'Combined file sizes'],
      ['📏 Average File Size', this.progressManager.formatBytes(this.stats.avgFileSize), 'Size per file metric']
    );

    report.push('📊 DIRECTORY STATISTICS');
    report.push('=' .repeat(80));
    report.push('');
    report.push(statsTable.toString());
    report.push('');

    // Line Count Summary Table (if enabled)
    if (this.countLines && this.stats.totalLines.total > 0) {
      const lineTable = this.progressManager.createLineCountTable();
      
      lineTable.push(
        ['📝 Total Lines', this.progressManager.formatNumber(this.stats.totalLines.total), this.progressManager.formatPercentage(this.stats.totalLines.total, this.stats.totalLines.total)],
        ['💻 Code Lines', this.progressManager.formatNumber(this.stats.totalLines.code), this.progressManager.formatPercentage(this.stats.totalLines.code, this.stats.totalLines.total)],
        ['💬 Comment Lines', this.progressManager.formatNumber(this.stats.totalLines.comments), this.progressManager.formatPercentage(this.stats.totalLines.comments, this.stats.totalLines.total)],
        ['⬜ Blank Lines', this.progressManager.formatNumber(this.stats.totalLines.blank), this.progressManager.formatPercentage(this.stats.totalLines.blank, this.stats.totalLines.total)]
      );

      report.push('📊 LINE COUNT ANALYSIS');
      report.push('=' .repeat(80));
      report.push('');
      report.push(lineTable.toString());
      report.push('');
    }

    // Files by Extension Table
    if (this.stats.filesByExtension.size > 0) {
      const extTable = this.progressManager.createExtensionTable();
      const sortedExtensions = Array.from(this.stats.filesByExtension.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.config.topExtensions); // Show top N extensions
      
      sortedExtensions.forEach(([ext, count]) => {
        const size = this.stats.sizeByExtension.get(ext) || 0;
        const percentage = this.progressManager.formatPercentage(count, this.stats.totalFiles);
        
        let linesDisplay = '-';
        if (this.countLines) {
          const lines = this.stats.linesByExtension.get(ext);
          if (lines && lines.total > 0) {
            linesDisplay = this.progressManager.formatNumber(lines.total);
            if (lines.code > 0) {
              linesDisplay += ` (${this.progressManager.formatNumber(lines.code)} code)`;
            }
          }
        }
        
        extTable.push([
          ext === '(no extension)' ? '(none)' : ext,
          this.progressManager.formatNumber(count),
          this.progressManager.formatBytes(size),
          percentage,
          linesDisplay
        ]);
      });

      report.push(`📋 FILES BY EXTENSION (Top ${Math.min(this.config.topExtensions, sortedExtensions.length)})`);
      report.push('=' .repeat(80));
      report.push('');
      report.push(extTable.toString());
      report.push('');
    }

    // Largest Files Table
    if (this.stats.largestFiles.length > 0) {
      const fileTable = this.progressManager.createFileRankingTable();
      
      this.stats.largestFiles.forEach((file, index) => {
        const rank = `#${index + 1}`;
        const fileName = file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name;
        const size = this.progressManager.formatBytes(file.size);
        const filePath = file.path.length > 30 ? '...' + file.path.substring(file.path.length - 27) : file.path;
        
        fileTable.push([rank, fileName, size, filePath]);
      });

      report.push('🏆 LARGEST FILES');
      report.push('=' .repeat(80));
      report.push('');
      report.push(fileTable.toString());
      report.push('');
    }

    // Deepest Path Info
    if (this.stats.deepestPath.depth > 0) {
      report.push('🔍 PROJECT DEPTH ANALYSIS');
      report.push('=' .repeat(80));
      report.push('');
      report.push(`📊 Maximum Depth: ${this.stats.deepestPath.depth} levels`);
      report.push(`📍 Deepest Path: ${this.stats.deepestPath.path}`);
      report.push('');
    }

    return report;
  }

  /**
   * Generate Simplified Report for File Output
   * =========================================
   * 
   * Creates a simpler text-based report suitable for file output
   */
  generateSimpleReport(): string[] {
    this.finalize();
    const report: string[] = [];
    
    report.push('📊 DIRECTORY STATISTICS');
    report.push('=' .repeat(50));
    report.push('');
    
    // Basic counts
    report.push(`📁 Total Directories: ${this.stats.totalDirectories.toLocaleString()}`);
    report.push(`📄 Total Files: ${this.stats.totalFiles.toLocaleString()}`);
    if (this.countLines) {
      report.push(`💻 Code Files: ${this.stats.codeFileCount.toLocaleString()}`);
      report.push(`📋 Other Files: ${this.stats.nonCodeFileCount.toLocaleString()}`);
    }
    report.push(`💾 Total Size: ${this.formatBytes(this.stats.totalSize)}`);
    report.push(`📏 Average File Size: ${this.formatBytes(this.stats.avgFileSize)}`);
    report.push('');

    // Line count statistics
    if (this.countLines && this.stats.totalLines.total > 0) {
      report.push('📊 LINE COUNT SUMMARY:');
      report.push(`  📝 Total Lines: ${this.stats.totalLines.total.toLocaleString()}`);
      report.push(`  💻 Code Lines: ${this.stats.totalLines.code.toLocaleString()}`);
      report.push(`  💬 Comment Lines: ${this.stats.totalLines.comments.toLocaleString()}`);
      report.push(`  ⬜ Blank Lines: ${this.stats.totalLines.blank.toLocaleString()}`);
      
      if (this.stats.totalLines.total > 0) {
        const codePercentage = ((this.stats.totalLines.code / this.stats.totalLines.total) * 100).toFixed(1);
        const commentPercentage = ((this.stats.totalLines.comments / this.stats.totalLines.total) * 100).toFixed(1);
        report.push(`  📈 Code Ratio: ${codePercentage}% | Comments: ${commentPercentage}%`);
      }
      report.push('');
    }

    // Files by extension
    if (this.stats.filesByExtension.size > 0) {
      report.push('📋 FILES BY EXTENSION:');
      const sortedExtensions = Array.from(this.stats.filesByExtension.entries())
        .sort((a, b) => b[1] - a[1]);
      
      sortedExtensions.forEach(([ext, count]) => {
        const size = this.stats.sizeByExtension.get(ext) || 0;
        const percentage = ((count / this.stats.totalFiles) * 100).toFixed(1);
        let line = `  ${ext.padEnd(15)} ${count.toString().padStart(6)} files (${percentage}%) - ${this.formatBytes(size)}`;
        
        // Add line count info if available
        if (this.countLines) {
          const lines = this.stats.linesByExtension.get(ext);
          if (lines && lines.total > 0) {
            line += ` | ${lines.total.toLocaleString()} lines`;
            if (lines.code > 0) {
              line += ` (${lines.code.toLocaleString()} code)`;
            }
          }
        }
        
        report.push(line);
      });
      report.push('');
    }

    // Largest files
    if (this.stats.largestFiles.length > 0) {
      report.push('📦 LARGEST FILES:');
      this.stats.largestFiles.forEach((file, index) => {
        report.push(`  ${(index + 1)}. ${file.name} - ${this.formatBytes(file.size)}`);
      });
      report.push('');
    }

    // Deepest path
    if (this.stats.deepestPath.depth > 0) {
      report.push(`🔍 DEEPEST PATH (${this.stats.deepestPath.depth} levels):`);
      report.push(`  ${this.stats.deepestPath.path}`);
      report.push('');
    }

    return report;
  }

  /**
   * Generate Terminal Report with Extension Table Only
   * ================================================
   * 
   * Creates a simplified report for terminal with just the extension table
   */
  generateTerminalReport(): string[] {
    this.finalize();
    const report: string[] = [];
    
    // Basic Statistics Summary
    report.push('📊 ANALYSIS SUMMARY');
    report.push('=' .repeat(60));
    report.push(`📁 Directories: ${this.progressManager.formatNumber(this.stats.totalDirectories)} | 📄 Files: ${this.progressManager.formatNumber(this.stats.totalFiles)} | 💾 Size: ${this.progressManager.formatBytes(this.stats.totalSize)}`);
    
    if (this.countLines && this.stats.totalLines.total > 0) {
      report.push(`📝 Total Lines: ${this.progressManager.formatNumber(this.stats.totalLines.total)} | 💻 Code Files: ${this.progressManager.formatNumber(this.stats.codeFileCount)}`);
    }
    report.push('');

    // Files by Extension Table (Top N based on config)
    if (this.stats.filesByExtension.size > 0) {
      const extTable = this.progressManager.createExtensionTable();
      const sortedExtensions = Array.from(this.stats.filesByExtension.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.config.topExtensions); // Show top N for terminal
      
      sortedExtensions.forEach(([ext, count]) => {
        const size = this.stats.sizeByExtension.get(ext) || 0;
        const percentage = this.progressManager.formatPercentage(count, this.stats.totalFiles);
        
        let linesDisplay = '-';
        if (this.countLines) {
          const lines = this.stats.linesByExtension.get(ext);
          if (lines && lines.total > 0) {
            linesDisplay = this.progressManager.formatNumber(lines.total);
          }
        }
        
        extTable.push([
          ext === '(no extension)' ? '(none)' : ext,
          this.progressManager.formatNumber(count),
          this.progressManager.formatBytes(size),
          percentage,
          linesDisplay
        ]);
      });

      report.push(`📋 FILES BY EXTENSION (Top ${Math.min(this.config.topExtensions, sortedExtensions.length)})`);
      report.push(extTable.toString());
      report.push('');
    }

    return report;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
} 