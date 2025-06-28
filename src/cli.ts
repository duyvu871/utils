#!/usr/bin/env node

/**
 * Node.js CLI Utils - Main Entry Point
 * ====================================
 * 
 * Công cụ CLI đa năng cho việc phân tích và quản lý project structure.
 * Hiện tại hỗ trợ:
 * - list-dir: Hiển thị cấu trúc thư mục dạng tree với thống kê chi tiết
 * 
 * @author CLI Utils Team
 * @version 1.0.0
 */

import { Command } from 'commander';
import { loadConfig } from './utils/config';
import { executeListDir } from './commands/listDir';
import { enableDebug, logDebug } from './utils/logger';

/**
 * Khởi tạo Commander.js program
 * Commander.js là library để xây dựng CLI applications
 */
const program = new Command();

/**
 * Cấu hình global options và hooks
 * ================================
 * 
 * Global options áp dụng cho tất cả commands
 * Hooks chạy trước khi execute command
 */
program
  // Debug option - bật logging chi tiết
  .option('--debug', 'Enable debug mode for detailed logging', false)
  
  /**
   * Pre-action hook - chạy trước mọi command
   * Xử lý global options như debug mode
   */
  .hook('preAction', (thisCommand, actionCommand) => {
    // Lấy debug option từ parent command
    if (thisCommand.opts().debug) {
      enableDebug();
      logDebug('Debug mode enabled.');
    }
  });

/**
 * Command: list-dir
 * =================
 * 
 * Hiển thị cấu trúc thư mục dạng tree với các tính năng:
 * - Icons cho files/folders
 * - Filtering với patterns
 * - Thống kê chi tiết (file count, size, line count)
 * - Export ra file
 */
program
  .command('list-dir')
  .description('List files and directories in a tree-like format')
  
  /**
   * Command-specific options
   * -P: Đường dẫn thư mục cần scan
   * -C: File config YAML với exclusion rules
   */
  .option('-P, --path <dirPath>', 'Path to the directory to scan')
  .option('-C, --config <configPath>', 'Path to a YAML configuration file')
  
  /**
   * Action handler - logic chính của command
   * @param {Object} options - Parsed command line options
   */
  .action(async (options) => {
    logDebug('Executing "list-dir" with options:', options);
    
    // Load configuration từ file hoặc sử dụng default
    const config = loadConfig(options.config);
    
    // Execute command với merged options
    await executeListDir({ path: options.path, config });
  });

/**
 * Parse command line arguments và execute
 * process.argv chứa tất cả arguments được truyền vào
 */
program.parse(process.argv); 