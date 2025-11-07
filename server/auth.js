// auth.js - 身份认证模块
const jwt = require('jsonwebtoken');
const config = require('./config');

// 生成JWT令牌
function generateToken(payload) {
  return jwt.sign(payload, config.security.jwtSecret, { expiresIn: '24h' });
}

// 验证JWT令牌的中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '访问被拒绝，缺少令牌' });
  }

  // auth.js - 身份认证模块
const jwt = require('jsonwebtoken');
const config = require('./config');

// 生成JWT令牌
function generateToken(payload) {
  return jwt.sign(payload, config.security.jwtSecret, { expiresIn: '24h' });
}

// 验证JWT令牌的中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: '访问被拒绝，缺少令牌' });
  }

  jwt.verify(token, config.security.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效' });
    }
    
    // 将用户信息附加到请求对象
    req.user = user;
    next();
  });
}

// 验证管理员权限
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin
};
}

// 验证管理员权限
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

module.exports = {
  generateToken,
  authenticateToken,
  requireAdmin
};