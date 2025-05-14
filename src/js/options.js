// 选项页面JavaScript

document.addEventListener('DOMContentLoaded', () => {
  const configForm = document.getElementById('configForm');
  const statusMessage = document.getElementById('statusMessage');
  
  // 加载保存的配置
  loadSavedConfig();
  
  // 监听表单提交
  configForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveConfig();
  });
  
  // 加载保存的配置
  function loadSavedConfig() {
    chrome.storage.local.get(['feishuAppId', 'feishuAppSecret', 'feishuAppToken', 'feishuTableId'], (result) => {
      if (result.feishuAppId) {
        document.getElementById('appId').value = result.feishuAppId;
      }
      
      if (result.feishuAppSecret) {
        document.getElementById('appSecret').value = result.feishuAppSecret;
      }
      
      if (result.feishuAppToken) {
        document.getElementById('appToken').value = result.feishuAppToken;
      }
      
      if (result.feishuTableId) {
        document.getElementById('tableId').value = result.feishuTableId;
      }
    });
  }
  
  // 保存配置
  function saveConfig() {
    const appId = document.getElementById('appId').value.trim();
    const appSecret = document.getElementById('appSecret').value.trim();
    const appToken = document.getElementById('appToken').value.trim();
    const tableId = document.getElementById('tableId').value.trim();
    
    if (!appId || !appSecret || !appToken || !tableId) {
      showStatusMessage('请填写所有必填字段', 'error');
      return;
    }
    
    // 保存到Chrome存储
    chrome.storage.local.set({
      feishuAppId: appId,
      feishuAppSecret: appSecret,
      feishuAppToken: appToken,
      feishuTableId: tableId
    }, () => {
      if (chrome.runtime.lastError) {
        showStatusMessage(`保存失败: ${chrome.runtime.lastError.message}`, 'error');
      } else {
        showStatusMessage('配置已保存', 'success');
      }
    });
  }
  
  // 显示状态消息
  function showStatusMessage(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    
    switch (type) {
      case 'success':
        statusMessage.classList.add('alert', 'alert-success');
        break;
      case 'error':
        statusMessage.classList.add('alert', 'alert-error');
        break;
      case 'warning':
        statusMessage.classList.add('alert', 'alert-warning');
        break;
      default:
        statusMessage.classList.add('alert', 'alert-info');
    }
    
    // 3秒后自动隐藏
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = 'status-message';
    }, 3000);
  }
}); 