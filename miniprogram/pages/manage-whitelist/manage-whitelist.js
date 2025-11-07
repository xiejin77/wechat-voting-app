// pages/manage-whitelist/manage-whitelist.js
import { getWhitelist, addToWhitelist, removeFromWhitelist } from '../../utils/api.js';

Page({
  data: {
    newUser: '',
    whitelist: []
  },

  onShow: function () {
    // 页面显示时加载白名单
    this.loadWhitelist();
  },

  loadWhitelist: function() {
    wx.showLoading({
      title: '加载中...'
    });
    
    getWhitelist()
      .then(whitelist => {
        this.setData({
          whitelist: whitelist
        });
      })
      .catch(error => {
        console.error('获取白名单失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onUserInput: function(e) {
    this.setData({
      newUser: e.detail.value
    });
  },

  addUserToWhitelist: function() {
    const newUser = this.data.newUser.trim();
    
    if (!newUser) {
      wx.showToast({
        title: '请输入用户ID或手机号',
        icon: 'none'
      });
      return;
    }
    
    // 验证是否已存在
    const exists = this.data.whitelist.some(item => 
      item.userId === newUser || item.phone === newUser
    );
    
    if (exists) {
      wx.showToast({
        title: '用户已在白名单中',
        icon: 'none'
      });
      return;
    }
    
    // 添加到白名单
    const userData = {
      userId: newUser,
      phone: /^1[3-9]\d{9}$/.test(newUser) ? newUser : ''
    };
    
    wx.showLoading({
      title: '添加中...'
    });
    
    addToWhitelist(userData)
      .then(res => {
        // 更新本地数据
        const whitelist = this.data.whitelist;
        whitelist.push(userData);
        
        this.setData({
          whitelist: whitelist,
          newUser: ''
        });
        
        wx.showToast({
          title: '添加成功',
          icon: 'success'
        });
      })
      .catch(error => {
        console.error('添加到白名单失败:', error);
        wx.showToast({
          title: error.message || '添加失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  removeUser: function(e) {
    const index = e.currentTarget.dataset.index;
    const whitelist = this.data.whitelist;
    const user = whitelist[index];
    
    wx.showLoading({
      title: '移除中...'
    });
    
    removeFromWhitelist(user.userId)
      .then(res => {
        whitelist.splice(index, 1);
        
        this.setData({
          whitelist: whitelist
        });
        
        wx.showToast({
          title: '移除成功',
          icon: 'success'
        });
      })
      .catch(error => {
        console.error('从白名单移除失败:', error);
        wx.showToast({
          title: error.message || '移除失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  }
});