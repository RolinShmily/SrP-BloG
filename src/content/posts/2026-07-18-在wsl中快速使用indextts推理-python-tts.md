---
title: 在WSL中快速使用IndexTTS推理 | Python | TTS
published: 2026-07-18
pinned: false
description: 这是一篇IndexTTS的快速上手教程，以Windows平台的WSL子系统上，拉取源代码，下载模型，通过uv运行推理脚本。
tags:
  - Python
  - TTS
  - WSL
draft: false
lang: ""
---
# 相关链接
- [Bilibili IndexTTS 项目地址](https://github.com/index-tts/index-tts)

<div style="width: 100%; aspect-ratio: 16/9;">
<iframe src="//player.bilibili.com/player.html?isOutside=true&aid=115167165677807&bvid=BV136a9zqEk5&cid=32241026475&p=1" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true"></iframe>
</div>

# 前置环境
推荐使用WSL配合NVIDIA显卡。
```bash
# 更新系统软件源
sudo apt update && sudo apt upgrade -y
# 安装基础依赖库
sudo apt install python3 git git-lfs curl wget build-essential ffmpeg -y
# 启用lfs
git lfs install

# 安装Python管理器uv
# curl方式
curl -LsSf https://astral.sh/uv/install.sh | sh
# pip方式
pip install -U uv

# 刷新环境变量
source $HOME/.local/bin/env
# 拉取源代码
git clone https://github.com/index-tts/index-tts.git
git lfs pull  # 下载大文件
# 进入目录，创建必要的文件夹
cd index-tts
mkdir -p checkpoints inputs outputs
```

# 模型下载
现在需要去[魔搭社区](https://modelscope.cn/models/IndexTeam/IndexTTS-2)或者[HuggingFace](https://huggingface.co/IndexTeam/IndexTTS-2)中下载模型权重和配置文件，也即 `config.yaml` 和`.pth / .pt`到目录`checkpoints`中：
```bash
# huggingface
# 设置镜像地址环境变量
export HF_ENDPOINT=https://hf-mirror.com
# 使用uv安装huggingface-cli下载模型到checkpoints目录
uv tool install "huggingface-hub[cli,hf_xet]"
hf download IndexTeam/IndexTTS-2 --local-dir=checkpoints

# ModelScope
uv tool install "modelscope"
modelscope download --model IndexTeam/IndexTTS-2 --local_dir checkpoints
```

# 安装依赖
```bash
# 安装全部依赖(`--all-extras`)(按需配置国内镜像源)
uv sync --all-extras --default-index "https://mirrors.aliyun.com/pypi/simple"
```

# 推理脚本
```bash
# 创建轮推脚本
nano batch_tts.py
```
脚本内容如下：
```py
import os
from indextts.infer_v2 import IndexTTS2
import torch
import gc

# ==========================================
# 1. 配置区域 (Configuration Area)
# ==========================================

# 输入的txt文本文件路径 (每行一句需要生成的文本)
INPUT_TXT = "inputs/text.txt"

# 输出的文件夹路径
OUTPUT_DIR = "outputs"

# 输出文件名称序列的前缀 (如 "audio_" 会生成 "audio_1.wav", "audio_2.wav"等)
OUTPUT_PREFIX = "audio_"

# 参考音频路径 (Voice Cloning Prompt)
REF_AUDIO = "inputs/furina.wav"

# ==========================================
# 2. 核心逻辑 (Core Logic)
# ==========================================

def main():
    # 检查输入文本是否存在
    if not os.path.exists(INPUT_TXT):
        print(f"错误: 找不到输入文件 '{INPUT_TXT}'。请先创建该文本文件。")
        return

    # 创建输出文件夹 (如果不存在)
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
        print(f"已创建输出文件夹: {OUTPUT_DIR}")

    # 初始化 IndexTTS2 模型
    print("正在加载 IndexTTS2 模型...")
    # 注意: 可根据需要将 use_fp16 设置为 True 以节省显存并加快推理
    tts = IndexTTS2(
        cfg_path="checkpoints/config.yaml", 
        model_dir="checkpoints", 
        use_fp16=True, 
        use_cuda_kernel=False,
        use_accel=False,        # 不想折腾编译的话，全部关掉即可
        use_deepspeed=False
    )
    print("模型加载完成！")

    # 读取 txt 文本
    with open(INPUT_TXT, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # 逐行生成 TTS 音频
    count = 1
    for line in lines:
        text = line.strip()
        
        # 跳过空行
        if not text:
            continue
            
        output_filename = f"{OUTPUT_PREFIX}{count}.wav"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # 断点续传检查：如果目标音频文件已存在，则跳过
        if os.path.exists(output_path):
            print(f"[{count}/{len(lines)}] 音频已存在，跳过生成: {output_filename}")
            count += 1
            continue
        
        print(f"[{count}/{len(lines)}] 正在生成: {output_filename}")
        print(f"文本内容: {text}")
        
        # 调用推理接口生成音频
        tts.infer(
            spk_audio_prompt=REF_AUDIO, 
            text=text, 
            output_path=output_path, 
            verbose=False
        )
        
        print(f"生成成功 -> {output_path}\n")
        
        # 显存优化：每一句生成完后清理显存碎片，防止跑久了OOM爆显存
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            
        count += 1

    print("所有任务处理完毕！")

if __name__ == "__main__":
    main()
```

在配置区域中`inputs/furina.wav`为参考音频，`inputs/text.txt`为推理文本，脚本将逐行逐步推理，文本格式如下：
```txt
你好，这里是RoL1n~
Hello,world!
```

在确保`text.txt`和`furina.wav`参考音频都配置好之后，输入运行命令即可：
```bash
uv run batch_tts.py
```
