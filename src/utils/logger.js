// utils/logger.js
export class Logger {
  constructor(level = 'info') {
    this.level = level
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
    }
  }

  log(level, message, meta = {}) {
    if (this.levels[level] <= this.levels[this.level]) {
      const timestamp = new Date().toISOString()
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta,
      }

      // In production, you might want to use a proper logging library
      // like Winston or Pino. For now, we'll use console with colors.
      this.formatConsoleOutput(level, logEntry)
    }
  }

  formatConsoleOutput(level, logEntry) {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      debug: '\x1b[37m', // White
    }

    const reset = '\x1b[0m'
    const color = colors[level] || colors.info

    const { timestamp, level: logLevel, message, ...meta } = logEntry

    let output = `${color}[${timestamp}] ${logLevel}:${reset} ${message}`

    if (Object.keys(meta).length > 0) {
      output += `\n${JSON.stringify(meta, null, 2)}`
    }

    console.log(output)
  }

  error(message, meta = {}) {
    this.log('error', message, meta)
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta)
  }

  info(message, meta = {}) {
    this.log('info', message, meta)
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta)
  }
}
