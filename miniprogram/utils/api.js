// miniprogram/utils/api.js
const BASE_URL = 'http://localhost:3000/api';

// 登录获取令牌
export function login(username, password) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/login`,
      method: 'POST',
      data: {
        username,
        password
      },
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        if (res.statusCode === 200) {
          // 保存令牌到本地存储
          wx.setStorageSync('userToken', res.data.token);
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '登录失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 获取当前用户的令牌
function getToken() {
  return wx.getStorageSync('userToken') || null;
}

// 获取投票列表
export function getVotes() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/votes`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '获取投票列表失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 创建投票
export function createVote(voteData) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/votes`,
      method: 'POST',
      data: voteData,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '创建投票失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 获取投票详情
export function getVoteDetail(voteId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/votes/${voteId}`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '获取投票详情失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 提交投票
export function submitVote(voteId, voteData) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/votes/${voteId}/vote`,
      method: 'POST',
      data: voteData,
      header: {
        'Content-Type': 'application/json'
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '提交投票失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 获取投票结果
export function getVoteResults(voteId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/votes/${voteId}/results`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '获取投票结果失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 获取白名单
export function getWhitelist() {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/whitelist`,
      method: 'GET',
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '获取白名单失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 添加用户到白名单
export function addToWhitelist(userData) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/whitelist`,
      method: 'POST',
      data: userData,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '添加到白名单失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

// 从白名单移除用户
export function removeFromWhitelist(userId) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}/whitelist/${userId}`,
      method: 'DELETE',
      header: {
        'Authorization': `Bearer ${getToken()}`
      },
      success(res) {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(res.data.error || '从白名单移除失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}