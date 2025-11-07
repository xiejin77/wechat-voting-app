// obfuscation.js
const crypto = require('crypto');
const paillier = require('./paillier');
const db = require('./database');
const { logError, logInfo, logWarn } = require('./logger');
const config = require('./config');

class VoteObfuscator {
  constructor() {
    this.isEnabled = config.obfuscation.isEnabled;
    this.obfuscationInterval = config.obfuscation.interval; // 30秒
    this.fakeVoteRatio = config.obfuscation.fakeVoteRatio; // 30%虚假投票
    this.obfuscationTimer = null;
  }

  // 初始化混淆器
  init() {
    if (this.isEnabled) {
      logInfo('投票混淆器已启用');
      this.startObfuscation();
    } else {
      logInfo('投票混淆器已禁用');
    }
  }

  // 启动混淆定时器
  startObfuscation() {
    if (!this.isEnabled) return;
    
    this.obfuscationTimer = setInterval(async () => {
      try {
        await this.generateFakeVotes();
      } catch (error) {
        logError('生成虚假投票失败', error);
      }
    }, this.obfuscationInterval);
  }

  // 停止混淆定时器
  stopObfuscation() {
    if (this.obfuscationTimer) {
      clearInterval(this.obfuscationTimer);
      this.obfuscationTimer = null;
    }
  }

  // 生成虚假投票
  async generateFakeVotes() {
    if (!this.isEnabled) return;
    
    // 获取所有进行中的投票
    const allVotes = await db.getAllVotes();
    const activeVotes = allVotes.filter(vote => {
      const now = new Date();
      const endDate = new Date(vote.endDate);
      return now <= endDate;
    });
    
    if (activeVotes.length === 0) {
      logInfo('没有进行中的投票，跳过生成虚假投票');
      return;
    }
    
    logInfo(`开始生成虚假投票，当前进行中的投票数: ${activeVotes.length}`);
    
    let totalFakeVotes = 0;
    
    // 为每个进行中的投票生成虚假投票
    for (const vote of activeVotes) {
      // 随机决定是否为这个投票生成虚假投票
      if (Math.random() > 0.3) continue; // 30%概率生成虚假投票
      
      // 获取投票选项
      const options = vote.options;
      if (!options || options.length === 0) continue;
      
      // 根据真实投票数量动态调整虚假投票数量
      const voteRecordCount = await this.getVoteRecordCount(vote.id);
      const fakeVoteCount = Math.max(1, Math.floor(voteRecordCount * this.fakeVoteRatio) + Math.floor(Math.random() * 3));
      
      let generatedFakeVotes = 0;
      
      for (let i = 0; i < fakeVoteCount; i++) {
        // 随机选择一个选项，可以使用更复杂的分布算法
        const randomOption = options[Math.floor(Math.random() * options.length)];
        
        // 生成更真实的虚假用户ID
        const fakeUserId = this.generateFakeUserId();
        
        // 检查虚假用户是否已投票（避免重复）
        const hasVoted = await db.hasUserVoted(vote.id, fakeUserId);
        if (hasVoted) continue;
        
        // 生成更复杂的加密值（模拟真实的投票行为）
        const encryptedVote = paillier.generateRandomEncryptedValue();
        
        // 保存虚假投票
        try {
          await db.saveEncryptedVote(vote.id, fakeUserId, randomOption.id, encryptedVote, true); // true表示是虚假投票
          
          // 更新加密计数器
          const counters = await db.getEncryptedCounters(vote.id);
          const targetCounter = counters.find(c => c.optionId == randomOption.id);
          
          if (targetCounter) {
            const updatedEncryptedCount = paillier.updateEncryptedCounter(
              targetCounter.encryptedCount,
              encryptedVote
            );
            
            await db.updateEncryptedCounter(vote.id, randomOption.id, updatedEncryptedCount);
          }
          
          logInfo(`生成虚假投票: 投票ID=${vote.id}, 选项ID=${randomOption.id}, 用户ID=${fakeUserId}`);
          generatedFakeVotes++;
          totalFakeVotes++;
        } catch (error) {
          // 忽略重复投票错误
          if (error.message !== '您已参与过此投票') {
            logError(`保存虚假投票失败: 投票ID=${vote.id}, 选项ID=${randomOption.id}`, error);
          }
        }
      }
      
      // 记录混淆日志
      if (generatedFakeVotes > 0) {
        await db.logObfuscation(vote.id, generatedFakeVotes);
        logInfo(`为投票ID ${vote.id} 生成了 ${generatedFakeVotes} 个虚假投票`);
      }
    }
    
    // 更新全局统计信息
    if (totalFakeVotes > 0) {
      logInfo(`本次共生成 ${totalFakeVotes} 个虚假投票`);
    } else {
      logInfo('本次未生成虚假投票');
    }
  }

  // 获取投票记录数量
  async getVoteRecordCount(voteId) {
    try {
      const sql = 'SELECT COUNT(*) as count FROM votes_records WHERE voteId = ?';
      const result = await new Promise((resolve, reject) => {
        db.db.get(sql, [voteId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      return result.count || 0;
    } catch (error) {
      logError(`获取投票记录数量失败 - 投票ID: ${voteId}`, error);
      return 0;
    }
  }

  // 生成更真实的虚假用户ID
  generateFakeUserId() {
    return `fake_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  // 混淆真实投票 - 实现更复杂的混淆逻辑
  obfuscateRealVote(voteId, userId, optionId) {
    if (!this.isEnabled) return { voteId, userId, optionId };
    
    // 在实际应用中，可以在这里实现更复杂的混淆逻辑
    // 例如：延迟提交、批量提交、随机延迟等
    
    // 添加随机延迟（模拟真实用户行为）
    const delay = Math.random() * 5000; // 最多5秒延迟
    
    logInfo(`真实投票混淆: 投票ID=${voteId}, 用户ID=${userId}, 选项ID=${optionId}, 延迟=${delay}ms`);
    
    // 返回延迟信息用于后续处理
    return { 
      voteId, 
      userId, 
      optionId,
      delay
    };
  }

  // 获取混淆统计信息
  async getObfuscationStats() {
    if (!this.isEnabled) {
      return { enabled: false };
    }
    
    // 获取混淆统计信息
    try {
      const voteStatistics = await db.getVoteStatistics();
      const totalFakeVotes = voteStatistics.reduce((sum, stat) => sum + stat.fakeVotes, 0);
      
      return {
        enabled: true,
        interval: this.obfuscationInterval,
        fakeVoteRatio: this.fakeVoteRatio,
        totalFakeVotes: totalFakeVotes,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      logError('获取混淆统计信息失败', error);
      return {
        enabled: true,
        interval: this.obfuscationInterval,
        fakeVoteRatio: this.fakeVoteRatio,
        error: '无法获取统计信息'
      };
    }
  }
  
  // 获取特定投票的混淆日志
  async getObfuscationLogs(voteId) {
    if (!this.isEnabled) {
      return [];
    }
    
    try {
      return await db.getObfuscationLogs(voteId);
    } catch (error) {
      logError(`获取混淆日志失败 - 投票ID: ${voteId}`, error);
      return [];
    }
  }
}

// 导出单例实例
module.exports = new VoteObfuscator();