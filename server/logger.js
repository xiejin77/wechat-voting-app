// logger.js - 日志记录模块
const fs = require('fs');
const path = require('path');
const config = require('./config');

// 日志级别
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// 日志配置
const LOG_LEVEL = config.server.logLevel;
const LOG_FILE = config.server.logFile;

// 确保日志目录存在
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 写入日志的函数
function writeLog(level, message) {
  if (LOG_LEVELS[level] > LOG_LEVELS[LOG_LEVEL]) {
    return;
  }

  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}\n`;
  
  // 输出到控制台
  console.log(logMessage.trim());
  
  // 写入日志文件
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (error) {
    console.error('写入日志文件失败:', error);
  }
}

// 日志记录函数
function logError(message, error = null) {
  let fullMessage = message;
  if (error) {
    fullMessage += ` - Error: ${error.message}`;
    if (error.stack) {
      fullMessage += `\nStack: ${error.stack}`;
    }
  }
  writeLog('ERROR', fullMessage);
}

function logWarn(message) {
  writeLog('WARN', message);
}

function logInfo(message) {
  writeLog('INFO', message);
}

function logDebug(message) {
  writeLog('DEBUG', message);
}

module.exports = {
  logError,
  logWarn,
  logInfo,
  logDebug
};