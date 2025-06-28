let isDebug = false;

export function enableDebug() {
  isDebug = true;
}

export function logDebug(...args: any[]) {
  if (isDebug) {
    // Using a bright magenta color for debug logs to make them stand out
    console.log('\x1b[95m[DEBUG]\x1b[0m', ...args);
  }
} 