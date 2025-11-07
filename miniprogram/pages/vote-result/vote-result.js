// pages/vote-result/vote-result.js
import { getVoteDetail, getVoteResults } from '../../utils/api.js';

Page({
  data: {
    vote: {},
    results: []
  },

  onLoad: function (options) {
    // 从页面参数获取投票ID
    const voteId = options.id;
    
    // 加载投票结果
    this.loadVoteResult(voteId);
  },

  loadVoteResult: function(voteId) {
    wx.showLoading({
      title: '加载中...'
    });
    
    // 获取投票详情
    Promise.all([
      getVoteDetail(voteId),
      getVoteResults(voteId)
    ])
      .then(([vote, results]) => {
        // 计算总票数
        const totalVotes = results.reduce((sum, item) => sum + item.count, 0);
        
        // 格式化结果数据
        const formattedResults = results.map(item => {
          const percentage = totalVotes > 0 ? Math.round((item.count / totalVotes) * 1000) / 10 : 0;
          return {
            optionId: item.optionId,
            optionText: this.getOptionText(vote.options, item.optionId),
            count: item.count,
            percentage: percentage
          };
        });
        
        this.setData({
          vote: vote,
          results: formattedResults
        });
      })
      .catch(error => {
        console.error('获取投票结果失败:', error);
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },
  
  getOptionText: function(options, optionId) {
    const option = options.find(opt => opt.id == optionId);
    return option ? option.text : '未知选项';
  }
});