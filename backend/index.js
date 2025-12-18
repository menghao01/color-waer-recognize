const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 创建上传目录
const uploadPath = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// 配置中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 // 默认5MB
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件（JPEG、JPG、PNG、GIF）'));
    }
  }
});

// 测试路由
app.get('/', (req, res) => {
  res.json({ message: '穿搭色彩搭配分析API' });
});

// 文件上传路由
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const fileInfo = {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype
    };
    
    res.status(200).json({ success: true, file: fileInfo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

// 色彩分析路由
app.post('/api/analyze', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: '缺少文件路径参数' });
    }
    
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }
    
    // 将图片转为Base64
    const base64Image = await imageToBase64(filePath);
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
              text: '你是一位严格的时尚色彩搭配师。请识别图片中两件主要衣物的主色调（例如：上衣颜色、下装颜色）。根据日常穿搭的色彩搭配原理（互补色、同色系、邻近色等）严格判断当前搭配是否合适。\n判断标准必须严格执行：\n1. 互补色（如纯红与纯绿、纯橙与纯蓝、纯黄与纯紫）搭配在日常穿搭中视为不合适，除非颜色饱和度很低\n2. 高饱和度颜色之间的搭配（如亮红配亮黄、亮蓝配亮绿）视为不合适\n3. 同色系、邻近色、低饱和度颜色的搭配视为合适\n4. 黑白灰作为中性色可与任何颜色搭配\n\n请仔细观察图片中衣物的颜色饱和度和对比度：\n- 如果是高饱和度的撞色搭配，必须判定为不合适\n- 如果是低饱和度的相似色或邻近色搭配，判定为合适\n\n如果判定为不合适，请务必给出明确的建议替换颜色（例如：保持上衣不变，建议下装换成什么颜色，或者反之）。如果合适，则建议颜色保持与原图一致。\n请严格按照以下JSON格式输出结果，不要添加任何额外内容：\n{"dominant_colors": ["#颜色1", "#颜色2"], "is_harmonious": true/false, "comment": "简短评价", "suggestion_logic": "keep_original" 或 "suggest_new", "suggested_outfit_description": "生成图片的英文Prompt描述，必须包含模特穿着衣物的描述，例如：A model wearing a red t-shirt and white pants on a white background"}\n\n特别注意：dominant_colors必须返回有效的十六进制CSS颜色值，例如#FF0000、#008000等，不能返回中文颜色名称如\'红色\'、\'绿色\'。\n无论搭配是否合适，都必须返回完整的JSON格式，包括suggested_outfit_description字段。\nsuggested_outfit_description必须包含模特信息。',
              type: 'text'
            }
          ],
          role: 'user'
        }
      ]
    };
    
    // 调用豆包AI API
    console.log('开始调用豆包AI API...');
    console.log('API URL:', process.env.ARK_BASE_URL);
    console.log('API Key:', process.env.ARK_API_KEY.substring(0, 5) + '...' + process.env.ARK_API_KEY.substring(process.env.ARK_API_KEY.length - 5));
    const aiResponse = await axios.post(process.env.ARK_BASE_URL, aiRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.ARK_API_KEY
      }
    });
    console.log('豆包AI API调用成功，返回状态码:', aiResponse.status);
    
    // 解析AI返回结果
    const aiResult = aiResponse.data;
    console.log('AI完整响应:', JSON.stringify(aiResult));
    if (!aiResult.choices || aiResult.choices.length === 0) {
      return res.status(500).json({ error: 'AI返回结果格式异常' });
    }
    
    // 提取JSON内容
    const aiContent = aiResult.choices[0].message.content;
    console.log('AI返回内容:', aiContent);
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    console.log('提取的JSON匹配:', jsonMatch);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'AI返回内容不是有效的JSON格式' });
    }
    
    const analysisResult = JSON.parse(jsonMatch[0]);
    console.log('AI返回的分析结果:', JSON.stringify(analysisResult));
    res.status(200).json(analysisResult);
    
  } catch (error) {
    console.error('AI分析错误:', error);
    res.status(500).json({ error: error.message || 'AI分析失败' });
  }
});

// 生成模特图路由
app.post('/api/generate-image', async (req, res) => {
  try {
    const { suggested_outfit_description, original_image_path } = req.body;
    
    if (!suggested_outfit_description) {
      return res.status(400).json({ error: '缺少生图描述参数' });
    }
    
    if (!original_image_path) {
      return res.status(400).json({ error: '缺少原始图片路径参数' });
    }
    
    // 检查原始图片是否存在
    if (!fs.existsSync(original_image_path)) {
      return res.status(404).json({ error: '原始图片不存在' });
    }
    
    // 将原始图片转为Base64
    const base64Image = await imageToBase64(original_image_path);
    const imageUrl = 'data:image/jpeg;base64,' + base64Image;
    
    console.log('开始调用图生图API...');
    console.log('生图描述:', suggested_outfit_description);
    console.log('API URL:', process.env.IMAGE_GENERATION_API);
    console.log('API Key:', process.env.IMAGE_GENERATION_API_KEY.substring(0, 5) + '...' + process.env.IMAGE_GENERATION_API_KEY.substring(process.env.IMAGE_GENERATION_API_KEY.length - 5));
    
    // 构建图生图请求
    const generateRequest = {
      model: process.env.IMAGE_GENERATION_MODEL,
      prompt: suggested_outfit_description,
      image: imageUrl,
      sequential_image_generation: 'disabled',
      response_format: 'url',
      size: '1024x1024',
      stream: false,
      watermark: true
    };
    
    // 调用图生图API
    const generateResponse = await axios.post(process.env.IMAGE_GENERATION_API, generateRequest, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.IMAGE_GENERATION_API_KEY
      }
    });
    
    console.log('图生图API调用成功，返回状态码:', generateResponse.status);
    
    // 解析API返回结果
    const imageData = generateResponse.data;
    if (!imageData || !imageData.data || imageData.data.length === 0) {
      return res.status(500).json({ error: '图生图API返回结果格式异常' });
    }
    
    const generatedImageUrl = imageData.data[0].url;
    
    res.status(200).json({
      image_url: generatedImageUrl,
      message: '图片生成成功',
      description: suggested_outfit_description
    });
    
  } catch (error) {
    console.error('生图错误:', error);
    console.error('错误详情:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.message || '图片生成失败' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('服务器运行在 http://localhost:' + PORT);
});