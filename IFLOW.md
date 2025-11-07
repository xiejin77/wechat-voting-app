# 微信小程序匿名投票系统 - iFlow 上下文

## 项目概述

这是一个基于微信小程序的无记名投票系统，使用Paillier同态加密算法确保投票隐私。系统包含前端微信小程序和后端Node.js服务，实现了安全的匿名投票功能。

### 核心特性

1. **无记名投票**：使用Paillier同态加密算法保护投票隐私
2. **投票事项设置**：管理员可以创建和管理投票活动
3. **用户白名单**：只有白名单用户可以参与投票
4. **投票防重**：防止同一用户对同一投票多次投票
5. **结果持久化**：投票结果持久化存储，提高查询效率
6. **安全密钥管理**：Paillier密钥的安全生成和存储
7. **投票混淆**：通过生成虚假投票增强匿名性

## 项目结构

```
wechat-voting-app/
├── miniprogram/           # 微信小程序前端代码
│   ├── pages/             # 页面文件
│   ├── utils/             # 工具函数
│   ├── app.js             # 小程序入口文件
│   ├── app.json           # 小程序配置文件
│   └── app.wxss           # 小程序全局样式
└── server/                # 后端服务
    ├── server.js          # 服务器入口文件
    ├── database.js        # 数据库操作
    ├── paillier.js        # Paillier加密算法
    ├── secure-keys.js     # 安全密钥管理
    ├── obfuscation.js     # 投票混淆功能
    └── package.json       # 后端依赖配置
```

## 技术栈

### 后端
- Node.js >= 14.0.0
- Express.js - Web框架
- SQLite3 - 数据库
- paillier-bigint - Paillier同态加密库

### 前端
- 微信小程序原生开发

## 环境要求

- Node.js >= 14.0.0
- 微信开发者工具

## 安装和运行

### 后端服务

1. 进入后端目录：
   ```bash
   cd server
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 设置环境变量（可选）：
   ```bash
   export PAILLIER_PASSPHRASE=your_secure_passphrase
   export ENABLE_OBFUSCATION=true
   export OBFUSCATION_INTERVAL=30000
   ```

4. 启动服务器：
   ```bash
   npm start
   ```
   
   或开发模式：
   ```bash
   npm run dev
   ```

### 微信小程序

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 在开发者工具中点击"编译"运行小程序

## 核心功能模块

### 1. 投票管理
- 创建新的投票活动（标题、描述、选项、截止时间）
- 查看投票列表和详情
- 获取投票结果（使用Paillier私钥解密）

### 2. 白名单管理
- 添加或移除白名单用户
- 验证用户是否在白名单中

### 3. 投票参与
- 白名单用户查看进行中的投票
- 使用Paillier公钥加密选票
- 提交加密后的选票到后端

### 4. 投票结果
- 投票结束后查看结果
- 后端使用Paillier私钥解密计数器获得票数统计
- 结果持久化存储，提高查询效率

### 5. 投票混淆
- 系统定期生成虚假投票以增强匿名性
- 虚假投票与真实投票混合处理
- 防止通过分析投票模式推断用户选择

## 安全机制

### Paillier同态加密
- 投票时使用Paillier公钥加密选票
- 后端使用同态加法累加加密票数，无需解密单个选票
- 最终结果使用Paillier私钥解密获得统计

### 投票防重
- 数据库层面设置唯一性约束，防止同一用户对同一投票重复投票
- 应用层面检查用户是否已投票

### 白名单验证
- 只有白名单用户可以参与投票
- 防止非授权用户参与投票

### 安全密钥管理
- Paillier密钥对生成后持久化存储
- 私钥使用密码加密存储
- 公钥明文存储（符合Paillier算法要求）

### 投票混淆
- 定期生成虚假投票以混淆真实投票模式
- 虚假投票与真实投票使用相同加密方式处理
- 增强整体匿名性

## API接口

### 投票相关
- `GET /api/votes` - 获取投票列表
- `POST /api/votes` - 创建投票
- `GET /api/votes/:id` - 获取投票详情
- `POST /api/votes/:id/vote` - 提交投票
- `GET /api/votes/:id/results` - 获取投票结果

### 混淆相关
- `GET /api/obfuscation/stats` - 获取混淆统计信息

### 白名单相关
- `GET /api/whitelist` - 获取白名单
- `POST /api/whitelist` - 添加用户到白名单
- `DELETE /api/whitelist/:userId` - 从白名单移除用户

## 数据库设计

### votes表
存储投票基本信息

### vote_options表
存储投票选项

### whitelist表
存储白名单用户

### encrypted_counters表
存储每个选项的加密计数器

### votes_records表
存储用户投票记录（用于防重）

### vote_results表
存储解密后的投票结果（持久化存储）

### vote_statistics表
存储投票统计信息

### obfuscation_logs表
存储混淆日志

## 开发约定

### 代码风格
- 使用JavaScript ES6+语法
- 遵循Node.js最佳实践
- 使用async/await处理异步操作

### 错误处理
- 统一使用Promise处理异步操作
- 详细的错误日志记录
- 向前端返回明确的错误信息

### 安全实践
- 环境变量管理敏感配置
- 数据库查询使用参数化防止SQL注入
- Paillier密钥的安全存储和管理

## 注意事项

1. 在生产环境中，需要配置HTTPS以确保数据传输安全
2. Paillier密钥需要安全存储和管理
3. 数据库需要定期备份
4. 建议使用更完善的用户认证机制
5. 密钥加密使用的密码应该通过环境变量设置
6. 投票混淆功能可通过环境变量启用或禁用