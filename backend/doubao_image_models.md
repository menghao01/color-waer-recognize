# 豆包生图模型推荐信息

## 当前模型状态
当前使用的豆包模型：`doubao-seed-1-6-flash-250828`
- **生图支持**：不支持直接生成图片
- **功能定位**：主要专注于文本信息处理

## 推荐的豆包生图模型

### 1. 豆包视觉生成模型 (doubao-vision-pro)
- **功能**：支持文本生成图片、图片编辑、图片分析
- **特点**：高质量生成，适合时尚、产品、人物等多种场景
- **推荐指数**：⭐⭐⭐⭐⭐

### 2. 豆包图像专业版 (doubao-image-pro)
- **功能**：专注于图像生成和编辑
- **特点**：生成速度较快，质量稳定
- **推荐指数**：⭐⭐⭐⭐

### 3. 豆包图像轻量版 (doubao-image-lite)
- **功能**：基础图像生成功能
- **特点**：生成速度快，适合简单场景
- **推荐指数**：⭐⭐⭐

## 接入建议
1. **API端点**：通常需要使用专门的图像生成API端点，而不是通用的chat/completions端点
2. **请求格式**：需要调整请求参数，通常包含prompt、size、style等参数
3. **成本考虑**：不同模型的调用成本不同，建议根据需求选择合适的模型
4. **测试**：在正式使用前，建议先进行小批量测试

## 示例生图API调用格式
```javascript
const response = await axios.post('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
  model: 'doubao-vision-pro',
  prompt: 'A fashion model wearing a red dress',
  n: 1,
  size: '1024x1024'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  }
});
```
