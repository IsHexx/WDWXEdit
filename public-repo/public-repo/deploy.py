#!/usr/bin/env python3
"""
WDWxEdit v2 构建和部署脚本
自动构建插件并复制到 Obsidian 插件目录
"""

import os
import shutil
import subprocess
import sys
import time
from pathlib import Path

def run_command(command, cwd=None):
    """运行命令并处理输出"""
    print(f"运行命令: {command}")
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            check=True,
            capture_output=True,
            text=True,
            encoding='utf-8'
        )
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"命令执行失败: {e}")
        if e.stdout:
            print("标准输出:", e.stdout)
        if e.stderr:
            print("错误输出:", e.stderr)
        return False

def restart_obsidian():
    """重启 Obsidian 应用"""
    print("\n=== 重启 Obsidian 应用 ===")
    
    # Windows 平台重启 Obsidian
    if sys.platform == "win32":
        try:
            # 查找 Obsidian 进程并终止
            print("正在查找并关闭 Obsidian 进程...")
            subprocess.run("taskkill /F /IM obsidian.exe", shell=True, check=False)
            
            # 等待进程完全关闭
            time.sleep(2)
            
            # 启动 Obsidian
            obsidian_path = r"E:\Obsidian\obsidian.exe"
            if os.path.exists(obsidian_path):
                print("正在启动 Obsidian...")
                subprocess.Popen([obsidian_path])
                print("✓ Obsidian 重启成功")
            else:
                print("⚠ 未找到 Obsidian.exe，请手动启动 Obsidian")
                
        except Exception as e:
            print(f"⚠ 重启 Obsidian 失败: {e}")
            print("请手动重启 Obsidian")
    
    # macOS 平台
    elif sys.platform == "darwin":
        try:
            subprocess.run(["pkill", "-f", "Obsidian"], check=False)
            time.sleep(2)
            subprocess.Popen(["open", "-a", "Obsidian"])
            print("✓ Obsidian 重启成功")
        except Exception as e:
            print(f"⚠ 重启 Obsidian 失败: {e}")
            print("请手动重启 Obsidian")
    
    # Linux 平台
    else:
        try:
            subprocess.run(["pkill", "-f", "obsidian"], check=False)
            time.sleep(2)
            subprocess.Popen(["obsidian"])
            print("✓ Obsidian 重启成功")
        except Exception as e:
            print(f"⚠ 重启 Obsidian 失败: {e}")
            print("请手动重启 Obsidian")

def main():
    # 获取脚本所在目录（WDWxEdit v2目录）
    wdwxedit_v2_dir = Path(__file__).parent.resolve()
    print(f"WDWxEdit v2 目录: {wdwxedit_v2_dir}")
    
    # 插件构建输出目录
    plugin_dir = wdwxedit_v2_dir
    print(f"插件目录: {plugin_dir}")
    
    # 目标 Obsidian 插件目录
    obsidian_plugin_dir = Path(r"C:\Users\Administrator\Documents\Obsidian Vault\.obsidian\plugins\wdwxedit-v3")
    print(f"Obsidian 插件目录: {obsidian_plugin_dir}")
    
    # 检查目标目录是否存在，不存在则创建
    if not obsidian_plugin_dir.exists():
        print(f"目标目录不存在，正在创建: {obsidian_plugin_dir}")
        try:
            obsidian_plugin_dir.mkdir(parents=True, exist_ok=True)
            print(f"✓ 目标目录创建成功")
        except Exception as e:
            print(f"错误: 无法创建目标目录: {e}")
            sys.exit(1)
    
    # 1. 运行 pnpm build
    print("\n=== 开始构建 note-mp-wx 插件 ===")
    if not run_command("npm run build", cwd=wdwxedit_v2_dir):
        print("构建失败！")
        sys.exit(1)
    
    # 要复制的文件列表
    files_to_copy = [
        "main.js",
        "manifest.json",
        "styles.css"
    ]
    
    # 2. 复制文件
    print("\n=== 复制文件到 Obsidian 插件目录 ===")
    for file_name in files_to_copy:
        source_file = plugin_dir / file_name
        target_file = obsidian_plugin_dir / file_name
        
        if source_file.exists():
            print(f"复制 {file_name}...")
            shutil.copy2(source_file, target_file)
            print(f"✓ {file_name} 已复制")
        else:
            print(f"⚠ 警告: 源文件不存在: {source_file}")
    
    print("\n=== 部署完成！ ===")
    
    # 直接重启 Obsidian 应用
    restart_obsidian()

if __name__ == "__main__":
    main()