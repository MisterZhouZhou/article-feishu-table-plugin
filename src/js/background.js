// 背景服务工作脚本
chrome.runtime.onInstalled.addListener(() => {
  console.log('飞书文章表格助手已安装');
  
  // 生成临时图标
  generateIcons();
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
    fetchArticlesFromFeishu(message.page || 1, message.pageSize || 5, sendResponse);
    return true; // 异步响应
  }
});

// 从飞书多维表格中获取文章列表
async function fetchArticlesFromFeishu(page = 1, pageSize = 5, callback) {
  try {
    // 获取配置信息
    const config = await getFeishuConfig();
    if (!config) {
      callback({ success: false, message: '请先配置飞书应用信息' });
      return;
    }

    const { appToken, tableId, appSecret } = config;
    
    // 计算分页
    const offset = (page - 1) * pageSize;
    
    // 调用飞书API获取数据
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search?page_size=${pageSize}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appSecret}`
      },
      body: JSON.stringify({
        sort: [
          {
            field_name: '排序',
            desc: true
          }
        ],
        page_token: offset > 0 ? String(offset) : undefined
      })
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
          hasMore: data.data.has_more || false
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

    const { appToken, tableId, appSecret } = config;
    
    // 先检查文章是否已存在
    const existingArticle = await checkArticleExists(url, appToken, tableId, appSecret);
    if (existingArticle) {
      callback({ success: false, message: '文章已存在' });
      return;
    }
    
    // 调用飞书API添加文章
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appSecret}`
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
async function checkArticleExists(url, appToken, tableId, appSecret) {
  try {
    // 调用飞书API搜索文章
    const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${appSecret}`
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
    chrome.storage.local.get(['feishuAppSecret', 'feishuAppToken', 'feishuTableId'], result => {
      if (result.feishuAppSecret && result.feishuAppToken && result.feishuTableId) {
        resolve({
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