const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 测试图生图模型的调用
async function testImageGeneration() {
  try {
    console.log('开始测试图生图模型调用...');
    console.log('API URL:', process.env.IMAGE_GENERATION_API);
    console.log('API Key:', process.env.IMAGE_GENERATION_API_KEY);
    console.log('Model:', process.env.IMAGE_GENERATION_MODEL);
    
    // 准备测试图片（使用现有的测试图片）
    const testImagePath = path.join(__dirname, 'uploads', 'image-1765935783146-20978085.png');
    
    if (!fs.existsSync(testImagePath)) {
      console.error('测试图片不存在:', testImagePath);
      return;
    }
    
    // 将图片转为Base64
    const imageData = fs.readFileSync(testImagePath);
    const base64Image = Buffer.from(imageData).toString('base64');
    const imageUrl = 'data:image/jpeg;base64,' + base64Image;
    
    // 测试建议描述
    const testDescription = 'A fashion model wearing a red t-shirt and blue jeans, full body, minimalistic studio background, high quality, realistic fashion photography style.';
    
    // 构建图生图请求
    const generateRequest = {
      model: process.env.IMAGE_GENERATION_MODEL,
      prompt: testDescription,
      image: imageUrl,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: '2K',
      stream: false,
      watermark: true
    };
    
    // 调用图生图API
    console.log('发送图生图请求...');
    const response = await axios.post(process.env.IMAGE_GENERATION_API, generateRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.IMAGE_GENERATION_API_KEY
      }
    });
    
    console.log('图生图API调用成功，返回状态码:', response.status);
    console.log('返回数据:', JSON.stringify(response.data, null, 2));
    
    // 检查返回的图片URL
    if (response.data && response.data.data && response.data.data.length > 0) {
      const generatedImageUrl = response.data.data[0].url;
      console.log('生成的图片URL:', generatedImageUrl);
      console.log('测试成功！图生图模型可以正常调用。');
    } else {
      console.error('图生图API返回结果格式异常');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
    if (error.response) {
      console.error('API错误详情:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testImageGeneration();
