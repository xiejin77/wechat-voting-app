// pages/create-vote/create-vote.js
import { createVote } from '../../utils/api.js';

Page({
  data: {
    voteTitle: '',
    voteDescription: '',
    options: [
      { text: '' },
      { text: '' }
    ],
    endDate: ''
  },

  onLoad: function (options) {
    // 设置默认截止时间为7天后
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const year = nextWeek.getFullYear();
    const month = String(nextWeek.getMonth() + 1).padStart(2, '0');
    const day = String(nextWeek.getDate()).padStart(2, '0');
    
    this.setData({
      endDate: `${year}-${month}-${day}`
    });
  },

  onTitleInput: function(e) {
    this.setData({
      voteTitle: e.detail.value
    });
  },

  onDescriptionInput: function(e) {
    this.setData({
      voteDescription: e.detail.value
    });
  },

  onOptionInput: function(e) {
    const index = e.currentTarget.dataset.index;
    const options = this.data.options;
    options[index].text = e.detail.value;
    this.setData({
      options: options
    });
  },

  addOption: function() {
    const options = this.data.options;
    options.push({ text: '' });
    this.setData({
      options: options
    });
  },

  deleteOption: function(e) {
    const index = e.currentTarget.dataset.index;
    const options = this.data.options;
    
    if (options.length <= 2) {
      wx.showToast({
        title: '至少需要两个选项',
        icon: 'none'
      });
      return;
    }
    
    options.splice(index, 1);
    this.setData({
      options: options
    });
  },

  onDateChange: function(e) {
    this.setData({
      endDate: e.detail.value
    });
  },

  submitVote: function() {
    const { voteTitle, voteDescription, options, endDate } = this.data;
    
    // 验证输入
    if (!voteTitle.trim()) {
      wx.showToast({
        title: '请输入投票主题',
        icon: 'none'
      });
      return;
    }
    
    if (!voteDescription.trim()) {
      wx.showToast({
        title: '请输入投票描述',
        icon: 'none'
      });
      return;
    }
    
    const validOptions = options.filter(option => option.text.trim() !== '');
    if (validOptions.length < 2) {
      wx.showToast({
        title: '至少需要两个有效选项',
        icon: 'none'
      });
      return;
    }
    
    // 准备投票数据
    const voteData = {
      title: voteTitle,
      description: voteDescription,
      options: validOptions,
      endDate: endDate
    };
    
    wx.showLoading({
      title: '创建中...'
    });
    
    createVote(voteData)
      .then(res => {
        wx.showToast({
          title: '投票创建成功',
          icon: 'success'
        });
        
        // 返回首页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      })
      .catch(error => {
        console.error('创建投票失败:', error);
        wx.showToast({
          title: error.message || '创建失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  }
});