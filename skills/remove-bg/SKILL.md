---
name: remove-bg
description: 移除图片背景，输出透明 PNG。触发：用户要求去除/移除背景、抠图、背景透明化、处理图片背景（remove background / remove bg / background removal / 去背景 / 抠图 / 透明背景）时加载。
---

# Remove-bg Skill

移除图片背景，输出透明 PNG。使用开源 [rembg](https://github.com/danielgatis/rembg) 库离线完成，不依赖任何外部 API。

## 前置确认（必须先检查）

- `pip show rembg` 或 `which rembg` — rembg 必须已安装
  - 安装：`pip install rembg[cpu,cli]`
  - 若 pip 安装失败（沙箱权限问题），用 `--target` 指定可写目录：`pip install --target /tmp/rembg_vendor rembg`
- 模型缓存：首次运行会自动下载约 1GB 的 RMBG-2.0 模型（`bria-rmbg-2.0.onnx`）
  - 缓存路径：`~/.rembg/models/bria-rmbg/`（可通过 `REMBG_HOME` 环境变量修改）
  - 如果网络受限，可改用 `u2net` 模型（约 176MB，精度略低但速度快）

## 使用流程

### 方式一：Python API（推荐，可控性高）

```python
from rembg import remove, new_session
from PIL import Image

session = new_session("bria-rmbg")  # RMBG-2.0 模型，精度最高
img = Image.open("输入图片路径")
output = remove(img, session=session, alpha_matting=True,
                alpha_matting_foreground_threshold=240,
                alpha_matting_background_threshold=10,
                alpha_matting_erode_size=4)
output.save("输出路径.png")
```

### 方式二：命令行（简单场景）

```bash
# 单张图片
rembg i 输入图片.jpg 输出路径.png

# 指定模型（默认 bria-rmbg，可用 u2net 代替）
rembg i -m bria-rmbg 输入图片.jpg 输出路径.png

# 批量处理整个文件夹
rembg p 输入文件夹/ 输出文件夹/
```

### 方式三：高级参数（复杂背景/边缘优化）

当图片背景复杂（如渐变背景、暗色背景与主体颜色接近）时，建议启用 alpha_matting：

```python
from rembg import remove, new_session
from PIL import Image

session = new_session("bria-rmbg")
img = Image.open("输入图片路径")

output = remove(
    img,
    session=session,
    alpha_matting=True,
    alpha_matting_foreground_threshold=240,  # 降低此值会保留更多前景
    alpha_matting_background_threshold=10,   # 提高此值会移除更多背景
    alpha_matting_erode_size=4,              # 边缘腐蚀强度
)
output.save("输出路径.png")
```

## 验证输出

1. 文件存在且非空：`ls -l 输出路径`
2. 确认是 RGBA 模式（带透明通道）：`python3 -c "from PIL import Image; print(Image.open('输出路径').mode)"` 应返回 `RGBA`
3. 检查 alpha 通道：`python3 -c "from PIL import Image; import numpy as np; a = np.array(Image.open('输出路径'))[:,:,3]; print(f'透明: {(a<10).sum()}, 不透明: {(a>250).sum()}')`

## 模型选择指南

| 模型 | 大小 | 精度 | 速度 | 适用场景 |
|------|------|------|------|---------|
| **bria-rmbg** (RMBG-2.0) | 1.02GB | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 通用，精度最高，推荐默认 |
| u2net | 176MB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 日常使用，速度快 |
| isnet-general-use | 179MB | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 通用物体，边缘好 |
| isnet-anime | 176MB | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 动漫/插画风格 |

## 失败回退

1. 检查 rembg 是否安装
2. 检查模型缓存是否完整（`~/.rembg/models/bria-rmbg/bria-rmbg.onnx`）
3. 尝试换用 u2net 模型：`new_session("u2net")`
4. 如果仍有问题，看 [references/troubleshooting.md](references/troubleshooting.md)

## 边界与限制

- 仅处理单张图片（命令行支持批量：`rembg p`）
- 图片无尺寸限制，但超大图片建议先缩放到 2048px 以内以提升速度
- 完全离线运行，无需网络
- 首张图片处理因模型下载会稍慢，后续使用缓存立刻执行
- 如果原图已有 alpha 通道但不透明（RGBA 但 alpha=255），rembg 会重新计算
