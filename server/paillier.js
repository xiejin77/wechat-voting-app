// paillier.js
const paillierBigint = require('paillier-bigint');
const secureKeys = require('./secure-keys');
const config = require('./config');

let publicKey, privateKey;

// 初始化Paillier密钥
async function init() {
  try {
    // 尝试从文件加载现有密钥
    publicKey = secureKeys.loadPublicKey();
    
    // 在生产环境中，私钥需要通过环境变量或安全方式提供密码来解密
    // 这里为了演示使用固定密码
    const passphrase = config.security.paillierPassphrase;
    privateKey = secureKeys.loadPrivateKey(passphrase);
    
    // 如果密钥不存在，生成新的密钥对
    if (!publicKey || !privateKey) {
      console.log('未找到现有密钥，生成新的密钥对...');
      const { publicKey: pub, privateKey: priv } = await secureKeys.generateKeys(2048);
      publicKey = pub;
      privateKey = priv;
      
      // 保存密钥到文件
      secureKeys.savePublicKey(publicKey);
      secureKeys.savePrivateKey(privateKey, passphrase);
      
      console.log('新的Paillier密钥对已生成并保存');
    } else {
      console.log('Paillier密钥已从文件加载');
    }
  } catch (error) {
    console.error('Paillier密钥初始化失败:', error);
    throw error;
  }
}

// 获取公钥
function getPublicKey() {
  return publicKey;
}

// 获取私钥
function getPrivateKey() {
  return privateKey;
}

// 验证加密选票格式
function isValidEncryptedVote(encryptedVote) {
  // 简单验证，实际应用中应该更严格
  return typeof encryptedVote === 'string' && encryptedVote.length > 0;
}

// 加密选票
function encryptVote(vote) {
  if (!publicKey) {
    throw new Error('Paillier公钥未初始化');
  }
  
  // vote应该是选项ID
  return publicKey.encrypt(BigInt(vote)).toString();
}

// 解密计数
function decrypt(encryptedCount, privKey = privateKey) {
  if (!privKey) {
    throw new Error('Paillier私钥未初始化');
  }
  
  try {
    const encrypted = BigInt(encryptedCount);
    const decrypted = privKey.decrypt(encrypted);
    return Number(decrypted);
  } catch (error) {
    throw new Error('解密失败: ' + error.message);
  }
}

// 同态加法
function addEncryptedVotes(encryptedVote1, encryptedVote2) {
  if (!publicKey) {
    throw new Error('Paillier公钥未初始化');
  }
  
  try {
    const e1 = BigInt(encryptedVote1);
    const e2 = BigInt(encryptedVote2);
    const result = publicKey.addition(e1, e2);
    return result.toString();
  } catch (error) {
    throw new Error('同态加法失败: ' + error.message);
  }
}

// 更新加密计数器（同态加法）
function updateEncryptedCounter(currentEncryptedCount, newEncryptedVote) {
  if (!publicKey) {
    throw new Error('Paillier公钥未初始化');
  }
  
  try {
    const current = BigInt(currentEncryptedCount);
    const newVote = BigInt(newEncryptedVote);
    const result = publicKey.addition(current, newVote);
    return result.toString();
  } catch (error) {
    throw new Error('更新加密计数器失败: ' + error.message);
  }
}

// 生成随机加密值（用于混淆）
function generateRandomEncryptedValue() {
  if (!publicKey) {
    throw new Error('Paillier公钥未初始化');
  }
  
  // 生成随机值并加密
  const randomValue = BigInt(Math.floor(Math.random() * 1000) + 1);
  return publicKey.encrypt(randomValue).toString();
}

module.exports = {
  init,
  getPublicKey,
  getPrivateKey,
  isValidEncryptedVote,
  encryptVote,
  decrypt,
  addEncryptedVotes,
  updateEncryptedCounter,
  generateRandomEncryptedValue
};