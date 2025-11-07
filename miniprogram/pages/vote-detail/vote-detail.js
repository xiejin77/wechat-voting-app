// pages/vote-detail/vote-detail.js
import { getVoteDetail, submitVote } from '../../utils/api.js';
import paillier from '../../utils/paillier.js';

Page({
  data: {
    vote: {},
    selectedOption: null
  },

  onLoad: function (options) {
    // 从页面参数获取投票ID
    const voteId = options.id;
    
    // 加载投票详情
    this.loadVoteDetail(voteId);
  },

  loadVoteDetail: function(voteId) {
    wx.showLoading({
      title: '加载中...'
    });
    
    getVoteDetail(voteId)
      .then(vote => {
        // 检查投票是否已结束
        const now = new Date();
        const endDate = new Date(vote.endDate);
        vote.status = now <= endDate ? 'active' : 'ended';
        
        this.setData({
          vote: vote
        });
      })
      .catch(error => {
        console.error('获取投票详情失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onOptionChange: function(e) {
    this.setData({
      selectedOption: parseInt(e.detail.value)
    });
  },

  submitVote: function() {
    if (this.data.selectedOption === null) {
      wx.showToast({
        title: '请选择一个选项',
        icon: 'none'
      });
      return;
    }

    // 获取用户信息（实际应用中应从登录状态获取）
    const userId = 'user001'; // 模拟用户ID
    
    // 使用Paillier算法加密选票
    const encryptedVote = paillier.encryptVote(this.data.selectedOption);
    
    const voteData = {
      userId: userId,
      optionId: this.data.selectedOption,
      encryptedVote: encryptedVote.encrypted
    };
    
    wx.showLoading({
      title: '提交中...'
    });
    
    submitVote(this.data.vote.id, voteData)
      .then(res => {
        wx.showToast({
          title: '投票成功',
          icon: 'success'
        });
        
        // 返回投票列表
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(error => {
        console.error('提交投票失败:', error);
        wx.showToast({
          title: error.message || '投票失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  goToResult: function() {
    const voteId = this.data.vote.id;
    wx.navigateTo({
      url: `/pages/vote-result/vote-result?id=${voteId}`
    });
  }
});