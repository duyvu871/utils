/**
 * Progress Manager Utility
 * ========================
 * 
 * Handles progress bars, table formatting, and enhanced reporting
 * for directory scanning operations with real-time feedback.
 * 
 * @author CLI Utils Team
 * @version 1.0.0
 */

import * as cliProgress from 'cli-progress';
import CliTable3 from 'cli-table3';

/**
 * Progress Bar Configuration
 * =========================
 * 
 * Standard configuration for progress bars with consistent styling
 */
const PROGRESS_BAR_CONFIG = {
  format: '🔍 {task} |{bar}| {percentage}% | {value}/{total} | ETA: {eta}s',
  barCompleteChar: '█',
  barIncompleteChar: '░',
  hideCursor: true,
  clearOnComplete: false,
  stopOnComplete: true,
  fps: 10,
  stream: process.stdout,
  forceRedraw: false
};

/**
 * Progress Manager Class
 * =====================
 * 
 * Manages multiple progress bars and provides table formatting utilities
 */
export class ProgressManager {
  private progressBar: cliProgress.SingleBar | null = null;
  private multiBar: cliProgress.MultiBar | null = null;
  private isConsoleOutput: boolean;

  constructor(isConsoleOutput: boolean = true) {
    this.isConsoleOutput = isConsoleOutput;
  }

  /**
   * Start Simple Progress Bar
   * ========================
   * 
   * Starts a single progress bar for basic operations
   */
  startProgress(task: string, total: number): void {
    if (!this.isConsoleOutput) return;

    this.progressBar = new cliProgress.SingleBar({
      ...PROGRESS_BAR_CONFIG,
      format: PROGRESS_BAR_CONFIG.format.replace('{task}', task)
    }, cliProgress.Presets.shades_classic);
    
    this.progressBar.start(total, 0);
  }

  /**
   * Update Progress Bar
   * ==================
   * 
   * Updates progress bar value with optional payload
   */
  updateProgress(value: number, payload?: any): void {
    if (!this.isConsoleOutput || !this.progressBar) return;
    this.progressBar.update(value, payload);
  }

  /**
   * Stop Progress Bar
   * ================
   * 
   * Stops and cleans up progress bar
   */
  stopProgress(): void {
    if (!this.isConsoleOutput || !this.progressBar) return;
    this.progressBar.stop();
    this.progressBar = null;
  }

  /**
   * Start Multi-Phase Progress
   * =========================
   * 
   * Starts multi-bar progress for complex operations
   */
  startMultiProgress(): cliProgress.MultiBar | null {
    if (!this.isConsoleOutput) return null;

    this.multiBar = new cliProgress.MultiBar({
      clearOnComplete: false,
      hideCursor: true,
      format: '🔍 {task} |{bar}| {percentage}% | {value}/{total}'
    }, cliProgress.Presets.shades_grey);

    return this.multiBar;
  }

  /**
   * Stop Multi-Phase Progress
   * ========================
   * 
   * Stops all progress bars in multi-bar setup
   */
  stopMultiProgress(): void {
    if (!this.isConsoleOutput || !this.multiBar) return;
    this.multiBar.stop();
    this.multiBar = null;
  }

  /**
   * Create Statistics Table
   * ======================
   * 
   * Creates a formatted table for directory statistics
   */
  createStatsTable(): CliTable3.Table {
    return new CliTable3({
      head: ['📊 Metric', '📈 Value', '📋 Details'],
      colWidths: [25, 15, 30],
      style: {
        head: ['cyan'],
        border: ['grey']
      },
      chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
        'right': '║', 'right-mid': '╢', 'middle': '│'
      }
    });
  }

  /**
   * Create Extension Table
   * =====================
   * 
   * Creates a formatted table for file extension breakdown
   */
  createExtensionTable(): CliTable3.Table {
    return new CliTable3({
      head: ['🗂️ Extension', '📊 Count', '📏 Size', '📈 %', '📝 Lines'],
      colWidths: [15, 10, 12, 8, 12],
      style: {
        head: ['yellow'],
        border: ['grey']
      },
      chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
        'right': '║', 'right-mid': '╢', 'middle': '│'
      }
    });
  }

  /**
   * Create File Ranking Table
   * ========================
   * 
   * Creates a formatted table for largest files ranking
   */
  createFileRankingTable(): CliTable3.Table {
    return new CliTable3({
      head: ['🏆 Rank', '📄 File Name', '💾 Size', '📍 Path'],
      colWidths: [8, 25, 12, 35],
      style: {
        head: ['green'],
        border: ['grey']
      },
      chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
        'right': '║', 'right-mid': '╢', 'middle': '│'
      }
    });
  }

  /**
   * Create Line Count Summary Table
   * ==============================
   * 
   * Creates a formatted table for line counting statistics
   */
  createLineCountTable(): CliTable3.Table {
    return new CliTable3({
      head: ['📝 Line Type', '🔢 Count', '📊 Percentage'],
      colWidths: [20, 15, 15],
      style: {
        head: ['magenta'],
        border: ['grey']
      },
      chars: {
        'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
        'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
        'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
        'right': '║', 'right-mid': '╢', 'middle': '│'
      }
    });
  }

  /**
   * Format File Size
   * ===============
   * 
   * Formats bytes into human-readable format
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Format Number with Commas
   * ========================
   * 
   * Formats large numbers with thousand separators
   */
  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  /**
   * Format Percentage
   * ================
   * 
   * Formats percentage with one decimal place
   */
  formatPercentage(value: number, total: number): string {
    if (total === 0) return '0.0%';
    return ((value / total) * 100).toFixed(1) + '%';
  }
}