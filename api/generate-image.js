import express from 'express'
import axios from 'axios'

const router = express.Router()

router.post('/', async (req, res) => {
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

export default router