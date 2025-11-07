// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');
const paillier = require('./paillier');
const obfuscation = require('./obfuscation');
const { authenticateToken, requireAdmin, generateToken } = require('./auth');
const { logError, logInfo, logWarn } = require('./logger');
const config = require('./config');

const app = express();
const PORT = config.server.port;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 初始化数据库
db.init();

// 初始化Paillier密钥
paillier.init().catch(error => {
  logError('Paillier密钥初始化失败', error);
  process.exit(1);
});

// 初始化混淆器
obfuscation.init();

// 登录端点 - 用于获取访问令牌
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 在实际应用中，应该验证用户名和密码
    // 这里为了演示，我们假设任何用户都可以登录
    // 在生产环境中，应该查询数据库验证用户凭据
    
    // 生成JWT令牌
    const token = generateToken({ 
      username: username, 
      role: username === 'admin' ? 'admin' : 'user' 
    });
    
    logInfo(`用户 ${username} 成功登录`);
    res.json({ 
      message: '登录成功', 
      token: token,
      role: username === 'admin' ? 'admin' : 'user'
    });
  } catch (error) {
    logError('登录失败', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 路由
app.get('/', (req, res) => {
  res.json({ message: '微信匿名投票系统后端服务' });
});

// 获取投票列表
app.get('/api/votes', async (req, res) => {
  try {
    const votes = await db.getAllVotes();
    logInfo('获取投票列表成功');
    res.json(votes);
  } catch (error) {
    logError('获取投票列表失败', error);
    res.status(500).json({ error: '获取投票列表失败' });
  }
});

// 创建投票
app.post('/api/votes', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, options, endDate } = req.body;
    
    // 验证参数
    if (!title || !description || !options || !endDate) {
      logWarn(`创建投票时缺少必要参数 - 用户: ${req.user?.username}`);
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 创建投票
    const voteId = await db.createVote(title, description, options, endDate);
    
    // 为每个选项生成Paillier公钥和私钥
    const publicKey = paillier.getPublicKey();
    for (const option of options) {
      await db.createEncryptedCounter(voteId, option.id, publicKey);
    }
    
    logInfo(`投票创建成功 - ID: ${voteId}, 用户: ${req.user?.username}`);
    res.json({ id: voteId, message: '投票创建成功' });
  } catch (error) {
    logError('创建投票失败', error);
    res.status(500).json({ error: '创建投票失败' });
  }
});

// 获取投票详情
app.get('/api/votes/:id', async (req, res) => {
  try {
    const voteId = parseInt(req.params.id);
    const vote = await db.getVoteById(voteId);
    
    if (!vote) {
      logWarn(`获取投票详情失败 - 投票不存在: ${voteId}`);
      return res.status(404).json({ error: '投票不存在' });
    }
    
    logInfo(`获取投票详情成功 - ID: ${voteId}`);
    res.json(vote);
  } catch (error) {
    logError(`获取投票详情失败 - ID: ${voteId}`, error);
    res.status(500).json({ error: '获取投票详情失败' });
  }
});

// 提交投票
app.post('/api/votes/:id/vote', async (req, res) => {
  try {
    const voteId = parseInt(req.params.id);
    let { userId, optionId, encryptedVote } = req.body;
    
    // 验证参数
    if (!userId || !optionId || !encryptedVote) {
      logWarn(`提交投票时缺少必要参数 - 投票ID: ${voteId}`);
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    // 混淆真实投票
    const obfuscatedVote = obfuscation.obfuscateRealVote(voteId, userId, optionId);
    
    // 检查投票是否存在且未结束
    const vote = await db.getVoteById(voteId);
    if (!vote) {
      logWarn(`提交投票失败 - 投票不存在: ${voteId}`);
      return res.status(404).json({ error: '投票不存在' });
    }
    
    const now = new Date();
    const endDate = new Date(vote.endDate);
    if (now > endDate) {
      logWarn(`提交投票失败 - 投票已结束: ${voteId}`);
      return res.status(400).json({ error: '投票已结束' });
    }
    
    // 检查用户是否在白名单中
    const isInWhitelist = await db.isUserInWhitelist(userId);
    if (!isInWhitelist) {
      logWarn(`提交投票失败 - 用户不在白名单中: ${userId}, 投票ID: ${voteId}`);
      return res.status(403).json({ error: '您不在投票白名单中' });
    }
    
    // 检查用户是否已投票
    const hasVoted = await db.hasUserVoted(voteId, userId);
    if (hasVoted) {
      logWarn(`提交投票失败 - 用户已投票: ${userId}, 投票ID: ${voteId}`);
      return res.status(400).json({ error: '您已参与过此投票' });
    }
    
    // 验证加密选票格式
    if (!paillier.isValidEncryptedVote(encryptedVote)) {
      logWarn(`提交投票失败 - 选票格式无效: ${voteId}`);
      return res.status(400).json({ error: '选票格式无效' });
    }
    
    // 开始事务处理
    // 1. 保存加密选票
    await db.saveEncryptedVote(voteId, userId, optionId, encryptedVote, false); // false表示不是虚假投票
    
    // 2. 更新加密计数器（使用同态加法）
    const counters = await db.getEncryptedCounters(voteId);
    const targetCounter = counters.find(c => c.optionId == optionId);
    
    if (targetCounter) {
      const updatedEncryptedCount = paillier.updateEncryptedCounter(
        targetCounter.encryptedCount,
        encryptedVote
      );
      
      await db.updateEncryptedCounter(voteId, optionId, updatedEncryptedCount);
    }
    
    logInfo(`投票提交成功 - 投票ID: ${voteId}, 用户ID: ${userId}, 选项ID: ${optionId}`);
    res.json({ message: '投票成功' });
  } catch (error) {
    logError(`提交投票失败 - 投票ID: ${voteId}`, error);
    
    // 检查是否是重复投票错误
    if (error.message === '您已参与过此投票') {
      logWarn(`提交投票失败 - 用户已投票: ${req.body.userId}, 投票ID: ${voteId}`);
      return res.status(400).json({ error: '您已参与过此投票' });
    }
    
    res.status(500).json({ error: '提交投票失败' });
  }
});

// 获取投票结果
app.get('/api/votes/:id/results', async (req, res) => {
  try {
    const voteId = parseInt(req.params.id);
    
    // 检查投票是否存在
    const vote = await db.getVoteById(voteId);
    if (!vote) {
      logWarn(`获取投票结果失败 - 投票不存在: ${voteId}`);
      return res.status(404).json({ error: '投票不存在' });
    }
    
    // 检查是否已有缓存的结果
    const cachedResults = await db.getVoteResults(voteId);
    if (cachedResults.length > 0) {
      logInfo(`获取投票结果成功（缓存） - ID: ${voteId}`);
      return res.json(cachedResults);
    }
    
    // 获取加密计数器
    const counters = await db.getEncryptedCounters(voteId);
    
    // 使用Paillier私钥解密计数器
    const privateKey = paillier.getPrivateKey();
    const results = [];
    let totalVotes = 0;
    
    for (const counter of counters) {
      const decryptedCount = paillier.decrypt(counter.encryptedCount, privateKey);
      results.push({
        optionId: counter.optionId,
        count: decryptedCount
      });
      totalVotes += decryptedCount;
      
      // 持久化存储结果
      await db.saveVoteResult(voteId, counter.optionId, decryptedCount);
    }
    
    // 更新投票统计
    await db.updateVoteStatistics(voteId, totalVotes);
    
    logInfo(`获取投票结果成功 - ID: ${voteId}, 总票数: ${totalVotes}`);
    res.json(results);
  } catch (error) {
    logError(`获取投票结果失败 - ID: ${req.params.id}`, error);
    res.status(500).json({ error: '获取投票结果失败' });
  }
});

// 获取混淆统计信息
app.get('/api/obfuscation/stats', async (req, res) => {
  try {
    const stats = await obfuscation.getObfuscationStats();
    logInfo('获取混淆统计信息成功');
    res.json(stats);
  } catch (error) {
    logError('获取混淆统计信息失败', error);
    res.status(500).json({ error: '获取混淆统计信息失败' });
  }
});

// 获取白名单
app.get('/api/whitelist', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const whitelist = await db.getWhitelist();
    logInfo(`获取白名单成功 - 用户: ${req.user?.username}`);
    res.json(whitelist);
  } catch (error) {
    logError('获取白名单失败', error);
    res.status(500).json({ error: '获取白名单失败' });
  }
});

// 添加用户到白名单
app.post('/api/whitelist', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, phone } = req.body;
    
    // 验证参数
    if (!userId) {
      logWarn(`添加用户到白名单失败 - 缺少用户ID - 操作用户: ${req.user?.username}`);
      return res.status(400).json({ error: '缺少用户ID' });
    }
    
    // 添加到白名单
    await db.addToWhitelist(userId, phone);
    
    logInfo(`用户添加到白名单成功 - 用户ID: ${userId}, 操作用户: ${req.user?.username}`);
    res.json({ message: '添加成功' });
  } catch (error) {
    logError(`添加用户到白名单失败 - 用户ID: ${req.body.userId}`, error);
    res.status(500).json({ error: '添加到白名单失败' });
  }
});

// 从白名单移除用户
app.delete('/api/whitelist/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // 从白名单移除
    await db.removeFromWhitelist(userId);
    
    logInfo(`用户从白名单移除成功 - 用户ID: ${userId}, 操作用户: ${req.user?.username}`);
    res.json({ message: '移除成功' });
  } catch (error) {
    logError(`从白名单移除用户失败 - 用户ID: ${req.params.userId}`, error);
    res.status(500).json({ error: '从白名单移除失败' });
  }
});

// 404错误处理中间件
app.use('*', (req, res) => {
  logWarn(`未找到路径: ${req.path}`);
  res.status(404).json({ error: '路径未找到' });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  logError(`服务器错误 - 路径: ${req.path}`, err);
  res.status(500).json({ error: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  logInfo(`服务器运行在端口 ${PORT}`);
});

module.exports = app;