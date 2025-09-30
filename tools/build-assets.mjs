#!/usr/bin/env node

/*
 * Claude Code Update
 * Assets 构建脚本 - 将本地 assets 目录打包成 assets.zip
 * 支持跨平台 (Windows/Linux/macOS)
 */

import { existsSync, statSync } from 'fs';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const assetsDir = join(projectRoot, 'assets');
const outputPath = join(projectRoot, 'assets.zip');

async function readFileRecursive(dir, baseDir = '') {
    const files = [];
    const items = await readdir(dir);
    
    for (const item of items) {
        const fullPath = join(dir, item);
        const relativePath = join(baseDir, item);
        const stat = statSync(fullPath);
        
        if (stat.isDirectory()) {
            const subFiles = await readFileRecursive(fullPath, relativePath);
            files.push(...subFiles);
        } else {
            files.push({
                path: relativePath,
                fullPath: fullPath
            });
        }
    }
    
    return files;
}

async function buildAssets() {
    console.log('🔧 开始构建 assets.zip...');
    
    if (!existsSync(assetsDir)) {
        console.error('❌ assets 目录不存在:', assetsDir);
        process.exit(1);
    }
    
    try {
        console.log('📁 扫描 assets 目录...');
        const files = await readFileRecursive(assetsDir);
        console.log(`  发现 ${files.length} 个文件`);
        
        // 跨平台ZIP命令
        console.log('📦 创建 ZIP 文件...');
        
        return new Promise((resolve, reject) => {
            let zipProcess;
            const currentPlatform = platform();
            
            if (currentPlatform === 'win32') {
                // Windows: 使用PowerShell
                zipProcess = spawn('powershell', [
                    '-Command',
                    `Compress-Archive -Path "${assetsDir}/*" -DestinationPath "${outputPath}" -Force`
                ], {
                    cwd: projectRoot,
                    stdio: 'inherit'
                });
            } else {
                // Linux/macOS: 使用zip命令
                zipProcess = spawn('zip', [
                    '-r',
                    outputPath,
                    'assets/'
                ], {
                    cwd: projectRoot,
                    stdio: 'inherit'
                });
            }
            
            zipProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ assets.zip 构建完成!');
                    console.log(`📍 输出路径: ${outputPath}`);
                    
                    // 显示文件大小
                    if (existsSync(outputPath)) {
                        const stat = statSync(outputPath);
                        const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
                        console.log(`📊 文件大小: ${sizeMB} MB`);
                    }
                    
                    resolve();
                } else {
                    reject(new Error(`ZIP creation failed with code ${code}`));
                }
            });
            
            zipProcess.on('error', (error) => {
                console.error(`❌ ZIP command error:`, error);
                if (currentPlatform !== 'win32' && error.code === 'ENOENT') {
                    reject(new Error('zip command not found. Please install zip package.'));
                } else {
                    reject(error);
                }
            });
        });
        
    } catch (error) {
        console.error('❌ 构建失败:', error.message);
        process.exit(1);
    }
}

// 验证assets内容
function validateAssets() {
    console.log('🔍 验证 assets 内容...');
    
    const requiredFiles = [
        'themes.json',
        'highlights.json',
        'themes',
        'highlights'
    ];
    
    for (const file of requiredFiles) {
        const filePath = join(assetsDir, file);
        if (!existsSync(filePath)) {
            console.error(`❌ 缺少必需文件: ${file}`);
            return false;
        }
    }
    
    console.log('✅ assets 内容验证通过');
    return true;
}

// 主函数
async function main() {
    console.log('🚀 Assets 构建工具');
    console.log('====================');
    console.log(`🖥️  平台: ${platform()}`);
    
    if (!validateAssets()) {
        process.exit(1);
    }
    
    await buildAssets();
    
    console.log('\n🎉 构建完成!');
    console.log('💡 现在可以使用 assets.zip 进行发布');
}

// 运行脚本
main().catch(error => {
    console.error('❌ 构建过程出错:', error);
    process.exit(1);
});