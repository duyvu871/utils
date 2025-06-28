/**
 * ESBuild Configuration File
 * ========================
 * 
 * Cấu hình build cho CLI tool sử dụng ESBuild.
 * Hỗ trợ cả development mode (watch) và production build.
 * 
 * @author CLI Utils Team
 * @version 1.0.0
 */

import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

// Chuyển đổi import.meta.url thành đường dẫn file thực tế
// Cần thiết cho ES modules để lấy __dirname và __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Xác định môi trường build
const isProduction = process.env.NODE_ENV === 'production';
const isDev = process.argv.includes('--dev'); // Flag để bật development mode

/**
 * Làm sạch thư mục dist trước khi build
 * Đảm bảo build mới hoàn toàn sạch
 */
const distDir = join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}

const allDependencies = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
  ...Object.keys(packageJson.peerDependencies || {}),
  ...Object.keys(packageJson.optionalDependencies || {})
];

/**
 * Cấu hình build options cho ESBuild
 * Định nghĩa cách thức bundle và optimize code
 */
const buildOptions = {
  // Entry point - file TypeScript chính cần build
  entryPoints: ['src/cli.ts'],
  
  // Bundle tất cả dependencies vào một file duy nhất
  bundle: true,
  
  // Target platform - Node.js (không phải browser)
  platform: 'node',
  
  // Phiên bản Node.js tối thiểu hỗ trợ
  target: 'node16',
  
  // Format output - ES modules
  format: 'esm',
  
  // File output cuối cùng
  outfile: 'dist/cli.js',
  
  /**
   * External dependencies - không bundle vào file cuối
   * Các packages này sẽ được require/import tại runtime
   * Giúp giảm kích thước bundle và tránh conflict
   */
  external: allDependencies,
  
  /**
   * Shebang banner - đã comment out
   * Nếu bật sẽ thêm #!/usr/bin/env node vào đầu file
   * Cho phép chạy trực tiếp như executable
   */
//   banner: {
//     js: '#!/usr/bin/env node\n'
//   },

  // Source maps - chỉ tạo khi không phải production
  sourcemap: !isProduction,
  
  // Minification - chỉ bật khi production
  minify: isProduction,
  
  // Giữ nguyên tên function/class để dễ debug
  keepNames: true,
  
  // File cấu hình TypeScript
  tsconfig: 'tsconfig.json',
  
  // Mức độ logging
  logLevel: 'info'
};

/**
 * Hàm build chính
 * Xử lý cả development mode (watch) và production build
 */
async function build() {
  try {
    if (isDev) {
      /**
       * Development Mode - Watch Mode
       * =============================
       * 
       * Tự động rebuild khi có thay đổi file
       * Phù hợp cho development và testing
       */
      console.log('🔄 Starting development build with watch mode...\n');
      
      // Tạo context để có thể watch changes
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      
      console.log('👀 Watching for changes... Press Ctrl+C to stop.\n');
      
      /**
       * Xử lý graceful shutdown
       * Đảm bảo cleanup context khi thoát
       */
      process.on('SIGINT', async () => {
        console.log('\n🛑 Stopping watch mode...');
        await ctx.dispose();
        process.exit(0);
      });
      
    } else {
      /**
       * Production Build Mode
       * ====================
       * 
       * Build một lần và thoát
       * Optimize cho production deployment
       */
      console.log(`🚀 Building CLI tool for ${isProduction ? 'production' : 'development'}...\n`);
      
      // Thực hiện build
      const result = await esbuild.build(buildOptions);
      
      /**
       * Kiểm tra lỗi build
       * Nếu có lỗi, hiển thị và thoát với exit code 1
       */
      if (result.errors.length > 0) {
        console.error('❌ Build failed with errors:');
        result.errors.forEach(error => console.error(error));
        process.exit(1);
      }
      
      /**
       * Làm file executable trên Unix systems
       * Windows không cần chmod
       */
      if (process.platform !== 'win32') {
        fs.chmodSync('dist/cli.js', '755');
      }
      
      /**
       * Hiển thị thông tin build thành công
       * Bao gồm đường dẫn file và kích thước
       */
      console.log('✅ Build completed successfully!');
      console.log(`📦 Output: dist/cli.js`);
      console.log(`🗜️  Size: ${(fs.statSync('dist/cli.js').size / 1024).toFixed(2)} KB\n`);
    }
    
  } catch (error) {
    /**
     * Xử lý lỗi build không mong muốn
     * Log error và thoát với exit code 1
     */
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Khởi chạy build process
build();