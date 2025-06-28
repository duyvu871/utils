/**
 * Directory Listing Command with Progress Tracking
 * ===============================================
 *
 * Enhanced directory analysis command with real-time progress feedback,
 * improved reporting, and better user experience for both console and file output.
 *
 * @author CLI Utils Team
 * @version 2.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../utils/config';
import { logDebug } from '../utils/logger';
import { OutputManager } from '../utils/output';

/**
 * Directory and File Estimation Helper
 * ===================================
 *
 * Estimates total items (files + directories) for progress tracking
 */
function estimateItemCount(dirPath: string, config: Config): number {
  let count = 0;
  const maxDepth = 4; // Increase depth for better estimation

  function countRecursive(currentPath: string, depth: number): void {
    if (depth > maxDepth) return;

    try {
      const items = fs.readdirSync(currentPath);
      const excludePatterns = (config['exclude-patterns'] || []).map(
        (p: string) => new RegExp(p)
      );

      const filteredItems = items.filter((item) => {
        // Quick exclusion check
        if (config.exclude && config.exclude.includes(item)) return false;
        for (const pattern of excludePatterns) {
          if (pattern.test(item)) return false;
        }
        return true;
      });

      count += filteredItems.length; // Count all items (files + dirs)

      // Recursively count subdirectory contents
      filteredItems.forEach((item) => {
        try {
          const itemPath = path.join(currentPath, item);
          if (fs.statSync(itemPath).isDirectory()) {
            countRecursive(itemPath, depth + 1);
          }
        } catch {
          // Ignore errors during estimation
        }
      });
    } catch {
      // Ignore errors during estimation
    }
  }

  countRecursive(dirPath, 0);
  return Math.max(count, 20); // Minimum estimate for progress bar
}

/**
 * Enhanced Recursive Directory Scanner with Progress
 * ================================================
 *
 * Recursively scans directories with real-time progress updates
 * and improved performance tracking.
 */
function listDirRecursive(
  dirPath: string,
  prefix: string,
  config: Config,
  rootScanPath: string,
  outputManager: OutputManager,
  progressTracker: { current: number; total: number }
) {
  let items;

  /**
   * Directory Reading with Error Handling
   * ====================================
   */
  try {
    items = fs.readdirSync(dirPath);
  } catch (error) {
    outputManager.log(
      `${prefix}└── ❓ Error reading directory: ${path.basename(dirPath)}`
    );
    return;
  }

  /**
   * Filter Pattern Compilation
   * ==========================
   */
  const excludePatterns = (config['exclude-patterns'] || []).map(
    (p: string) => new RegExp(p)
  );

  /**
   * Item Filtering Logic
   * ===================
   */
  const filteredItems = items.filter((item) => {
    const itemPath = path.join(dirPath, item);
    const relativePath = path.relative(rootScanPath, itemPath);
    logDebug(`Checking item: ${relativePath}`);

    // Check direct name exclusions
    if (config.exclude && config.exclude.includes(item)) {
      logDebug(
        `Excluding '${item}' based on direct name match in 'exclude' list.`
      );
      return false;
    }

    // Check regex pattern exclusions
    for (const pattern of excludePatterns) {
      if (pattern.test(item) || pattern.test(relativePath)) {
        logDebug(`Excluding '${item}' based on pattern match: ${pattern}`);
        return false;
      }
    }

    return true;
  });

  /**
   * Tree Structure Generation with Progress Updates
   * ==============================================
   */
  filteredItems.forEach((item, index) => {
    const itemPath = path.join(dirPath, item);
    const isLast = index === filteredItems.length - 1;

    // Calculate tree formatting prefixes
    const newPrefix = prefix + (isLast ? '    ' : '│   ');
    const entryPrefix = prefix + (isLast ? '└── ' : '├── ');

    try {
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        // Directory processing with progress update
        outputManager.log(`${entryPrefix}📂 ${item}`);
        outputManager.getStatisticsCollector().addDirectory();

        // Update progress for directory
        progressTracker.current++;
        outputManager.updateProgress(
          progressTracker.current,
          progressTracker.total
        );

        // Recursive scan of subdirectory
        listDirRecursive(
          itemPath,
          newPrefix,
          config,
          rootScanPath,
          outputManager,
          progressTracker
        );
      } else {
        // File processing with progress update
        outputManager.log(`${entryPrefix}📄 ${item}`);
        outputManager.getStatisticsCollector().addFile(itemPath, stats.size);

        // Update progress for file
        progressTracker.current++;
        outputManager.updateProgress(
          progressTracker.current,
          progressTracker.total
        );
      }
    } catch (error: any) {
      // Handle file system errors
      outputManager.log(`${entryPrefix}❓ ${item} (error: ${error.message})`);
    }
  });
}

/**
 * Enhanced List Directory Command Executor
 * =======================================
 *
 * Main entry point with improved flow and progress tracking
 */
export async function executeListDir(options: {
  path?: string;
  config: Config;
}) {
  /**
   * Path Resolution and Validation
   * ==============================
   */
  const scanPath = options.path || options.config.path || '.';
  const rootPath = path.resolve(scanPath);
  const rootDirName = path.basename(rootPath);
  logDebug(`Final scan path determined: ${rootPath}`);

  /**
   * Output Manager Initialization
   * ============================
   */
  const outputManager = new OutputManager(
    options.config.outDir,
    options.config.countLines,
    options.config
  );
  logDebug(
    `Output manager initialized with outDir: ${options.config.outDir || 'console'}, countLines: ${options.config.countLines}, topExtensions: ${options.config.topExtensions}`
  );

  try {
    /**
     * Directory Validation
     * ===================
     */
    const stats = fs.statSync(rootPath);
    if (!stats.isDirectory()) {
      console.error('❌ Error: The specified path is not a directory.');
      process.exit(1);
    }

    /**
     * Progress Setup Phase
     * ==================
     */
    console.log('🔍 Analyzing directory structure...');

    // Estimate directory count for progress tracking
    const estimatedItems = estimateItemCount(rootPath, options.config);
    logDebug(`Estimated items: ${estimatedItems}`);

    // Always show progress bar on console (even when saving to file)
    outputManager.startScanProgress('Scanning directories and files');
    const progressTracker = { current: 0, total: estimatedItems };

    /**
     * Scanning Phase with Progress
     * ==========================
     */
    if (!options.config.outDir) {
      // For console-only output, don't log tree during scanning to avoid conflicts with progress bar
      const tempLog = outputManager.log;
      outputManager.log = () => {}; // Temporarily disable logging

      outputManager.getStatisticsCollector().addDirectory(); // Count root directory
      listDirRecursive(
        rootPath,
        '',
        options.config,
        rootPath,
        outputManager,
        progressTracker
      );

      outputManager.log = tempLog; // Restore logging
    } else {
      // For file output, collect tree structure but don't show progress conflicts
      const tempLog = outputManager.log;
      outputManager.log = (message: string) => {
        // Only store in outputs array, don't console.log during scanning
        (outputManager as any).outputs.push(message);
      };

      outputManager.log(`📦 ${rootDirName}`);
      listDirRecursive(
        rootPath,
        '',
        options.config,
        rootPath,
        outputManager,
        progressTracker
      );

      outputManager.log = tempLog; // Restore logging
    }

    // Always complete progress tracking and show completion
    outputManager.completeProgress();
    console.log('✅ Scanning completed!\n');

    /**
     * Results Display Phase
     * ===================
     */
    // Always show summary and extension table on console
    console.log('📊 Generating analysis report...\n');

    // Show statistics on console using terminal report format
    const terminalStats = outputManager
      .getStatisticsCollector()
      .generateTerminalReport();
    terminalStats.forEach((line) => console.log(line));

    if (options.config.outDir) {
      // For file output: prepare file content with tree structure
      const tempOutputs = [...(outputManager as any).outputs];
      (outputManager as any).outputs = [];

      // Add statistics section to file output
      outputManager.logStatistics();
      outputManager.log('\n🌳 DIRECTORY TREE:');
      outputManager.log('='.repeat(80));
      outputManager.log('');

      // Add the tree structure
      tempOutputs.forEach((line) => outputManager.log(line));
    }

    /**
     * Output Finalization
     * ==================
     */
    await outputManager.flush(rootDirName);

    /**
     * Success Summary
     * ==============
     */
    const finalStats = outputManager.getStatisticsCollector().getStats();
    console.log('\n✅ Analysis completed successfully!');
    console.log(
      `📁 Scanned: ${finalStats.totalDirectories.toLocaleString()} directories, ${finalStats.totalFiles.toLocaleString()} files`
    );
    console.log(
      `💾 Total size: ${outputManager.getProgressManager().formatBytes(finalStats.totalSize)}`
    );

    if (options.config.countLines && finalStats.totalLines.total > 0) {
      console.log(
        `📝 Code analysis: ${finalStats.totalLines.total.toLocaleString()} lines (${finalStats.codeFileCount} files)`
      );
    }
  } catch (error: any) {
    /**
     * Error Handling
     * =============
     */
    // Stop any running progress
    outputManager.completeProgress();

    if (error.code === 'ENOENT') {
      console.error(`❌ Error: Directory not found at path: ${rootPath}`);
    } else {
      console.error('❌ An unexpected error occurred:', error.message);
    }
    process.exit(1);
  }
}
