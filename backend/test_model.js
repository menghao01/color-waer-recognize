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
              text: '你是一位严格的时尚色彩搭配师。请识别图片中两件主要衣物的主色调（例如：上衣颜色、下装颜色）。根据日常穿搭的色彩搭配原理（互补色、同色系、邻近色等）严格判断当前搭配是否合适。\n判断标准必须严格执行：\n1. 互补色（如纯红与纯绿、纯橙与纯蓝、纯黄与纯紫）搭配在日常穿搭中视为不合适，除非颜色饱和度很低\n2. 高饱和度颜色之间的搭配（如亮红配亮黄、亮蓝配亮绿）视为不合适\n3. 同色系、邻近色、低饱和度颜色的搭配视为合适\n4. 黑白灰作为中性色可与任何颜色搭配\n\n请仔细观察图片中衣物的颜色饱和度和对比度：\n- 如果是高饱和度的撞色搭配，必须判定为不合适\n- 如果是低饱和度的相似色或邻近色搭配，判定为合适\n\n如果判定为不合适，请务必给出明确的建议替换颜色（例如：保持上衣不变，建议下装换成什么颜色，或者反之）。如果合适，则建议颜色保持与原图一致。\n请严格按照以下JSON格式输出结果，不要添加任何额外内容：\n{\"dominant_colors\": [\"#颜色1\", \"#颜色2\"], \"is_harmonious\": true/false, \"comment\": \"简短评价\", \"suggestion_logic\": \"keep_original\" 或 \"suggest_new\", \"suggested_outfit_description\": \"生成图片的英文Prompt描述\"}\n\n特别注意：dominant_colors必须返回有效的十六进制CSS颜色值，例如#FF0000、#008000等，不能返回中文颜色名称如\\\'红色\\\'、\\\'绿色\\\'。\n无论搭配是否合适，都必须返回完整的JSON格式，包括suggested_outfit_description字段。',
              type: 'text'
            }
          ],
          role: 'user'
        }
      ]
    };
    
    console.log('调用Doubao API...');
    console.log('API URL:', process.env.ARK_BASE_URL);
    console.log('API Key:', process.env.ARK_API_KEY.substring(0, 5) + '...' + process.env.ARK_API_KEY.substring(process.env.ARK_API_KEY.length - 5));
    
    // 调用豆包AI API
    const aiResponse = await axios.post(process.env.ARK_BASE_URL, aiRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.ARK_API_KEY
      }
    });
    
    console.log('API调用成功，返回状态码:', aiResponse.status);
    console.log('完整返回结果:', JSON.stringify(aiResponse.data, null, 2));
    
    // 解析AI返回结果
    const aiResult = aiResponse.data;
    if (!aiResult.choices || aiResult.choices.length === 0) {
      console.error('AI返回结果格式异常');
      return;
    }
    
    // 提取JSON内容
    const aiContent = aiResult.choices[0].message.content;
    console.log('\nAI返回内容:', aiContent);
    
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('AI返回内容不是有效的JSON格式');
      return;
    }
    
    const analysisResult = JSON.parse(jsonMatch[0]);
    console.log('\n解析后的分析结果:', JSON.stringify(analysisResult, null, 2));
    
    // 特别查看颜色值
    console.log('\n=== 颜色值检查 ===');
    console.log('主色调:', analysisResult.dominant_colors);
    console.log('第一个颜色值:', analysisResult.dominant_colors[0]);
    console.log('第二个颜色值:', analysisResult.dominant_colors[1]);
    
    // 检查颜色值是否为有效的十六进制格式
    const isHexColor = (color) => {
      return /^#[0-9A-F]{6}$/i.test(color);
    };
    
    console.log('\n颜色值格式检查:');
    console.log('第一个颜色是否为十六进制:', isHexColor(analysisResult.dominant_colors[0]));
    console.log('第二个颜色是否为十六进制:', isHexColor(analysisResult.dominant_colors[1]));
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    if (error.response) {
      console.error('错误响应状态码:', error.response.status);
      console.error('错误响应数据:', error.response.data);
    } else if (error.request) {
      console.error('请求发送失败，未收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
  }
};

// 运行测试
testDoubaoModel();
