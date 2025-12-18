# Vercel部署指南

## 项目结构
```
color-waer-recognize/
├── frontend/          # React前端应用
│   ├── src/
│   ├── dist/          # 构建输出目录
│   ├── package.json
│   └── vite.config.js
├── api/              # Vercel Serverless Functions
│   ├── index.js      # 主API文件
│   ├── upload.js     # 文件上传API
│   ├── analyze.js    # 色彩分析API
│   └── generate-image.js # 图像生成API
├── backend/          # 原始后端代码（保留用于本地开发）
├── vercel.json       # Vercel配置文件
└── .env.vercel.example # 环境变量示例
```

## 部署步骤

### 1. 在Vercel上导入GitHub仓库
1. 访问 [Vercel控制台](https://vercel.com)
2. 点击 "New Project"
3. 选择 "Import Git Repository"
4. 找到并选择你的 `color-waer-recognize` 仓库
5. 点击 "Import"

### 2. 配置项目设置
在Vercel项目创建界面：
- **Project Name**: `color-waer-recognize` (或你喜欢的名称)
- **Framework Preset**: Other (因为我们有自定义的monorepo结构)
- **Root Directory**: 留空 (因为我们使用vercel.json配置)

### 3. 设置环境变量
在Vercel项目设置中，导航到 "Environment Variables" 部分，添加以下变量：

```
ARK_API_KEY=c7034bf1-10bc-4574-b0fe-1fd259d4dff0
DOUBAO_MODEL=doubao-seed-1-6-flash-250828
IMAGE_GENERATION_API_KEY=adb1b656-71e5-4a5b-a6a7-84550dc80fda
```

**重要**: 确保在所有环境(Production, Preview, Development)中都添加这些变量。

### 4. 部署
点击 "Deploy" 按钮开始部署。Vercel会自动：
- 检测到 `vercel.json` 配置文件
- 构建前端应用 (`frontend/dist`)
- 部署Serverless Functions (`api/*.js`)
- 配置路由规则

### 5. 验证部署
部署完成后：
1. 访问你获得的Vercel域名
2. 测试图片上传功能
3. 检查色彩分析是否正常工作
4. 验证图像生成功能

## 技术说明

### 前端适配
- 使用相对路径 (`base: './'`) 确保在Vercel上正确加载
- 动态API地址检测，本地开发使用 `localhost:3001`，生产环境使用相对路径
- 构建输出到 `frontend/dist` 目录

### 后端适配
- 将Express应用转换为Vercel Serverless Functions
- 使用 `/tmp` 目录进行文件上传（在serverless环境中是临时存储）
- 保持API接口不变，前端无需修改调用方式

### 路由配置
- `/api/*` 路由到Serverless Functions
- 其他路由重定向到前端单页应用
- 支持React Router的客户端路由

## 本地开发
如果你想在本地同时运行前后端：
```bash
# 终端1: 运行后端
cd backend
npm install
npm start

# 终端2: 运行前端
cd frontend
npm install
npm run dev
```

## 注意事项
1. **文件上传限制**: Vercel的文件上传是临时的，适合演示但不适合生产存储
2. **API密钥安全**: 敏感信息已配置为环境变量，不会暴露在代码中
3. **构建优化**: Vercel会自动缓存依赖，加速后续构建
4. **自动部署**: 每次推送到GitHub主分支会自动触发部署

## 故障排除
如果遇到问题：
1. 检查Vercel构建日志
2. 确认环境变量是否正确设置
3. 验证API函数的运行时环境
4. 检查前端构建是否成功

## 下一步
部署成功后，你可以：
1. 配置自定义域名
2. 启用HTTPS
3. 添加分析工具
4. 优化性能和用户体验