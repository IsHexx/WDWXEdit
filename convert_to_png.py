#!/usr/bin/env python3
"""将fish-symbol SVG转换为PNG格式"""

import os
from pathlib import Path

# 检查是否安装了cairosvg
try:
    import cairosvg
    has_cairosvg = True
except ImportError:
    has_cairosvg = False
    print("⚠️  cairosvg未安装，尝试使用PIL...")

# 检查是否安装了PIL
try:
    from PIL import Image, ImageDraw
    has_pil = True
except ImportError:
    has_pil = False
    print("⚠️  PIL未安装")

def create_png_with_pil():
    """使用PIL创建简单的fish图标PNG"""
    # 创建256x256的图像
    size = 256
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 绘制简化的鱼形图标（曲线）
    # SVG path: M2 16s9-15 20-4C11 23 2 8 2 8
    # 简化为多边形
    scale = size / 24
    points = [
        (2*scale, 16*scale),
        (6*scale, 10*scale),
        (11*scale, 6*scale),
        (16*scale, 8*scale),
        (22*scale, 12*scale),
        (18*scale, 18*scale),
        (11*scale, 23*scale),
        (6*scale, 16*scale),
        (2*scale, 8*scale),
    ]

    # 绘制轮廓
    draw.line(points, fill=(91, 91, 91, 255), width=int(2*scale))

    # 保存
    output_path = Path(__file__).parent / 'images' / 'fish-symbol.png'
    img.save(output_path, 'PNG')
    print(f'✅ PNG已创建: {output_path}')
    return True

def convert_with_cairosvg():
    """使用cairosvg转换SVG到PNG"""
    svg_path = Path(__file__).parent / 'images' / 'fish-symbol-256.svg'
    png_path = Path(__file__).parent / 'images' / 'fish-symbol.png'

    cairosvg.svg2png(url=str(svg_path), write_to=str(png_path), output_width=256, output_height=256)
    print(f'✅ PNG已创建: {png_path}')
    return True

if __name__ == '__main__':
    success = False

    if has_cairosvg:
        try:
            success = convert_with_cairosvg()
        except Exception as e:
            print(f'❌ cairosvg转换失败: {e}')

    if not success and has_pil:
        try:
            success = create_png_with_pil()
        except Exception as e:
            print(f'❌ PIL创建失败: {e}')

    if not success:
        print('\n❌ 自动转换失败')
        print('\n请使用以下方法手动转换：')
        print('1. 在浏览器中打开 images/fish-symbol-256.svg')
        print('2. 截图或右键另存为图片')
        print('3. 保存为 images/fish-symbol.png')
        print('\n或者使用在线工具：')
        print('https://cloudconvert.com/svg-to-png')
