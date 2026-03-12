#!/bin/bash
# 构建脚本

set -e

cd "$(dirname "$0")"

echo "当前目录：$(pwd)"
echo "正在检查文件..."
ls -la index.tsx || (echo "错误：找不到 index.tsx" && exit 1)

mkdir -p dist

echo "正在编译 TypeScript..."

npx --yes esbuild index.tsx \
  --bundle \
  --format=esm \
  --outfile=dist/index.js \
  --jsx=automatic \
  --target=es2022 \
  --external:react \
  --external:react-dom \
  --external:react/jsx-runtime \
  --external:three \
  --external:@react-three/fiber \
  --external:@react-three/drei \
  --external:@react-three/postprocessing \
  --external:@mediapipe/tasks-vision \
  --minify

if [ $? -eq 0 ]; then
    echo "✅ 编译成功！"
    ls -lh dist/index.js
    
    if [ -d "my_picture" ]; then
        echo "正在复制 my_picture 文件夹..."
        cp -r my_picture dist/
        echo "✅ 完成"
    fi
    
    echo "构建完成！"
else
    echo "❌ 编译失败"
    exit 1
fi
