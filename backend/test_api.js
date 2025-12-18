require('dotenv').config();
const axios = require('axios');

// 豆包API测试
async function testDoubaoAPI() {
  const apiKey = process.env.ARK_API_KEY;
  const modelId = process.env.DOUBAO_MODEL;
  const apiUrl = process.env.ARK_BASE_URL;

  try {
    console.log('开始测试豆包API调用...');
    console.log('API URL:', apiUrl);
    console.log('API Key:', apiKey.substring(0, 10) + '...');
    console.log('Model ID:', modelId);
    
    const response = await axios.post(apiUrl, {
      model: modelId,
      messages: [
        {
          content: [
            {
              text: '你好，请回复"API测试成功"来确认豆包模型正常工作。',
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

    console.log('✅ 豆包API调用成功！');
    console.log('返回状态码:', response.status);
    console.log('返回内容:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ 豆包API调用失败:');
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误响应:', error.response.data);
    } else {
      console.error('错误信息:', error.message);
    }
  }
}

testDoubaoAPI();