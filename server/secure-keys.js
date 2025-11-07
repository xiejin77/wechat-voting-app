// secure-keys.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const paillierBigint = require('paillier-bigint');

const KEYS_DIR = path.join(__dirname, 'keys');
const PUBLIC_KEY_FILE = path.join(KEYS_DIR, 'public.key');
const PRIVATE_KEY_FILE = path.join(KEYS_DIR, 'private.key');

// 确保密钥目录存在
function ensureKeysDir() {
  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }
}

// 保存公钥到文件
function savePublicKey(publicKey) {
  ensureKeysDir();
  const keyData = {
    n: publicKey.n.toString(),
    g: publicKey.g.toString()
  };
  fs.writeFileSync(PUBLIC_KEY_FILE, JSON.stringify(keyData));
}

// 从文件加载公钥
function loadPublicKey() {
  if (!fs.existsSync(PUBLIC_KEY_FILE)) {
    return null;
  }
  
  const keyData = JSON.parse(fs.readFileSync(PUBLIC_KEY_FILE, 'utf8'));
  return new paillierBigint.PublicKey(
    BigInt(keyData.n),
    BigInt(keyData.g)
  );
}

// 保存私钥到文件（加密存储）
function savePrivateKey(privateKey, passphrase) {
  ensureKeysDir();
  
  const keyData = {
    n: privateKey.n.toString(),
    lambda: privateKey.lambda.toString(),
    mu: privateKey.mu.toString()
  };
  
  // 简单的加密存储（实际应用中应使用更强的加密方法）
  const keyString = JSON.stringify(keyData);
  const encryptedKey = encryptWithPassphrase(keyString, passphrase);
  
  fs.writeFileSync(PRIVATE_KEY_FILE, encryptedKey);
}

// 从文件加载私钥
function loadPrivateKey(passphrase) {
  if (!fs.existsSync(PRIVATE_KEY_FILE)) {
    return null;
  }
  
  const encryptedKey = fs.readFileSync(PRIVATE_KEY_FILE, 'utf8');
  const decryptedKey = decryptWithPassphrase(encryptedKey, passphrase);
  
  const keyData = JSON.parse(decryptedKey);
  return new paillierBigint.PrivateKey(
    BigInt(keyData.n),
    BigInt(keyData.lambda),
    BigInt(keyData.mu)
  );
}

// 生成新的密钥对
async function generateKeys(keyLength = 2048) {
  const { publicKey, privateKey } = await paillierBigint.generateRandomKeys(keyLength);
  return { publicKey, privateKey };
}

// 使用AES加密的函数
function encryptWithPassphrase(text, passphrase) {
  // 使用PBKDF2生成密钥
  const salt = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
  
  // 生成随机初始化向量
  const iv = crypto.randomBytes(16);
  
  // 创建加密器
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 将盐、IV和加密数据组合在一起
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
}

// 使用AES解密的函数
function decryptWithPassphrase(encryptedText, passphrase) {
  // 分离盐、IV和加密数据
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const salt = Buffer.from(parts[0], 'hex');
  const iv = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  // 使用相同的盐生成密钥
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256');
  
  // 创建解密器
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = {
  generateKeys,
  savePublicKey,
  loadPublicKey,
  savePrivateKey,
  loadPrivateKey
};