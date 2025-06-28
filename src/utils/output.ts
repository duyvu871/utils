/**
 * Output Manager with Progress Tracking
 * ===================================
 *
 * Enhanced output manager with progress bars and different report formats
 * for console vs file output, providing better user experience.
 *
 * @author CLI Utils Team
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { logDebug } from './logger';
import { StatisticsCollector } from './statistics';
import { ProgressManager } from './progressManager';
import { Config } from './config';

export class OutputManager {
  private outputs: string[] = [];
  private outDir?: string;
  private statisticsCollector: StatisticsCollector;
  private progressManager: ProgressManager;
  private isConsoleOutput: boolean;

  constructor(outDir?: string, countLines: boolean = false, config?: Config) {
    this.outDir = outDir;
    this.isConsoleOutput = !outDir; // Console output if no outDir specified

    // Use default config if not provided
    const defaultConfig: Config = {
      path: '.',
      countLines: false,
      exclude: ['node_modules', '.git'],
      'exclude-patterns': [],
      topExtensions: 8,
    };

    const finalConfig = config || defaultConfig;
    this.statisticsCollector = new StatisticsCollector(
      countLines,
      this.isConsoleOutput,
      finalConfig
    );
    this.progressManager = new ProgressManager(this.isConsoleOutput);
  }

  getStatisticsCollector(): StatisticsCollector {
    return this.statisticsCollector;
  }

  getProgressManager(): ProgressManager {
    return this.progressManager;
  }

  /**
   * Enhanced Logging with Progress Support
   * ====================================
   *
   * Logs messages with support for progress tracking
   */
  log(message: string) {
    if (this.outDir) {
      // Store output for later writing to file
      this.outputs.push(message);
    } else {
      // Write to console immediately
      console.log(message);
    }
  }

  /**
   * Progress-Aware Statistics Logging
   * ================================
   *
   * Logs statistics using appropriate format based on output destination
   */
  logStatistics() {
    if (this.isConsoleOutput) {
      // Use simplified terminal format for console
      const statsReport = this.statisticsCollector.generateTerminalReport();
      statsReport.forEach((line: string) => this.log(line));
    } else {
      // Use simplified format for file output
      const statsReport = this.statisticsCollector.generateSimpleReport();
      statsReport.forEach((line: string) => this.log(line));
    }
  }

  /**
   * Start Directory Scanning Progress
   * ===============================
   *
   * Initializes progress tracking for directory scanning
   */
  startScanProgress(message: string = 'Scanning directories') {
    this.progressManager.startProgress(message, 100);
  }

  /**
   * Update Scanning Progress
   * =====================
   *
   * Updates the progress bar during scanning
   */
  updateProgress(current: number, total: number) {
    if (total > 0) {
      const percentage = Math.min(Math.round((current / total) * 100), 100);
      this.progressManager.updateProgress(percentage);
    }
  }

  /**
   * Complete Progress Tracking
   * ========================
   *
   * Finalizes progress tracking and cleanup
   */
  completeProgress() {
    this.progressManager.stopProgress();

    // Add a clean separation after progress bar
    if (this.isConsoleOutput) {
      console.log(''); // Empty line for better spacing
    }
  }

  /**
   * Enhanced File Output with Metadata
   * ================================
   *
   * Writes enhanced output to file with metadata and timestamps
   */
  async flush(rootDirName: string) {
    if (!this.outDir || this.outputs.length === 0) {
      return;
    }

    try {
      // Ensure output directory exists
      const resolvedOutDir = path.resolve(this.outDir);
      if (!fs.existsSync(resolvedOutDir)) {
        fs.mkdirSync(resolvedOutDir, { recursive: true });
        logDebug(`Created output directory: ${resolvedOutDir}`);
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${rootDirName}-analysis-${timestamp}.txt`;
      const filepath = path.join(resolvedOutDir, filename);

      // Prepare enhanced file content with metadata
      const metadata = this.generateMetadata(rootDirName);
      const content = [
        ...metadata,
        '',
        '='.repeat(80),
        '',
        ...this.outputs,
      ].join('\n');

      // Write all collected output to file
      fs.writeFileSync(filepath, content, 'utf8');

      console.log(`✅ Directory analysis saved to: ${filepath}`);
      console.log(
        `📊 Report size: ${this.progressManager.formatBytes(Buffer.byteLength(content, 'utf8'))}`
      );
      logDebug(`Output file size: ${content.length} characters`);
    } catch (error: any) {
      console.error(`❌ Error writing output file: ${error.message}`);
      // Fallback: output to console
      console.log('\n--- Directory Analysis ---');
      this.outputs.forEach((line) => console.log(line));
    }
  }

  /**
   * Generate File Metadata
   * =====================
   *
   * Creates metadata header for file output
   */
  private generateMetadata(rootDirName: string): string[] {
    const now = new Date();
    const stats = this.statisticsCollector.getStats();

    return [
      '📁 DIRECTORY ANALYSIS REPORT',
      '='.repeat(80),
      '',
      `📊 Report Details:`,
      `   🎯 Target Directory: ${rootDirName}`,
      `   📅 Generated: ${now.toLocaleString()}`,
      `   🌍 Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`,
      `   💻 Platform: ${process.platform} ${process.arch}`,
      `   📄 Total Files: ${stats.totalFiles.toLocaleString()}`,
      `   📁 Total Directories: ${stats.totalDirectories.toLocaleString()}`,
      `   💾 Total Size: ${this.progressManager.formatBytes(stats.totalSize)}`,
      '',
      `🛠️ Generated by: Node Utils CLI v${process.env.npm_package_version || '1.0.0'}`,
      `📚 Documentation: https://github.com/duyvu871/utils-scripts#readme`,
    ];
  }
}
