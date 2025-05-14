// 弹出窗口JavaScript

// 全局变量
let currentPage = 1;
const PAGE_SIZE = 5;
let totalArticles = 0;
let nextPageToken = ''; // 存储下一页的令牌
let pageTokenMap = {}; // 存储每页对应的page_token

document.addEventListener('DOMContentLoaded', () => {
  // 获取DOM元素
  const addArticleBtn = document.getElementById('addArticleBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const configBtn = document.getElementById('configBtn');
  const articlesContainer = document.getElementById('articlesContainer');
  const paginationContainer = document.getElementById('paginationContainer');
  const messageContainer = document.getElementById('messageContainer');
  
  // 绑定事件
  addArticleBtn.addEventListener('click', addCurrentArticle);
  refreshBtn.addEventListener('click', () => fetchArticles(1, ''));
  configBtn.addEventListener('click', openOptionsPage);
  
  // 初始加载文章
  fetchArticles(currentPage, '');
  
  // 添加当前文章
  async function addCurrentArticle() {
    try {
      // 获取当前标签页
      const tabs = await new Promise(resolve => chrome.tabs.query({active: true, currentWindow: true}, resolve));
      const currentTab = tabs[0];
      
      if (!currentTab) {
        showMessage('无法获取当前页面信息', 'error');
        return;
      }
      
      // 显示加载中
      addArticleBtn.disabled = true;
      addArticleBtn.innerHTML = '<div class="loading"></div>';
      
      // 发送消息到后台添加文章
      chrome.runtime.sendMessage(
        {
          type: 'addArticle',
          url: currentTab.url,
          title: currentTab.title
        },
        (response) => {
          // 恢复按钮状态
          addArticleBtn.disabled = false;
          addArticleBtn.textContent = '添加当前文章';
          
          if (response.success) {
            showMessage(response.message, 'success');
            fetchArticles(1, ''); // 刷新文章列表，从第一页开始
          } else {
            showMessage(response.message, 'error');
          }
        }
      );
    } catch (error) {
      console.error('添加文章出错:', error);
      showMessage('添加文章失败', 'error');
      addArticleBtn.disabled = false;
      addArticleBtn.textContent = '添加当前文章';
    }
  }
  
  // 获取文章列表
  function fetchArticles(page, pageToken) {
    currentPage = page;
    
    // 显示加载中
    articlesContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading"></div>
      </div>
    `;
    paginationContainer.innerHTML = '';
    
    // 从后台获取文章列表
    chrome.runtime.sendMessage(
      {
        type: 'getArticles',
        page: page,
        pageSize: PAGE_SIZE,
        pageToken: pageToken
      },
      (response) => {
        if (response.success) {
          renderArticles(response.data.articles);
          totalArticles = response.data.total;
          
          // 保存当前页的token和下一页的token
          if (response.data.pageToken) {
            nextPageToken = response.data.pageToken;
            pageTokenMap[page + 1] = response.data.pageToken;
          }
          
          renderPagination(page, Math.ceil(totalArticles / PAGE_SIZE));
        } else {
          showError(response.message);
        }
      }
    );
  }
  
  // 渲染文章列表
  function renderArticles(articles) {
    if (!articles || articles.length === 0) {
      articlesContainer.innerHTML = `
        <div class="no-articles">
          暂无文章，请添加新文章或检查配置
        </div>
      `;
      return;
    }
    
    articlesContainer.innerHTML = '';
    
    articles.forEach(article => {
      const articleCard = document.createElement('div');
      articleCard.className = 'card article-card';
      
      articleCard.innerHTML = `
        <h3 class="article-title">${escapeHtml(article.title)}</h3>
        <div class="article-summary">${escapeHtml(article.summary)}</div>
        <div class="card-actions">
          <a href="${escapeHtml(article.url)}" class="btn btn-text" target="_blank">查看原文</a>
        </div>
      `;
      
      articlesContainer.appendChild(articleCard);
    });
  }
  
  // 渲染分页控件
  function renderPagination(currentPage, totalPages) {
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }
    
    paginationContainer.innerHTML = '';
    
    // 上一页按钮
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '«';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        // 使用上一页的token
        const prevPageToken = pageTokenMap[currentPage - 1] || '';
        fetchArticles(currentPage - 1, prevPageToken);
      }
    });
    paginationContainer.appendChild(prevBtn);
    
    // 页码按钮
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = i === currentPage ? 'active' : '';
      pageBtn.addEventListener('click', () => {
        if (i !== currentPage) {
          // 使用存储的token进行分页
          const token = pageTokenMap[i] || '';
          fetchArticles(i, token);
        }
      });
      paginationContainer.appendChild(pageBtn);
    }
    
    // 下一页按钮
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '»';
    nextBtn.disabled = currentPage === totalPages || !nextPageToken;
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages && nextPageToken) {
        fetchArticles(currentPage + 1, nextPageToken);
      }
    });
    paginationContainer.appendChild(nextBtn);
  }
  
  // 打开配置页面
  function openOptionsPage() {
    chrome.runtime.openOptionsPage();
  }
  
  // 显示错误信息
  function showError(message) {
    articlesContainer.innerHTML = `
      <div class="error-container">
        <p>${escapeHtml(message)}</p>
      </div>
    `;
  }
  
  // 显示消息
  function showMessage(message, type = 'info') {
    messageContainer.textContent = message;
    messageContainer.className = 'status-message';
    
    switch (type) {
      case 'success':
        messageContainer.classList.add('alert', 'alert-success');
        break;
      case 'error':
        messageContainer.classList.add('alert', 'alert-error');
        break;
      case 'warning':
        messageContainer.classList.add('alert', 'alert-warning');
        break;
      default:
        messageContainer.classList.add('alert', 'alert-info');
    }
    
    // 3秒后自动隐藏
    setTimeout(() => {
      messageContainer.textContent = '';
      messageContainer.className = 'status-message';
    }, 3000);
  }
  
  // HTML转义
  function escapeHtml(str) {
    if (!str) return '';
    
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  // 检查配置状态
  function checkConfig() {
    chrome.storage.local.get(['feishuAppId', 'feishuAppSecret', 'feishuAppToken', 'feishuTableId'], function(config) {
      const configStatus = document.getElementById('config-status');
      
      if (config.feishuAppId && config.feishuAppSecret && config.feishuAppToken && config.feishuTableId) {
        configStatus.textContent = '已配置';
        configStatus.className = 'status-ok';
      } else {
        configStatus.textContent = '未配置';
        configStatus.className = 'status-error';
      }
    });
  }
}); 