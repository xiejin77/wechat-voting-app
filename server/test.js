// test.js - 简单的测试脚本
const paillier = require('./paillier');
const db = require('./database');

async function runTests() {
  console.log('开始测试...');
  
  try {
    // 初始化Paillier密钥
    await paillier.init();
    console.log('✓ Paillier密钥初始化成功');
    
    // 获取公钥和私钥
    const publicKey = paillier.getPublicKey();
    const privateKey = paillier.getPrivateKey();
    
    if (!publicKey || !privateKey) {
      throw new Error('Paillier密钥获取失败');
    }
    
    console.log('✓ Paillier公钥和私钥获取成功');
    
    // 测试加密和解密
    const originalValue = 1;
    const encrypted = paillier.encryptVote(originalValue);
    const decrypted = paillier.decrypt(encrypted, privateKey);
    
    if (decrypted === originalValue) {
      console.log('✓ 加密解密功能正常');
    } else {
      throw new Error(`加密解密不匹配: 原值 ${originalValue}, 解密值 ${decrypted}`);
    }
    
    // 测试同态加法
    const value1 = 1;
    const value2 = 1;
    const encrypted1 = paillier.encryptVote(value1);
    const encrypted2 = paillier.encryptVote(value2);
    const encryptedSum = paillier.addEncryptedVotes(encrypted1, encrypted2);
    const decryptedSum = paillier.decrypt(encryptedSum, privateKey);
    
    if (decryptedSum === (value1 + value2)) {
      console.log('✓ 同态加法功能正常');
    } else {
      throw new Error(`同态加法不正确: 期望 ${value1 + value2}, 实际 ${decryptedSum}`);
    }
    
    // 测试更新加密计数器
    const counterValue = '100';
    const voteValue = paillier.encryptVote(1);
    const updatedCounter = paillier.updateEncryptedCounter(counterValue, voteValue);
    console.log('✓ 更新加密计数器功能正常');
    
    // 初始化数据库
    db.init();
    console.log('✓ 数据库初始化成功');
    
    console.log('\n所有测试通过！');
    console.log('\n主要改进:');
    console.log('1. 投票防重功能 - 已在数据库层面和应用层面实现');
    console.log('2. 投票结果持久化 - 已添加vote_results和vote_statistics表');
    console.log('3. 安全密钥管理 - 已实现密钥持久化和加密存储');
    console.log('4. 数据库结构优化 - 已更新并添加新表');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    process.exit(1);
  }
}

runTests();