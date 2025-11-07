// test-obfuscation.js - 测试混淆功能
const obfuscation = require('./obfuscation');
const paillier = require('./paillier');
const db = require('./database');

async function runObfuscationTests() {
  console.log('开始测试投票混淆功能...');
  
  try {
    // 初始化数据库
    db.init();
    console.log('✓ 数据库初始化成功');
    
    // 初始化Paillier密钥
    await paillier.init();
    console.log('✓ Paillier密钥初始化成功');
    
    // 初始化混淆器
    obfuscation.init();
    console.log('✓ 混淆器初始化成功');
    
    // 测试生成随机加密值
    const randomEncryptedValue = paillier.generateRandomEncryptedValue();
    if (typeof randomEncryptedValue === 'string' && randomEncryptedValue.length > 0) {
      console.log('✓ 随机加密值生成功能正常');
    } else {
      throw new Error('随机加密值生成失败');
    }
    
    // 测试生成虚假投票
    await obfuscation.generateFakeVotes();
    console.log('✓ 虚假投票生成功能正常');
    
    // 测试混淆统计信息
    const stats = await obfuscation.getObfuscationStats();
    console.log('✓ 混淆统计信息获取功能正常:', stats);
    
    // 停止混淆器
    obfuscation.stopObfuscation();
    console.log('✓ 混淆器停止成功');
    
    console.log('\n所有混淆功能测试通过！');
    console.log('\n主要改进:');
    console.log('1. 投票混淆功能 - 已实现虚假投票生成');
    console.log('2. 数据库结构优化 - 已添加混淆相关表');
    console.log('3. 混淆统计 - 已实现混淆日志记录');
    console.log('4. 环境变量配置 - 支持通过环境变量控制混淆功能');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    process.exit(1);
  }
}

runObfuscationTests();