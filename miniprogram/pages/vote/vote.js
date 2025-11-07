// pages/vote/vote.js
import { getVotes } from '../../utils/api.js';

Page({
  data: {
    votes: []
  },

  onShow: function () {
    // 页面显示时加载投票列表
    this.loadVotes();
  },

  loadVotes: function() {
    wx.showLoading({
      title: '加载中...'
    });
    
    getVotes()
      .then(votes => {
        // 设置投票状态
        const now = new Date();
        votes.forEach(vote => {
          const endDate = new Date(vote.endDate);
          vote.status = now <= endDate ? 'active' : 'ended';
        });
        
        this.setData({
          votes: votes
        });
      })
      .catch(error => {
        console.error('获取投票列表失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  goToVoteDetail: function(e) {
    const voteId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/vote-detail/vote-detail?id=${voteId}`
    });
  }
});