// 创建Canvas画布生成临时图标

function generateIcon(size, callback) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
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
  
  // 将Canvas转换为图片
  const dataUrl = canvas.toDataURL('image/png');
  
  // 回调函数处理图像数据
  callback(dataUrl);
}

// 生成图标并保存到本地存储
function generateAndSaveIcons() {
  const sizes = [16, 48, 128];
  let savedCount = 0;
  
  sizes.forEach(size => {
    generateIcon(size, (dataUrl) => {
      // 将图标保存到本地存储
      const key = `icon${size}`;
      chrome.storage.local.set({ [key]: dataUrl }, () => {
        savedCount++;
        console.log(`图标 ${size}x${size} 已保存`);
        
        // 所有图标保存完成后
        if (savedCount === sizes.length) {
          console.log('所有图标已保存完成');
        }
      });
    });
  });
}

// 安装时生成图标
chrome.runtime.onInstalled.addListener(() => {
  generateAndSaveIcons();
}); 