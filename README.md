# 🎄 李培润的交互式 3D 圣诞树

一个基于 React Three Fiber 的交互式 3D 圣诞树网页应用。

## ✨ 功能特性

### 核心功能
- **粒子圣诞树** - 由 3000+ 金色粒子组成的 3D 圣诞树
- **照片展示** - 粒子散开后在 3D 空间中展示个人照片
- **手势控制** - 通过摄像头识别手势
  - 👋 张开手掌 → 粒子散开
  - ✊ 握拳 → 粒子聚合成树
  - 🖐️ 左右移动 → 旋转圣诞树
- **多种交互方式**
  - 点击按钮切换状态
  - 手势控制
  - 鼠标拖拽/缩放

### 视觉效果
- 🌌 星空背景
- ✨ 辉光效果 (Bloom)
- 🎭 暗角效果 (Vignette)
- 💫 粒子动画

## 🚀 部署

### GitHub Pages 自动部署

项目已配置 GitHub Actions，推送到 main 分支后自动部署。

**访问地址：** https://czc000.github.io/lpr/

### 本地开发

```bash
# 安装依赖（可选，esbuild 会自动下载）
npm install -D esbuild

# 构建
./build.sh

# 本地预览
python3 -m http.server 8000
# 访问 http://localhost:8000
```

## 📁 项目结构

```
lpr/
├── index.html              # 主页面
├── index.tsx               # React 入口
├── App.tsx                 # 主应用组件
├── types.ts                # 类型定义
├── build.sh                # 构建脚本
├── components/
│   ├── Experience.tsx      # 3D 场景
│   ├── UI.tsx              # UI 界面
│   ├── HandController.tsx  # 手势控制
│   ├── MagicParticles.tsx  # 粒子系统
│   └── PhotoPlanes.tsx     # 照片展示
├── my_picture/             # 照片文件夹
└── .github/workflows/
    └── deploy.yml          # GitHub Actions
```

## 🎮 使用说明

1. **打开网页** - 访问部署地址
2. **允许摄像头** - 点击允许以使用手势控制
3. **交互方式**：
   - 点击底部按钮切换树/照片模式
   - 张开手掌 → 照片散开
   - 握拳 → 聚合成树
   - 张开手左右移动 → 旋转
   - 鼠标拖拽 → 旋转视角
   - 鼠标滚轮 → 缩放

## 📸 添加照片

将照片放入 `my_picture/` 文件夹，然后在 `App.tsx` 中更新 `photoPaths` 数组。

## 🛠️ 技术栈

- **React 19** - UI 框架
- **React Three Fiber** - React Three.js 渲染器
- **Three.js** - 3D 图形库
- **@react-three/drei** - R3F 工具库
- **@react-three/postprocessing** - 后期处理
- **MediaPipe** - 手势识别
- **esbuild** - 构建工具
- **Tailwind CSS** - 样式

## 📝 注意事项

- 需要现代浏览器支持（Chrome/Edge/Firefox 最新版）
- 手势控制需要摄像头权限
- 照片建议使用横向构图，大小适中

## 🎄 Made with ❤️ for Christmas
