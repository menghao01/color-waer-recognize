import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import axios from 'axios'

const app = express()

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 在Vercel环境中，使用/tmp目录
    const uploadDir = '/tmp/uploads'
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'image-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('只支持JPEG、PNG和GIF格式的图片'), false)
    }
  }
})

app.use(express.json())

// 文件上传API
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    const result = {
      success: true,
      file: {
        path: req.file.path,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      }
    }

    res.json(result)
  } catch (error) {
    console.error('文件上传错误:', error)
    res.status(500).json({ error: '文件上传失败' })
  }
})

// 色彩分析API
app.post('/api/analyze', async (req, res) => {
  try {
    const { filePath } = req.body
    
    if (!filePath) {
      return res.status(400).json({ error: '缺少文件路径参数' })
    }

    // 从环境变量获取API配置
    const apiKey = process.env.ARK_API_KEY
    const modelName = process.env.DOUBAO_MODEL || 'doubao-seed-1-6-flash-250828'
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API密钥未配置' })
    }

    // 读取图片文件
    const imageBuffer = fs.readFileSync(filePath)
    const base64Image = imageBuffer.toString('base64')

    // 调用豆包API进行色彩分析
    const response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      model: modelName,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `请分析这张图片中的主要颜色，并返回JSON格式结果，包含以下字段：
              {
                "dominant_colors": ["颜色1", "颜色2", ...], // 主要颜色名称列表
                "is_harmonious": true/false, // 颜色是否和谐
                "comment": "色彩分析评论",
                "suggested_outfit_description": "建议的穿搭描述"
              }`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const result = response.data.choices[0].message.content
    
    // 尝试解析JSON结果
    try {
      const parsedResult = JSON.parse(result)
      
      // 验证必要字段
      if (!parsedResult.dominant_colors || !Array.isArray(parsedResult.dominant_colors)) {
        throw new Error('分析结果格式错误')
      }
      
      res.json(parsedResult)
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError)
      
      // 如果解析失败，返回默认结果
      const defaultResult = {
        dominant_colors: ['蓝色', '白色'],
        is_harmonious: true,
        comment: '检测到蓝色和白色，整体色调较为和谐',
        suggested_outfit_description: '建议搭配白色或浅蓝色单品'
      }
      
      res.json(defaultResult)
    }

  } catch (error) {
    console.error('色彩分析错误:', error)
    
    if (error.response) {
      res.status(500).json({ error: `API调用失败: ${error.response.status}` })
    } else if (error.code === 'ENOENT') {
      res.status(404).json({ error: '图片文件不存在' })
    } else {
      res.status(500).json({ error: '色彩分析服务暂时不可用' })
    }
  }
})

// 图像生成API
app.post('/api/generate-image', async (req, res) => {
  try {
    const { suggested_outfit_description, original_image_path } = req.body
    
    if (!suggested_outfit_description) {
      return res.status(400).json({ error: '缺少穿搭描述参数' })
    }

    // 从环境变量获取API配置
    const imageApiKey = process.env.IMAGE_GENERATION_API_KEY
    
    if (!imageApiKey) {
      return res.status(500).json({ error: '图像生成API密钥未配置' })
    }

    // 构建图像生成提示词
    const prompt = `根据描述生成穿搭模特图：${suggested_outfit_description}。要求：时尚穿搭，高清图片，专业摄影风格，人像展示服装搭配。`

    // 调用豆包图像生成API
    const response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
      model: 'doubao-seed-image-1-5',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid'
    }, {
      headers: {
        'Authorization': `Bearer ${imageApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    const result = response.data
    
    if (result.data && result.data.length > 0) {
      res.json({
        success: true,
        image_url: result.data[0].url
      })
    } else {
      throw new Error('图像生成失败，未返回图片URL')
    }

  } catch (error) {
    console.error('图像生成错误:', error)
    
    if (error.response) {
      res.status(500).json({ error: `图像生成API调用失败: ${error.response.status}` })
    } else {
      res.status(500).json({ error: '图像生成服务暂时不可用' })
    }
  }
})

export default app