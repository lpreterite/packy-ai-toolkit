# Troubleshooting

## rembg 未安装

```
zsh: command not found: rembg
ModuleNotFoundError: No module named 'rembg'
```

**修复**：
1. 安装：`pip install rembg[cpu,cli]`
2. 若 pip 报权限错误（如 `Operation not permitted: '~/.local/lib'`），用 `--target` 安装到可写目录：
   ```bash
   pip install --target /tmp/rembg_vendor rembg
   ```
   然后在调用时设置 `PYTHONPATH=/tmp/rembg_vendor`

## 模型下载失败 / 缓存目录不可写

```
PermissionError: [Errno 1] Operation not permitted: '/Users/xxx/.rembg'
```

**修复**：通过 `REMBG_HOME` 环境变量重定向模型缓存到可写目录：
```bash
mkdir -p /tmp/rembg_home
export REMBG_HOME=/tmp/rembg_home
```

## 模型下载速度慢 / 超时

默认 `bria-rmbg`（RMBG-2.0）模型约 1.02GB，网络差时可能超时。

**修复**：
1. 手动下载后放到缓存目录：
   ```bash
   mkdir -p ~/.rembg/models/bria-rmbg
   curl -L -o ~/.rembg/models/bria-rmbg/bria-rmbg.onnx \
     "https://github.com/danielgatis/rembg/releases/download/v0.0.0/bria-rmbg-2.0.onnx"
   ```
2. 或改用小模型（约 176MB）：`new_session("u2net")`

## 图片背景复杂（渐变/暗色背景与主体接近）

如：渐变背景、主体含暗色阴影、背景与主体颜色接近时，u2net 可能残留暗色像素。

**修复**：
1. 换用 RMBG-2.0：`new_session("bria-rmbg")`
2. 启用 alpha_matting：
   ```python
   remove(img, session=session, alpha_matting=True,
          alpha_matting_foreground_threshold=240,
          alpha_matting_background_threshold=10,
          alpha_matting_erode_size=4)
   ```
3. 仍不理想时调参：
   - `alpha_matting_background_threshold` 调低（如 5）= 更激进移除背景
   - `alpha_matting_foreground_threshold` 调高（如 250）= 保留更少半透明边缘

## 输出是 RGBA 但仍有暗色残留

**诊断**：统计非透明暗像素
```bash
python3 -c "
from PIL import Image
import numpy as np
arr = np.array(Image.open('输出.png'))
dark = (arr[:,:,0]<40)&(arr[:,:,1]<40)&(arr[:,:,2]<40)&(arr[:,:,3]>10)
print(f'暗色残留: {dark.sum()} 像素')
"
```

**注意**：如果暗色区域属于主体本身（如深灰色图标轮廓），这是正常设计，不是抠图失败。

## 模型被缓存但报下载错误

- 删除缓存重下：`rm -rf ~/.rembg/models/bria-rmbg`
- 确认文件完整性：`ls -l ~/.rembg/models/bria-rmbg/bria-rmbg.onnx`（应约 1.02GB）
