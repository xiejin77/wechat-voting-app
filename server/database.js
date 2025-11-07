// database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config');

// 数据库文件路径
const dbPath = path.join(__dirname, config.database.path);
let db;

// 初始化数据库
function init() {
  db = new sqlite3.Database(dbPath);
  
  // 启用外键约束
  db.run('PRAGMA foreign_keys = ON');
  
  // 按依赖顺序创建表
  // 1. 创建基础表（无外键依赖）
  db.serialize(() => {
    // 创建投票表
    db.run(`CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建votes表失败:', err);
      }
    });
    
    // 创建白名单表
    db.run(`CREATE TABLE IF NOT EXISTS whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT UNIQUE NOT NULL,
      phone TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('创建whitelist表失败:', err);
      }
    });
    
    // 2. 创建依赖于基础表的表
    // 创建投票选项表（依赖votes表）
    db.run(`CREATE TABLE IF NOT EXISTS vote_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voteId INTEGER NOT NULL,
      text TEXT NOT NULL,
      FOREIGN KEY (voteId) REFERENCES votes (id)
    )`, (err) => {
      if (err) {
        console.error('创建vote_options表失败:', err);
      }
    });
    
    // 创建加密计数器表（依赖votes表）
    db.run(`CREATE TABLE IF NOT EXISTS encrypted_counters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voteId INTEGER NOT NULL,
      optionId INTEGER NOT NULL,
      publicKey TEXT NOT NULL,
      encryptedCount TEXT NOT NULL DEFAULT '0',
      FOREIGN KEY (voteId) REFERENCES votes (id)
    )`, (err) => {
      if (err) {
        console.error('创建encrypted_counters表失败:', err);
      }
    });
    
    // 创建投票记录表（依赖votes表）
    db.run(`CREATE TABLE IF NOT EXISTS votes_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voteId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      optionId INTEGER NOT NULL,
      encryptedVote TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      isFake BOOLEAN DEFAULT FALSE,  -- 标记是否为虚假投票
      FOREIGN KEY (voteId) REFERENCES votes (id),
      UNIQUE(voteId, userId)  -- 防止同一用户对同一投票重复投票
    )`, (err) => {
      if (err) {
        console.error('创建votes_records表失败:', err);
      }
    });
    
    // 创建投票结果表（依赖votes表）
    db.run(`CREATE TABLE IF NOT EXISTS vote_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voteId INTEGER NOT NULL,
      optionId INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voteId) REFERENCES votes (id),
      UNIQUE(voteId, optionId)
    )`, (err) => {
      if (err) {
        console.error('创建vote_results表失败:', err);
      }
    });
    
    // 创建投票统计表（依赖votes表）
    db.run(`CREATE TABLE IF NOT EXISTS vote_statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voteId INTEGER NOT NULL,
      totalVotes INTEGER NOT NULL DEFAULT 0,
      realVotes INTEGER NOT NULL DEFAULT 0,  -- 真实投票数
      fakeVotes INTEGER NOT NULL DEFAULT 0,  -- 虚假投票数
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voteId) REFERENCES votes (id),
      UNIQUE(voteId)
    )`, (err) => {
      if (err) {
        console.error('创建vote_statistics表失败:', err);
      }
    });
    
    // 创建混淆日志表（依赖votes表）
    db.run(`CREATE TABLE IF NOT EXISTS obfuscation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voteId INTEGER NOT NULL,
      fakeVoteCount INTEGER NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voteId) REFERENCES votes (id)
    )`, (err) => {
      if (err) {
        console.error('创建obfuscation_logs表失败:', err);
      }
    });
    
    // 创建索引
    setTimeout(() => {
      createIndexes();
    }, 1000);
  });
  
  console.log('数据库初始化完成');
}

// 创建索引的函数
function createIndexes() {
  // 为votes表的创建时间创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes (createdAt)`, (err) => {
    if (err) {
      console.error('创建idx_votes_created_at索引失败:', err);
    }
  });
  
  // 为vote_options表的voteId创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_vote_options_vote_id ON vote_options (voteId)`, (err) => {
    if (err) {
      console.error('创建idx_vote_options_vote_id索引失败:', err);
    }
  });
  
  // 为whitelist表的userId创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_whitelist_user_id ON whitelist (userId)`, (err) => {
    if (err) {
      console.error('创建idx_whitelist_user_id索引失败:', err);
    }
  });
  
  // 为votes_records表的voteId和userId创建复合索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_votes_records_vote_user ON votes_records (voteId, userId)`, (err) => {
    if (err) {
      console.error('创建idx_votes_records_vote_user索引失败:', err);
    }
  });
  
  // 为votes_records表的voteId和optionId创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_votes_records_vote_option ON votes_records (voteId, optionId)`, (err) => {
    if (err) {
      console.error('创建idx_votes_records_vote_option索引失败:', err);
    }
  });
  
  // 为vote_results表的voteId创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_vote_results_vote_id ON vote_results (voteId)`, (err) => {
    if (err) {
      console.error('创建idx_vote_results_vote_id索引失败:', err);
    }
  });
  
  // 为vote_statistics表的voteId创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_vote_statistics_vote_id ON vote_statistics (voteId)`, (err) => {
    if (err) {
      console.error('创建idx_vote_statistics_vote_id索引失败:', err);
    }
  });
  
  // 为obfuscation_logs表的voteId创建索引
  db.run(`CREATE INDEX IF NOT EXISTS idx_obfuscation_logs_vote_id ON obfuscation_logs (voteId)`, (err) => {
    if (err) {
      console.error('创建idx_obfuscation_logs_vote_id索引失败:', err);
    }
  });
}

// 获取所有投票
function getAllVotes() {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT v.*, 
             json_group_array(json_object('id', vo.id, 'text', vo.text)) as options
      FROM votes v
      LEFT JOIN vote_options vo ON v.id = vo.voteId
      GROUP BY v.id
      ORDER BY v.createdAt DESC
    `;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // 解析选项JSON
        rows.forEach(row => {
          try {
            row.options = JSON.parse(row.options);
            // 过滤掉空选项
            row.options = row.options.filter(option => option.id !== null);
          } catch (e) {
            row.options = [];
          }
        });
        resolve(rows);
      }
    });
  });
}

// 根据ID获取投票
function getVoteById(id) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT v.*, 
             json_group_array(json_object('id', vo.id, 'text', vo.text)) as options
      FROM votes v
      LEFT JOIN vote_options vo ON v.id = vo.voteId
      WHERE v.id = ?
      GROUP BY v.id
    `;
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
      } else if (row) {
        try {
          row.options = JSON.parse(row.options);
          // 过滤掉空选项
          row.options = row.options.filter(option => option.id !== null);
        } catch (e) {
          row.options = [];
        }
        resolve(row);
      } else {
        resolve(null);
      }
    });
  });
}

// 创建投票
function createVote(title, description, options, endDate) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO votes (title, description, endDate) VALUES (?, ?, ?)`;
    
    db.run(sql, [title, description, endDate], function(err) {
      if (err) {
        reject(err);
      } else {
        const voteId = this.lastID;
        
        // 插入选项
        const optionSql = `INSERT INTO vote_options (voteId, text) VALUES (?, ?)`;
        let completed = 0;
        
        if (options.length === 0) {
          resolve(voteId);
          return;
        }
        
        options.forEach(option => {
          db.run(optionSql, [voteId, option.text], function(err) {
            if (err) {
              reject(err);
            } else {
              completed++;
              if (completed === options.length) {
                resolve(voteId);
              }
            }
          });
        });
      }
    });
  });
}

// 创建加密计数器
function createEncryptedCounter(voteId, optionId, publicKey) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO encrypted_counters (voteId, optionId, publicKey, encryptedCount) VALUES (?, ?, ?, ?)`;
    
    // 初始加密计数为0
    const encryptedZero = '0'; // 实际应用中应该使用Paillier加密
    
    db.run(sql, [voteId, optionId, JSON.stringify(publicKey), encryptedZero], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// 获取加密计数器
function getEncryptedCounters(voteId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM encrypted_counters WHERE voteId = ?`;
    
    db.all(sql, [voteId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 更新加密计数器
function updateEncryptedCounter(voteId, optionId, encryptedCount) {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE encrypted_counters SET encryptedCount = ? WHERE voteId = ? AND optionId = ?`;
    
    db.run(sql, [encryptedCount, voteId, optionId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// 获取白名单
function getWhitelist() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT userId, phone FROM whitelist`;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 添加到白名单
function addToWhitelist(userId, phone) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR IGNORE INTO whitelist (userId, phone) VALUES (?, ?)`;
    
    db.run(sql, [userId, phone || ''], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// 从白名单移除
function removeFromWhitelist(userId) {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM whitelist WHERE userId = ?`;
    
    db.run(sql, [userId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

// 检查用户是否在白名单中
function isUserInWhitelist(userId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT COUNT(*) as count FROM whitelist WHERE userId = ?`;
    
    db.get(sql, [userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count > 0);
      }
    });
  });
}

// 检查用户是否已投票
function hasUserVoted(voteId, userId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT COUNT(*) as count FROM votes_records WHERE voteId = ? AND userId = ?`;
    
    db.get(sql, [voteId, userId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count > 0);
      }
    });
  });
}

// 保存加密选票
function saveEncryptedVote(voteId, userId, optionId, encryptedVote, isFake = false) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO votes_records (voteId, userId, optionId, encryptedVote, isFake) VALUES (?, ?, ?, ?, ?)`;
    
    db.run(sql, [voteId, userId, optionId, encryptedVote, isFake], function(err) {
      if (err) {
        // 检查是否是唯一性约束错误（重复投票）
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          reject(new Error('您已参与过此投票'));
        } else {
          reject(err);
        }
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// 保存投票结果
function saveVoteResult(voteId, optionId, count) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT OR REPLACE INTO vote_results (voteId, optionId, count, updatedAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)`;
    
    db.run(sql, [voteId, optionId, count], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// 获取投票结果
function getVoteResults(voteId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT optionId, count FROM vote_results WHERE voteId = ? ORDER BY optionId`;
    
    db.all(sql, [voteId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 更新投票统计
function updateVoteStatistics(voteId, totalVotes, realVotes = null, fakeVotes = null) {
  return new Promise((resolve, reject) => {
    let sql, params;
    
    if (realVotes !== null && fakeVotes !== null) {
      sql = `INSERT OR REPLACE INTO vote_statistics (voteId, totalVotes, realVotes, fakeVotes, updatedAt) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`;
      params = [voteId, totalVotes, realVotes, fakeVotes];
    } else {
      sql = `INSERT OR REPLACE INTO vote_statistics (voteId, totalVotes, updatedAt) VALUES (?, ?, CURRENT_TIMESTAMP)`;
      params = [voteId, totalVotes];
    }
    
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// 获取投票统计
function getVoteStatistics(voteId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT totalVotes, realVotes, fakeVotes FROM vote_statistics WHERE voteId = ?`;
    
    db.get(sql, [voteId], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row || { totalVotes: 0, realVotes: 0, fakeVotes: 0 });
      }
    });
  });
}

// 记录混淆日志
function logObfuscation(voteId, fakeVoteCount) {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO obfuscation_logs (voteId, fakeVoteCount) VALUES (?, ?)`;
    
    db.run(sql, [voteId, fakeVoteCount], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    });
  });
}

// 获取混淆日志
function getObfuscationLogs(voteId) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM obfuscation_logs WHERE voteId = ? ORDER BY timestamp DESC LIMIT 10`;
    
    db.all(sql, [voteId], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// 获取所有投票统计信息
function getVoteStatistics() {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM vote_statistics`;
    
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db, // 导出db对象以便其他模块使用
  init,
  getAllVotes,
  getVoteById,
  createVote,
  createEncryptedCounter,
  getEncryptedCounters,
  updateEncryptedCounter,
  getWhitelist,
  addToWhitelist,
  removeFromWhitelist,
  isUserInWhitelist,
  hasUserVoted,
  saveEncryptedVote,
  saveVoteResult,
  getVoteResults,
  updateVoteStatistics,
  getVoteStatistics,
  logObfuscation,
  getObfuscationLogs
};