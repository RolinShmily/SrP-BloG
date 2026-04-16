---
title: srp-scripts-2
published: 2026-04-16
pinned: false
description: 一个PyPI包，功能是将代码格式、高亮保留，并以RTL布局写入Word文档中，有效解决在Word报告中粘贴代码块不规范问题。
tags:
  - Word
  - PyPI
  - Python
draft: false
lang: ""
---
# 相关链接
- [Spire.Doc ── PyPI工具包](https://www.e-iceblue.com/Tutorials/Python/Spire.Doc-for-Python/Program-Guide/Spire.Doc-for-Python-Program-Guide-Content.html)

# 脚本说明

## 功能特性

- 扫描脚本所在目录下的代码文件（自动排除脚本自身，不会递归子目录）
- 自动识别文件语言并应用语法高亮
- 输出为 `.docx` Word 文档
- 统一使用 `Consolas` 等宽字体
- 默认字号约为 `10.5pt`
- 批量处理多个文件，逐个输出成功或失败结果

## 依赖要求

- Python 3.10+
- `pygments`
- `spire.doc`

安装命令：

```bash
pip install pygments spire.doc
```

## 当前支持的代码文件类型

脚本当前会处理以下扩展名：

- `.m`
- `.py`
- `.c`
- `.cpp`
- `.java`
- `.cs`
- `.js`
- `.ts`
- `.go`
- `.rs`

如果文件扩展名无法被 `Pygments` 正确识别，脚本会回退到 `MatlabLexer` 进行高亮处理。

## 使用方法

### 1. 准备代码文件

将需要转换的代码文件和 `gen_word.py` 放在同一个目录下。

例如：

```text
code-to-word/
├── gen_word.py
├── main.py
├── utils.cpp
└── test.m
```

### 2. 运行脚本

在 `code-to-word` 目录中执行：

```bash
python gen_word.py
```

### 3. 查看输出结果

脚本会在当前目录下生成同名的 `.docx` 文件。

例如：

```text
main.py    -> main.docx
utils.cpp  -> utils.docx
test.m     -> test.docx
```

# 脚本内容
```py
import os
from pygments import highlight
from pygments.lexers import MatlabLexer, get_lexer_for_filename
from pygments.formatters import RtfFormatter
from spire.doc import Document, FileFormat
CODE_DIR = os.path.dirname(os.path.abspath(__file__))
FONT_SIZE = r"\fs21"  # 10.5pt ≈ fs21
def code_to_rtf(code: str, lexer) -> str:
    formatter = RtfFormatter(fontface="Consolas")
    rtf_text = highlight(code, lexer, formatter)
    rtf_text = rtf_text.replace(r"\f0", r"\f0" + FONT_SIZE)
    return rtf_text
def process_file(filepath: str) -> None:
    basename = os.path.basename(filepath)
    filename_no_ext = os.path.splitext(basename)[0]
    output_path = os.path.join(CODE_DIR, filename_no_ext + ".docx")
    with open(filepath, "r", encoding="utf-8") as f:
        code = f.read()
    try:
        lexer = get_lexer_for_filename(basename)
    except Exception:
        lexer = MatlabLexer()
    rtf_text = code_to_rtf(code, lexer)
    doc = Document()
    section = doc.AddSection()
    para = section.AddParagraph()
    para.AppendRTF(rtf_text)
    doc.SaveToFile(output_path, FileFormat.Docx2016)
    doc.Close()
    print(f"[OK] {basename} -> {filename_no_ext}.docx")
def main():
    extensions = {".m", ".py", ".c", ".cpp", ".java", ".cs", ".js", ".ts", ".go", ".rs"}
    self_name = os.path.basename(os.path.abspath(__file__))
    files = [
        f for f in os.listdir(CODE_DIR)
        if os.path.isfile(os.path.join(CODE_DIR, f))
        and f != self_name
        and os.path.splitext(f)[1].lower() in extensions
    ]
    if not files:
        print("未找到代码文件")
        return
    print(f"找到 {len(files)} 个代码文件，开始转换...\n")
    for f in sorted(files):
        filepath = os.path.join(CODE_DIR, f)
        try:
            process_file(filepath)
        except Exception as e:
            print(f"[FAIL] {f}: {e}")
    print(f"\n完成！文件保存在: {CODE_DIR}")
if __name__ == "__main__":
    main()
```

# GitHub个人脚本仓库

::github{repo="RolinShmily/SrP-Scripts"}
