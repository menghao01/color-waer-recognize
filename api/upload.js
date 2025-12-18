import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import express from 'express'

// 创建Express应用
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

// 文件上传路由
app.post('/', upload.single('image'), (req, res) => {
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

// Vercel Serverless Functions需要的默认导出
export default app