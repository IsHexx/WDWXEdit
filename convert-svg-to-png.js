// 临时脚本：将SVG转换为PNG
const fs = require('fs');
const path = require('path');

// SVG内容
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 24 24" fill="none" stroke="#5B5B5B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 16s9-15 20-4C11 23 2 8 2 8"/>
</svg>`;

// 创建多个尺寸的SVG
const sizes = [
    { size: 100, name: 'fish-symbol-100.svg' },
    { size: 256, name: 'fish-symbol-256.svg' },
    { size: 512, name: 'fish-symbol-512.svg' }
];

const imagesDir = path.join(__dirname, 'images');

sizes.forEach(({ size, name }) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#5B5B5B" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 16s9-15 20-4C11 23 2 8 2 8"/>
</svg>`;

    fs.writeFileSync(path.join(imagesDir, name), svg);
    console.log(`✅ Created ${name}`);
});

console.log('\n📝 SVG文件已创建。');
console.log('请使用以下方法之一将SVG转换为PNG：');
console.log('\n方法1: 在线转换');
console.log('  - 访问 https://cloudconvert.com/svg-to-png');
console.log('  - 上传 images/fish-symbol-256.svg');
console.log('  - 下载转换后的PNG');
console.log('\n方法2: 使用Windows画图工具');
console.log('  - 用浏览器打开 fish-symbol-256.svg');
console.log('  - 截图或右键另存为图片');
console.log('\n方法3: 使用Obsidian');
console.log('  - 在Obsidian中嵌入SVG');
console.log('  - 截图保存为PNG');
