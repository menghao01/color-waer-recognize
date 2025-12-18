require('dotenv').config();
const axios = require('axios');

// 测试当前豆包模型是否支持生图功能
async function testModelImageGeneration() {
  const apiKey = process.env.ARK_API_KEY;
  const modelId = process.env.DOUBAO_MODEL;
  const apiUrl = process.env.ARK_BASE_URL;

  try {
    console.log('开始测试当前豆包模型是否支持生图功能...');
    console.log('当前使用模型:', modelId);
    
    const response = await axios.post(apiUrl, {
      model: modelId,
      messages: [
        {
          content: [
            {
              text: '你是否支持直接生成图片？如果支持，请返回"支持"；如果不支持，请返回"不支持"，并简要说明原因。',
              type: 'text'
            }
          ],
          role: 'user'
        }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });

    console.log('✅ 模型测试调用成功！');
    console.log('返回状态码:', response.status);
    console.log('返回内容:', response.data.choices[0].message.content);
    
    return response.data.choices[0].message.content;

  } catch (error) {
    console.error('❌ 模型测试调用失败:');
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误响应:', error.response.data);
    } else {
      console.error('错误信息:', error.message);
    }
    return null;
  }
}

// 执行测试
testModelImageGeneration();
