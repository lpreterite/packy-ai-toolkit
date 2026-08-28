name: wx-newspic-publish
description: "小绿书短文发布阶段：预检 → dry-run → 审批 → 发布"
args:
  topic:
    description: "短文标题"
    required: true
  md_path:
    description: "短文 MD 文件绝对路径"
    required: true
  asset_dir:
    description: "配图 assets 目录绝对路径"
    required: true

steps:
  # Step 1: 文件完整性预检 + 正文字数检查
  - id: preflight
    run: |
      test -f "${md_path}" || { echo '{"ok":false,"error":"MD文件不存在"}'; exit 1; }

      img_count=$(ls "${asset_dir}"/slide-*.png 2>/dev/null | wc -l | tr -d ' ')
      test "$img_count" -ge 1 || { echo '{"ok":false,"error":"无配图文件"}'; exit 1; }

      body=$(awk '/^## 正文/{flag=1; next} /^## / && flag{flag=0} flag' "${md_path}")
      test -n "$body" || { echo '{"ok":false,"error":"正文内容为空（未找到 ## 正文 章节）"}'; exit 1; }

      chars=$(printf '%s' "$body" | wc -m | tr -d ' ')
      test "$chars" -ge 10 || { echo '{"ok":false,"chars":'${chars}',"error":"正文过短"}'; exit 1; }

      if [ "$chars" -gt 1105 ]; then
        echo "{\"ok\":false,\"chars\":${chars},\"error\":\"正文超限: ${chars} > 1105\"}"
        exit 1
      fi

      echo "{\"ok\":true,\"images\":${img_count},\"chars\":${chars}}"

  # Step 2: 图片 MD5 去重
  - id: md5_dedup
    run: |
      cd "${asset_dir}"
      md5sums=$(md5 -r slide-*.png)
      dup_hash=$(echo "$md5sums" | awk '{print $1}' | sort | uniq -d)
      if [ -n "$dup_hash" ]; then
        dup_files=$(echo "$md5sums" | awk -v h="$dup_hash" '$1==h{printf "%s ", $2}')
        echo "{\"ok\":false,\"error\":\"MD5重复\",\"files\":\"${dup_files}\"}"
        exit 1
      fi
      echo '{"ok":true}'

  # Step 3: dry-run 验证
  - id: dry_run
    run: |
      wx-newspic publish --type newspic --dry-run \
        --title "${topic}" \
        --content "$(awk '/^## 正文/{flag=1; next} /^## / && flag{flag=0} flag' "${md_path}")" \
        --author "叶帕奇" \
        --images "${asset_dir}/slide-*.png"
    approval:
      prompt: "dry-run 通过？请确认：字数合规、图片齐全、内容格式正确？"

  # Step 4: 发布到草稿箱
  - id: publish
    run: |
      wx-newspic publish --type newspic \
        --title "${topic}" \
        --content "$(awk '/^## 正文/{flag=1; next} /^## / && flag{flag=0} flag' "${md_path}")" \
        --author "叶帕奇" \
        --images "${asset_dir}/slide-*.png"
    retry: 3
    timeout_ms: 60000
    when: $dry_run.approved

  # Step 5: 完成
  - id: done
    run: |
      echo "{\"topic\":\"${topic}\",\"status\":\"published\"}"
    when: $publish.completed
