// config.js - 环境变量配置
require('dotenv').config();

module.exports = {
  // 服务器配置
  server: {
    port: parseInt(process.env.PORT) || 3000,
    logLevel: process.env.LOG_LEVEL || 'INFO',
    logFile: process.env.LOG_FILE || './logs/app.log'
  },
  
  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    paillierPassphrase: process.env.PAILLIER_PASSPHRASE || 'default_passphrase'
  },
  
  // 混淆配置
  obfuscation: {
    isEnabled: process.env.ENABLE_OBFUSCATION === 'true',
    interval: parseInt(process.env.OBFUSCATION_INTERVAL) || 30000,
    fakeVoteRatio: parseFloat(process.env.FAKE_VOTE_RATIO) || 0.3
  },
  
  // 数据库配置
  database: {
    path: process.env.DATABASE_PATH || './voting.db'
  }
};