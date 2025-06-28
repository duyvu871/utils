/**
 * Configuration Management
 * ========================
 * 
 * Handles loading and validation of YAML configuration files using Zod schema.
 * Supports both file-based and default configurations.
 * 
 * @author CLI Utils Team
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { z } from 'zod';
import { logDebug } from './logger';

/**
 * Configuration Schema Definition
 * ==============================
 * 
 * Zod schema for validating YAML configuration files.
 * Ensures type safety and provides clear error messages.
 */
const configSchema = z.object({
  /**
   * Target Directory Path
   * ====================
   * Path to directory for analysis (can be relative or absolute)
   */
  path: z.string().default('.'),
  
  /**
   * Output Directory (Optional)
   * ==========================
   * If specified, results will be written to timestamped files
   */
  outDir: z.string().optional(),
  
  /**
   * Line Counting Toggle
   * ===================
   * Enable detailed code line analysis for supported file types
   */
  countLines: z.boolean().default(false),
  
  /**
   * File/Directory Exclusions
   * =========================
   * Direct name matches for exclusion (exact string matching)
   */
  exclude: z.array(z.string()).default(['node_modules', '.git']),
  
  /**
   * Pattern-Based Exclusions
   * ========================
   * Regular expression patterns for flexible exclusion rules
   */
  'exclude-patterns': z.array(z.string()).default([]),

  /**
   * Top Extensions Display Count
   * ===========================
   * Number of top file extensions to show in terminal table (default: 8)
   */
  topExtensions: z.number().min(1).max(20).default(8)
});

/**
 * TypeScript type inference from Zod schema
 * Automatically generates type from schema definition
 */
export type Config = z.infer<typeof configSchema>;

/**
 * Default Configuration
 * ====================
 * 
 * Fallback configuration when no config file is provided.
 * Includes sensible defaults for common use cases.
 */
const defaultConfig: Config = {
  path: '.',
  countLines: false,
  exclude: ['node_modules', '.git'],
  'exclude-patterns': [],
  topExtensions: 8
};

/**
 * Load Configuration from File or Use Defaults
 * ============================================
 * 
 * Attempts to load and validate a YAML configuration file.
 * Falls back to default configuration if no file is provided.
 * 
 * @param configPath - Optional path to YAML config file
 * @returns Validated configuration object
 * @throws Process exit on validation errors or file not found
 */
export function loadConfig(configPath?: string): Config {
  // Use default config if no path provided
  if (!configPath) {
    logDebug('No config path provided, using default configuration.');
    return defaultConfig;
  }

  // Resolve relative path to absolute path
  const resolvedPath = path.resolve(process.cwd(), configPath);
  logDebug(`Attempting to load configuration from: ${resolvedPath}`);

  try {
    // Read and parse YAML file
    const fileContents = fs.readFileSync(resolvedPath, 'utf8');
    const data = yaml.load(fileContents);
    logDebug('Successfully parsed YAML file. Raw data:', data);

    /**
     * Schema Validation
     * ================
     * 
     * Validates the parsed YAML data against the Zod schema.
     * Provides detailed error messages for invalid configurations.
     */
    const validationResult = configSchema.safeParse(data);

    if (!validationResult.success) {
      console.error('❌ Error: Invalid configuration file format.');
      console.error('📋 Validation errors:', validationResult.error.flatten().fieldErrors);
      process.exit(1);
    }
    
    logDebug('✅ Configuration is valid. Final config object:', validationResult.data);
    return validationResult.data;

  } catch (error: any) {
    /**
     * Error Handling
     * =============
     * 
     * Handles various file system and parsing errors
     * with user-friendly error messages.
     */
    if (error.code === 'ENOENT') {
      console.error(`❌ Error: Configuration file not found at path: ${resolvedPath}`);
    } else {
      console.error(`❌ Error reading or parsing configuration file: ${error.message}`);
    }
    process.exit(1);
  }
} 