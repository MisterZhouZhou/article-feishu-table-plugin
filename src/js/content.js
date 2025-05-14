// 内容脚本 - 在网页中执行的代码
// 仅在文章页面创建添加按钮
if (isArticlePage()) {
  // 创建添加按钮
  createAddButton();
  
  // 点击添加按钮时的处理
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.classList.contains('feishu-add-btn')) {
      // 获取文章标题和URL
      const title = document.title || '';
      const url = window.location.href;
      
      // 添加文章到飞书
      addArticleToFeishu(url, title);
    }
  });
}

// 判断是否为文章页面 (根据URL或页面内容)
function isArticlePage() {
  // 这里使用一个简单的判断方法：检查页面是否有长文本内容
  const contentLength = document.body.innerText.length;
  
  // 文章页面通常有大量文本内容
  return contentLength > 1000;
}

// 创建添加按钮
function createAddButton() {
  // 创建按钮元素
  const button = document.createElement('button');
  button.innerText = '添加到飞书';
  button.className = 'feishu-add-btn';
  button.title = '将此文章添加到飞书多维表格';
  
  // 添加样式
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '8px 12px';
  button.style.borderRadius = '4px';
  button.style.backgroundColor = '#6200ee';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.fontWeight = 'bold';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  
  // 添加悬停效果
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#7722ff';
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#6200ee';
  });
  
  // 将按钮添加到页面
  document.body.appendChild(button);
}

// 添加文章到飞书
function addArticleToFeishu(url, title) {
  // 首先检查是否已配置
  chrome.storage.local.get(['feishuAppId', 'feishuAppSecret', 'feishuAppToken', 'feishuTableId'], result => {
    if (!result.feishuAppId || !result.feishuAppSecret || !result.feishuAppToken || !result.feishuTableId) {
      showMessage('请先在插件选项中配置飞书应用信息', 'error');
      
      // 打开选项页面
      chrome.runtime.sendMessage({ type: 'openOptions' });
      return;
    }
    
    // 发送消息到背景脚本
    chrome.runtime.sendMessage(
      { type: 'addArticle', url, title },
      response => {
        if (response && response.success) {
          showMessage('已成功添加到飞书', 'success');
        } else {
          showMessage(response.message || '添加失败', 'error');
        }
      }
    );
  });
}

// 显示消息
function showMessage(message, type = 'info') {
  // 创建消息元素
  const messageEl = document.createElement('div');
  messageEl.innerText = message;
  messageEl.className = 'feishu-message';
  
  // 添加样式
  messageEl.style.position = 'fixed';
  messageEl.style.bottom = '70px';
  messageEl.style.right = '20px';
  messageEl.style.zIndex = '10000';
  messageEl.style.padding = '10px 15px';
  messageEl.style.borderRadius = '4px';
  messageEl.style.fontWeight = 'bold';
  messageEl.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  messageEl.style.transition = 'opacity 0.5s';
  
  // 根据类型设置颜色
  if (type === 'success') {
    messageEl.style.backgroundColor = '#4CAF50';
    messageEl.style.color = 'white';
  } else if (type === 'error') {
    messageEl.style.backgroundColor = '#F44336';
    messageEl.style.color = 'white';
  } else {
    messageEl.style.backgroundColor = '#2196F3';
    messageEl.style.color = 'white';
  }
  
  // 添加到页面
  document.body.appendChild(messageEl);
  
  // 3秒后自动删除
  setTimeout(() => {
    messageEl.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(messageEl);
    }, 500);
  }, 3000);
} 