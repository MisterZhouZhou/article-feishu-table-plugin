// 背景服务工作脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log('飞书文章表格助手已安装');
  
  // 生成临时图标
  // generateIcons();
});

// 生成临时图标
function generateIcons() {
  const sizes = [16, 48, 128];
  
  sizes.forEach(size => {
    const canvas = new OffscreenCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // 绘制背景
    ctx.fillStyle = '#6200ee'; // 主题色
    ctx.fillRect(0, 0, size, size);
    
    // 绘制字母
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', size / 2, size / 2);
    
    // 直接使用imageData更新图标
    chrome.action.setIcon({
      imageData: ctx.getImageData(0, 0, size, size)
    });
  });
}

// 监听消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'addArticle') {
    // 添加文章到飞书
    addArticleToFeishu(message.url, message.title || '', sendResponse);
    return true; // 异步响应
  } else if (message.type === 'getArticles') {
    // 获取文章列表
    fetchArticlesFromFeishu(message.page || 1, message.pageSize || 5, message.pageToken || '', sendResponse);
    return true; // 异步响应
  }
});

// 获取飞书tenant_access_token
async function getTenantAccessToken(appId, appSecret) {
  try {
    const response = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    const data = await response.json();
    
    if (data.code === 0 && data.tenant_access_token) {
      // 保存token及其过期时间
      const expiresAt = Date.now() + (data.expire * 1000) - 60000; // 提前1分钟过期，避免临界问题
      chrome.storage.local.set({
        feishuTenantAccessToken: data.tenant_access_token,
        feishuTokenExpiresAt: expiresAt
      });
      
      return data.tenant_access_token;
    } else {
      console.error('获取tenant_access_token失败:', data);
      throw new Error(`获取tenant_access_token失败: ${data.msg}`);
    }
  } catch (error) {
    console.error('获取tenant_access_token出错:', error);
    throw error;
  }
}

// 获取有效的tenant_access_token
async function getValidTenantAccessToken() {
  // 获取配置信息
  const config = await getFeishuConfig();
  if (!config) {
    throw new Error('请先配置飞书应用信息');
  }
  
  // 检查是否有未过期的token
  const storage = await new Promise(resolve => {
    chrome.storage.local.get(['feishuTenantAccessToken', 'feishuTokenExpiresAt'], resolve);
  });
  
  const now = Date.now();
  
  // 如果token存在且未过期，直接返回
  if (storage.feishuTenantAccessToken && storage.feishuTokenExpiresAt && now < storage.feishuTokenExpiresAt) {
    return storage.feishuTenantAccessToken;
  }
  
  // 否则重新获取token
  return await getTenantAccessToken(config.appId, config.appSecret);
}

// 从飞书多维表格中获取文章列表
async function fetchArticlesFromFeishu(page = 1, pageSize = 5, pageToken = '', callback) {
  try {
    // 获取配置信息
    const config = await getFeishuConfig();
    if (!config) {
      callback({ success: false, message: '请先配置飞书应用信息' });
      return;
    }

    // 获取有效的tenant_access_token
    const tenantAccessToken = await getValidTenantAccessToken();
    
    // 构建URL查询参数
    let url = `https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records/search?page_size=${pageSize}`;
    
    // 只有当有pageToken时才添加到URL中
    if (pageToken) {
      url += `&page_token=${pageToken}`;
    }
    
    // 准备排序请求体
    const requestBody = {
      sort: [
        {
          field_name: '排序',
          desc: true
        }
      ]
    };
    
    // 调用飞书API获取数据
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantAccessToken}`
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    if (data.code === 0) {
      // 解析文章数据
      const articles = data.data.items.map(item => {
        const fields = item.fields;
        return {
          id: item.record_id,
          title: fields.标题 ? fields.标题[0].text : '无标题',
          summary: fields.概要内容输出 ? fields.概要内容输出.value[0].text : '无概要',
          url: fields.链接 ? fields.链接.link : '#'
        };
      });
      
      callback({
        success: true,
        data: {
          articles,
          total: data.data.total || 0,
          hasMore: data.data.has_more || false,
          pageToken: data.data.page_token || '', // 保存返回的page_token用于下次请求
          currentPage: page
        }
      });
    } else {
      callback({ success: false, message: `获取文章失败: ${data.msg}` });
    }
  } catch (error) {
    console.error('获取文章列表出错:', error);
    callback({ success: false, message: '获取文章失败，请检查网络或配置' });
  }
}

// 添加文章到飞书多维表格
async function addArticleToFeishu(url, title, callback) {
  try {
    // 获取配置信息
    const config = await getFeishuConfig();
    if (!config) {
      callback({ success: false, message: '请先配置飞书应用信息' });
      return;
    }

    // 获取有效的tenant_access_token
    const tenantAccessToken = await getValidTenantAccessToken();
    
    // 先检查文章是否已存在
    const existingArticle = await checkArticleExists(url, config.appToken, config.tableId, tenantAccessToken);
    if (existingArticle) {
      callback({ success: false, message: '文章已存在' });
      return;
    }
    
    // 调用飞书API添加文章
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${config.appToken}/tables/${config.tableId}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantAccessToken}`
      },
      body: JSON.stringify({
        fields: {
          链接: {
            link: url,
            text: title || url
          }
        }
      })
    });

    const data = await response.json();
    
    if (data.code === 0) {
      callback({ success: true, message: '添加文章成功' });
    } else {
      callback({ success: false, message: `添加文章失败: ${data.msg}` });
    }
  } catch (error) {
    console.error('添加文章出错:', error);
    callback({ success: false, message: '添加文章失败，请检查网络或配置' });
  }
}

// 检查文章是否已存在
async function checkArticleExists(url, appToken, tableId, tenantAccessToken) {
  try {
    // 调用飞书API搜索文章
    const apiUrl = `https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tenantAccessToken}`
      },
      body: JSON.stringify({
        filter: {
          field_name: '链接',
          operator: 'contains',
          value: url
        }
      })
    });

    const data = await response.json();
    
    if (data.code === 0 && data.data.items && data.data.items.length > 0) {
      return true; // 文章已存在
    }
    
    return false; // 文章不存在
  } catch (error) {
    console.error('检查文章是否存在出错:', error);
    throw error;
  }
}

// 获取飞书配置信息
async function getFeishuConfig() {
  return new Promise(resolve => {
    chrome.storage.local.get(['feishuAppId', 'feishuAppSecret', 'feishuAppToken', 'feishuTableId'], result => {
      if (result.feishuAppId && result.feishuAppSecret && result.feishuAppToken && result.feishuTableId) {
        resolve({
          appId: result.feishuAppId,
          appSecret: result.feishuAppSecret,
          appToken: result.feishuAppToken,
          tableId: result.feishuTableId
        });
      } else {
        resolve(null);
      }
    });
  });
} 