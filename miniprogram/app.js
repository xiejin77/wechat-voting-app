// miniprogram/app.js
App({
  onLaunch: function () {
    // 初始化应用
    console.log('应用启动');
  },
  globalData: {
    userInfo: null,
    serverUrl: 'https://your-server.com/api', // 后端API地址
    userToken: null
  }
})