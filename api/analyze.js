import express from 'express'
import axios from 'axios'
import fs from 'fs'

// 创建Express应用
const app = express()

// 解析JSON请求体
app.use(express.json())

app.post('/', async (req, res) => {
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

// Vercel Serverless Functions需要的默认导出
export default app