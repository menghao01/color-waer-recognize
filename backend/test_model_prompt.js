const axios = require('axios');
const fs = require('fs');

// 将图片转为Base64
const imageToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const base64 = Buffer.from(data).toString('base64');
        resolve(base64);
      }
    });
  });
};

// 测试色彩分析API
const testColorAnalysis = async () => {
  try {
    const testImagePath = 'D:\\trae\\color_wear\\jimeng-2025-12-16-7665.png';
    
    if (!fs.existsSync(testImagePath)) {
      console.log('测试图片不存在，跳过测试');
      return;
    }
    
    console.log('开始测试色彩分析API...');
    console.log('测试图片:', testImagePath);
    
    // 调用色彩分析API
    const response = await axios.post('http://localhost:3001/api/analyze', {
      filePath: testImagePath
    });
    
    console.log('\n=== API响应结果 ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    // 检查suggested_outfit_description是否包含模特信息
    const description = response.data.suggested_outfit_description;
    if (description) {
      console.log('\n=== 描述检查 ===');
      console.log('suggested_outfit_description:', description);
      
      const hasModel = description.toLowerCase().includes('model') || 
                      description.toLowerCase().includes('模特') ||
                      description.toLowerCase().includes('mannequin') ||
                      description.toLowerCase().includes('wearing');
      
      console.log('是否包含模特信息:', hasModel ? '是' : '否');
      
      if (hasModel) {
        console.log('✅ 成功！描述包含模特信息');
      } else {
        console.log('❌ 失败！描述不包含模特信息');
      }
    }
    
  } catch (error) {
    console.error('测试出错:', error.message);
    if (error.response) {
      console.error('API响应错误:', error.response.data);
    }
  }
};

// 运行测试
testColorAnalysis();