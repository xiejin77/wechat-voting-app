// pages/index/index.js
Page({
  data: {
    
  },
  
  onLoad: function (options) {
    
  },
  
  goToCreateVote: function() {
    wx.navigateTo({
      url: '/pages/create-vote/create-vote'
    });
  },
  
  goToVoteList: function() {
    wx.navigateTo({
      url: '/pages/vote/vote'
    });
  },
  
  goToWhitelist: function() {
    wx.navigateTo({
      url: '/pages/manage-whitelist/manage-whitelist'
    });
  }
});