const fs = require('fs');
const axios = require('axios');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 将图片转换为Base64
const imageToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Buffer.from(data).toString('base64'));
    });
  });
};

// 测试Doubao模型
const testDoubaoModel = async () => {
  try {
    // 用户提供的图片路径
    const imagePath = 'd:/trae/color_wear/jimeng-2025-12-16-7665.png';
    
    // 检查图片是否存在
    if (!fs.existsSync(imagePath)) {
      console.error('图片文件不存在:', imagePath);
      return;
    }
    
    console.log('开始测试Doubao模型...');
    console.log('图片路径:', imagePath);
    
    // 将图片转为Base64
    const base64Image = await imageToBase64(imagePath);
    const imageUrl = 'data:image/jpeg;base64,' + base64Image;
    
    // 使用更简洁的提示词
    const simplePrompt = '请识别图片中主要衣物的两种主色调，严格按照JSON格式输出：{"dominant_colors": ["#颜色1", "#颜色2"]}，必须返回十六进制颜色值！';
    
    // 构建豆包AI请求
    const aiRequest = {
      model: process.env.DOUBAO_MODEL,
      messages: [
        {
          content: [
            {
              image_url: {
                url: imageUrl
              },
              type: 'image_url'
            },
            {
              text: simplePrompt,
              type: 'text'
            }
          ],
          role: 'user'
        }
      ]
    };
    
    console.log('调用Doubao API...');
    
    // 调用豆包AI API
    const aiResponse = await axios.post(process.env.ARK_BASE_URL, aiRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.ARK_API_KEY
      }
    });
    
    console.log('API调用成功，返回状态码:', aiResponse.status);
    
    // 解析AI返回结果
    const aiResult = aiResponse.data;
    const aiContent = aiResult.choices[0].message.content;
    
    console.log('\nAI返回内容:', aiContent);
    
    // 尝试提取JSON
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0]);
        console.log('\n解析后的JSON:', JSON.stringify(result, null, 2));
        
        // 检查颜色值
        if (result.dominant_colors) {
          console.log('\n颜色值检查:');
          console.log('颜色1:', result.dominant_colors[0], '- 是否为十六进制:', /^#[0-9A-F]{6}$/i.test(result.dominant_colors[0]));
          console.log('颜色2:', result.dominant_colors[1], '- 是否为十六进制:', /^#[0-9A-F]{6}$/i.test(result.dominant_colors[1]));
        }
      } catch (parseError) {
        console.error('JSON解析错误:', parseError.message);
      }
    } else {
      console.error('未找到JSON内容');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error.message);
    if (error.response) {
      console.error('错误响应:', error.response.data);
    }
  }
};

// 运行测试
testDoubaoModel();
