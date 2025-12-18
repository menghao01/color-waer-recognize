import { useState } from 'react'
import './App.css'

// 颜色转换函数：将中文颜色名称转换为十六进制颜色值
const colorNameToHex = (colorName) => {
  // 如果已经是十六进制颜色值，直接返回
  if (/^#[0-9A-Fa-f]{6}$/.test(colorName)) {
    return colorName
  }
  
  // 尝试提取可能的十六进制部分
  const hexMatch = colorName.match(/#[0-9A-Fa-f]{6}/i)
  if (hexMatch) {
    return hexMatch[0]
  }
  
  // 转换中文颜色名称
  const colorMap = {
    '红色': '#FF0000',
    '绿色': '#008000',
    '蓝色': '#0000FF',
    '黄色': '#FFFF00',
    '紫色': '#800080',
    '橙色': '#FFA500',
    '黑色': '#000000',
    '白色': '#FFFFFF',
    '灰色': '#808080',
    '粉色': '#FFC0CB',
    '棕色': '#A52A2A',
    '青色': '#00FFFF',
    '品红': '#FF00FF'
  }
  
  // 如果是数组，递归处理
  if (Array.isArray(colorName)) {
    return colorName.map(c => colorNameToHex(c))
  }
  
  // 转换并记录日志
  const result = colorMap[colorName] || '#CCCCCC' // 默认颜色为灰色
  console.log(`颜色转换: ${colorName} -> ${result}`)
  return result
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [compressedFile, setCompressedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [generatedImage, setGeneratedImage] = useState(null)
  const [currentStep, setCurrentStep] = useState('upload') // upload, analyze, result

  // 图片压缩函数
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target.result
        img.onload = () => {
          // 计算压缩后的尺寸，保证长边不超过2048px
          const maxSize = 2048
          let width = img.width
          let height = img.height
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
          
          // 创建canvas进行压缩
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)
          
          // 转换为Blob
          canvas.toBlob((blob) => {
            if (blob) {
              // 创建新的File对象
              const compressed = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressed)
            } else {
              resolve(file) // 压缩失败时返回原文件
            }
          }, file.type, 0.9) // 0.9是压缩质量
        }
      }
    })
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // 文件类型验证
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        alert('只支持JPEG、PNG和GIF格式的图片')
        return
      }
      
      // 文件大小验证（5MB）
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        alert('图片大小不能超过5MB')
        return
      }
      
      setSelectedFile(file)
      // 开始压缩
      try {
        const compressed = await compressImage(file)
        setCompressedFile(compressed)
        console.log('Original file size:', (file.size / 1024).toFixed(2), 'KB')
        console.log('Compressed file size:', (compressed.size / 1024).toFixed(2), 'KB')
      } catch (error) {
        console.error('图片压缩失败:', error)
        alert('图片压缩失败，请重试')
      }
    }
  }

  // 上传文件到后端
  const uploadFile = async (file) => {
    const formData = new FormData()
    formData.append('image', file)
    
    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))
        throw new Error(errorData.error || '文件上传失败')
      }
      
      return response.json()
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查服务器是否运行')
      }
      throw error
    }
  }

  // 分析图片
  const analyzeImage = async (filePath) => {
    try {
      console.log('调用分析API，文件路径:', filePath);
      const response = await fetch('http://localhost:3001/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filePath })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))
        throw new Error(errorData.error || '图片分析失败')
      }
      
      const result = await response.json()
      
      // 验证返回数据格式
      if (!result.dominant_colors || !result.is_harmonious === undefined || !result.comment) {
        throw new Error('分析结果格式异常')
      }
      
      return result
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查服务器是否运行')
      }
      throw error
    }
  }

  // 生成模特图
  const generateModelImage = async (description, originalImagePath) => {
    try {
      const response = await fetch('http://localhost:3001/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          suggested_outfit_description: description, 
          original_image_path: originalImagePath 
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '未知错误' }))
        throw new Error(errorData.error || '模特图生成失败')
      }
      
      const result = await response.json()
      
      // 验证返回数据格式
      if (!result.image_url) {
        throw new Error('生成结果格式异常')
      }
      
      return result
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('网络连接失败，请检查服务器是否运行')
      }
      throw error
    }
  }

  // 处理完整的分析流程
  const handleAnalysis = async () => {
    if (!compressedFile) return
    
    try {
      console.log('开始分析流程')
      setUploading(true)
      setCurrentStep('upload')
      
      // 1. 上传文件
      console.log('开始上传文件')
      const uploadResult = await uploadFile(compressedFile)
      console.log('上传结果:', uploadResult)
      
      // 2. 分析图片
      setUploading(false)
      setAnalyzing(true)
      setCurrentStep('analyze')
      console.log('开始分析图片')
      const analysis = await analyzeImage(uploadResult.file.path)
      console.log('Analysis Result:', JSON.stringify(analysis))
      console.log('Dominant Colors:', analysis.dominant_colors)
      console.log('Color Types:', analysis.dominant_colors.map(c => typeof c))
      
      // 转换颜色值为十六进制格式
      console.log('开始转换颜色值')
      const convertedColors = analysis.dominant_colors.map(color => {
        const converted = colorNameToHex(color)
        console.log(`转换颜色: ${color} -> ${converted}`)
        return converted
      })
      const convertedAnalysis = {
        ...analysis,
        dominant_colors: convertedColors
      }
      console.log('Converted Colors:', convertedAnalysis.dominant_colors)
      setAnalysisResult(convertedAnalysis)
      
      // 3. 生成模特图
      setAnalyzing(false)
      setGenerating(true)
      const imageResult = await generateModelImage(analysis.suggested_outfit_description, uploadResult.file.path)
      setGeneratedImage(imageResult.image_url)
      
      // 4. 完成
      setGenerating(false)
      setCurrentStep('result')
      
    } catch (error) {
      console.error('分析流程出错:', error)
      alert(`分析过程中出错: ${error.message}`)
      setUploading(false)
      setAnalyzing(false)
      setGenerating(false)
      setCurrentStep('upload')
    }
  }

  // 重新开始
  const handleReset = () => {
    setSelectedFile(null)
    setCompressedFile(null)
    setAnalysisResult(null)
    setGeneratedImage(null)
    setCurrentStep('upload')
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>穿搭色彩搭配分析</h1>
        {currentStep === 'upload' && (
          <p>上传包含两件衣物的照片，让AI为您分析搭配效果</p>
        )}
      </header>
      
      <main className="app-main">
        {/* 上传步骤 */}
        {currentStep === 'upload' && (
          <div className="upload-section">
            <div className="upload-area">
              {selectedFile ? (
                <div className="file-preview">
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Selected preview" 
                    className="preview-image"
                  />
                  <p>{selectedFile.name}</p>
                </div>
              ) : (
                <div className="upload-prompt">
                  <div className="upload-icon">📸</div>
                  <p>点击或拖拽图片到此处</p>
                </div>
              )}
              <input 
                type="file" 
                id="file-upload" 
                accept="image/*" 
                onChange={handleFileChange}
                className="file-input"
              />
              <label htmlFor="file-upload" className="upload-label">
                {selectedFile ? '更换图片' : '选择图片'}
              </label>
            </div>
            
            <button 
              className="upload-button" 
              onClick={handleAnalysis} 
              disabled={!selectedFile || uploading}
            >
              {uploading ? '上传中...' : '开始分析'}
            </button>
          </div>
        )}

        {/* 分析步骤 */}
        {currentStep === 'analyze' && analyzing && (
          <div className="loading-section">
            <div className="loading-spinner">🔄</div>
            <h2>正在分析您的穿搭...</h2>
            <p>AI正在识别颜色并分析搭配效果</p>
          </div>
        )}

        {/* 生成图片步骤 */}
        {currentStep === 'analyze' && generating && (
          <div className="loading-section">
            <div className="loading-spinner">🎨</div>
            <h2>正在为您生成试穿图...</h2>
            <p>请稍候，这可能需要几秒钟</p>
          </div>
        )}

        {/* 结果展示步骤 */}
        {currentStep === 'result' && analysisResult && (
          <div className="result-section">
            {/* 左侧内容：原图和评价 */}
            <div className="result-left">
              {/* 原图预览 */}
              <div className="original-image-section">
                <h3>您的原图</h3>
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt="Original outfit" 
                  className="original-image"
                />
              </div>

              {/* 评价区 */}
              <div className="evaluation-section">
                <h2 className="evaluation-title">
                  {analysisResult.is_harmonious ? '搭配效果很好！' : '搭配需要调整'}
                </h2>
                <p className="evaluation-comment">{analysisResult.comment}</p>
                
                {/* 色板展示 */}
                <div className="color-palette">
                  <div className="color-item">
                    <div 
                      className="color-swatch" 
                      style={{ backgroundColor: analysisResult.dominant_colors[0] }}
                    ></div>
                    <span className="color-value">{analysisResult.dominant_colors[0]}</span>
                  </div>
                  <div className="color-connector">
                    {analysisResult.is_harmonious ? '✅' : '❌'}
                  </div>
                  <div className="color-item">
                    <div 
                      className="color-swatch" 
                      style={{ backgroundColor: analysisResult.dominant_colors[1] }}
                    ></div>
                    <span className="color-value">{analysisResult.dominant_colors[1]}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧内容：试穿效果预览 */}
            <div className="result-right">
              {/* 建议区 */}
              <div className="suggestion-section">
                <h3>试穿效果预览</h3>
                <div className="model-image-container">
                  {generatedImage ? (
                    <img 
                      src={generatedImage} 
                      alt="Model wearing suggested outfit" 
                      className="model-image"
                    />
                  ) : (
                    <div className="image-placeholder">加载中...</div>
                  )}
                  <p className="model-image-note">AI生成效果仅供配色参考</p>
                </div>
                
                {!analysisResult.is_harmonious && (
                  <div className="suggestion-text">
                    <p>建议调整搭配：{analysisResult.suggestion_logic === 'suggest_new' ? '已为您生成优化后的搭配' : '保持原搭配'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 重新开始按钮 */}
            <div className="result-footer">
              <button className="reset-button" onClick={handleReset}>
                重新分析
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
