# Claude Code 配置同步脚本 (CC-SrP 中转站)
# 用法:
#   irm https://blog.srprolin.top/claude-config.ps1 | iex
#   # 或本地运行:
#   .\claude-config.ps1            # 先写入默认模板, 再询问是否自定义模型
#   .\claude-config.ps1 -Force     # 按模板原文整体覆盖 (含密钥与请求地址, 非交互)
#
# 设计: 除模型外的一切字段恒为默认模板 (并保留已有密钥与请求地址);
#       模型是唯一的可交互项。自定义时, 先把默认模板落盘,
#       再仅覆盖 4 个模型字段 (回车=保持该角色的默认模型)。

param(
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── 中转站标识 ───
$RelayName = "CC-SrP"

# ─── CC-SrP 中转站计费倍率 ───
$RelayMultiplier = "0.5x (半价)"   # 实际计费 = 官方定价 × 0.5

# ─── 官方定价参考链接 (自行补上各供应商官网定价页 URL, 留空则显示“待补充”) ────
$PricingLinks = @(
    [ordered]@{ Provider = "GLM (智谱)";   URL = "https://bigmodel.cn/pricing" },
    [ordered]@{ Provider = "DeepSeek (深度求索)";  URL = "https://api-docs.deepseek.com/zh-cn/quick_start/pricing/" }
)

# ─── 可选模型列表 (在此自行增删即可) ──────────────────────────────────────────
# Name: 菜单展示名 ; Id: 实际写入 settings.json 的模型标识 ; Cap: 能力 (纯文本 / 识图)
$Models = @(
    [ordered]@{ Name = "GLM-5.2 (1M)";       Id = "glm-5.2[1m]";       Cap = "纯文本" },
    [ordered]@{ Name = "GLM-5.2";            Id = "glm-5.2";           Cap = "纯文本" },
    [ordered]@{ Name = "GLM-5-Turbo";        Id = "glm-5-turbo";       Cap = "文本+识图MCP" }
)

# ─── 各角色默认模型 (使用上方 $Models 中的 Id) ─────────────────────────────────
# Main   -> ANTHROPIC_MODEL
# Opus   -> ANTHROPIC_DEFAULT_OPUS_MODEL
# Sonnet -> ANTHROPIC_DEFAULT_SONNET_MODEL
# Haiku  -> ANTHROPIC_DEFAULT_HAIKU_MODEL
$DefaultRoles = [ordered]@{
    Main   = "glm-5.2[1m]"
    Opus   = "glm-5.2"
    Sonnet = "glm-5-turbo"
    Haiku  = "glm-5-turbo"
}

# ─── 角色与 settings.json 字段的对应 ───
$RoleFields = [ordered]@{
    Main   = "ANTHROPIC_MODEL"
    Opus   = "ANTHROPIC_DEFAULT_OPUS_MODEL"
    Sonnet = "ANTHROPIC_DEFAULT_SONNET_MODEL"
    Haiku  = "ANTHROPIC_DEFAULT_HAIKU_MODEL"
}

# ─── 辅助函数 ───
function Get-ModelIndex([string]$id) {
    for ($i = 0; $i -lt $Models.Count; $i++) {
        if ($Models[$i].Id -eq $id) { return $i }
    }
    return -1
}

function Get-ModelName([string]$id) {
    foreach ($m in $Models) {
        if ($m.Id -eq $id) { return $m.Name }
    }
    return $id
}

function Get-ModelCap([string]$id) {
    foreach ($m in $Models) {
        if ($m.Id -eq $id) { return $m.Cap }
    }
    return ""
}

# 渲染单条模型行: 序号 / 名称 / 能力标签(着色) / Id, 可选 <默认> 标记
function Write-ModelLine([int]$idx, [object]$model, [switch]$IsDefault) {
    Write-Host ("  [{0}] {1,-18} " -f ($idx + 1), $model.Name) -NoNewline -ForegroundColor White
    if ($model.Cap -match "识图") {
        Write-Host ("[{0}] " -f $model.Cap) -NoNewline -ForegroundColor Green
    }
    else {
        Write-Host ("[{0}] " -f $model.Cap) -NoNewline -ForegroundColor Cyan
    }
    Write-Host ("({0})" -f $model.Id) -NoNewline -ForegroundColor Gray
    if ($IsDefault) {
        Write-Host "  <默认>" -ForegroundColor Yellow
    }
    else {
        Write-Host ""
    }
}

# 渲染角色摘要行: 角色 : 名称 [能力] (Id)
function Write-RoleSummary([string]$role, [string]$id) {
    $cap = Get-ModelCap $id
    Write-Host ("  {0,-9}: {1,-18} " -f $role, (Get-ModelName $id)) -NoNewline -ForegroundColor White
    if ($cap -match "识图") {
        Write-Host ("[{0}] " -f $cap) -NoNewline -ForegroundColor Green
    }
    else {
        Write-Host ("[{0}] " -f $cap) -NoNewline -ForegroundColor Cyan
    }
    Write-Host ("({0})" -f $id) -ForegroundColor Gray
}

# 渲染官方定价参考 + CC-SrP 中转倍率说明
function Write-PricingInfo {
    Write-Host ""
    Write-Host "官方定价参考 (官网原价, 供查询):" -ForegroundColor White
    for ($i = 0; $i -lt $PricingLinks.Count; $i++) {
        $p   = $PricingLinks[$i]
        $url = "$($p.URL)".Trim()
        if ([string]::IsNullOrEmpty($url)) {
            Write-Host ("  [{0}] {1,-14}: " -f ($i + 1), $p.Provider) -NoNewline -ForegroundColor DarkGray
            Write-Host "待补充" -ForegroundColor Yellow
        }
        else {
            Write-Host ("  [{0}] {1,-14}: " -f ($i + 1), $p.Provider) -NoNewline -ForegroundColor DarkGray
            Write-Host $url -ForegroundColor Cyan
        }
    }
    Write-Host ""
    Write-Host ("  $RelayName 中转站倍率: ") -NoNewline -ForegroundColor White
    Write-Host $RelayMultiplier -NoNewline -ForegroundColor Green
    Write-Host "  (实际计费 = 官方定价 × 0.5)" -ForegroundColor DarkGray
}

# ─── 横幅 ───
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  $RelayName 中转站 · Claude Code 配置工具" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Host ""
    Write-Host "Warning: Windows PowerShell 5 CANNOT display Chinese characters." -ForegroundColor Yellow
    Write-Host "  PowerShell 7 is recommended: https://apps.microsoft.com/detail/9mz1snwt0n5d?hl=zh-CN&gl=SG" -ForegroundColor Cyan
}

# ─── 官方定价参考 + CC-SrP 中转倍率 ───
Write-PricingInfo

# ─── 展示可用模型列表 ───
Write-Host ""
Write-Host "可用模型列表:" -ForegroundColor White
for ($i = 0; $i -lt $Models.Count; $i++) {
    Write-ModelLine $i $Models[$i]
}

# ─── 展示各角色默认模型 (= 即将写入的默认模板) ───
Write-Host ""
Write-Host "默认模板中的模型配置:" -ForegroundColor White
foreach ($role in @("Main", "Opus", "Sonnet", "Haiku")) {
    Write-RoleSummary $role $DefaultRoles[$role]
}

# ─── 路径 ───
$claudeDir    = "$env:USERPROFILE\.claude"
$settingsPath = "$claudeDir\settings.json"

# ─── 读取现有 settings.json 中的受保护字段 ───
$existingToken   = ""
$existingBaseUrl = ""
if (Test-Path $settingsPath) {
    try {
        $existing = Get-Content $settingsPath -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($existing.env -and $existing.env.ANTHROPIC_AUTH_TOKEN) {
            $existingToken = [string]$existing.env.ANTHROPIC_AUTH_TOKEN
        }
        if ($existing.env -and $existing.env.ANTHROPIC_BASE_URL) {
            $existingBaseUrl = [string]$existing.env.ANTHROPIC_BASE_URL
        }
    }
    catch {
        Write-Host "⚠ 现有 settings.json 解析失败，受保护字段将以模板默认值写入" -ForegroundColor Yellow
    }
}

# ─── 构建默认模板 (模型字段使用 $DefaultRoles) ───
$template = [ordered]@{
    env = [ordered]@{
        ANTHROPIC_AUTH_TOKEN                      = ""
        ANTHROPIC_BASE_URL                        = ""
        ANTHROPIC_MODEL                           = $DefaultRoles.Main
        ANTHROPIC_DEFAULT_OPUS_MODEL              = $DefaultRoles.Opus
        ANTHROPIC_DEFAULT_SONNET_MODEL            = $DefaultRoles.Sonnet
        ANTHROPIC_DEFAULT_HAIKU_MODEL             = $DefaultRoles.Haiku
        CLAUDE_CODE_AUTO_COMPACT_WINDOW           = "1000000"
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC  = "1"
    }
    permissions = [ordered]@{
        allow = @()
        deny  = @()
    }
}

# ─── 应用受保护字段 (默认模式优先用现有值, 否则留空待用户填写) ───
if (-not $Force) {
    $template.env.ANTHROPIC_AUTH_TOKEN = $existingToken
    $template.env.ANTHROPIC_BASE_URL   = $existingBaseUrl
}

# ─── 确保 .claude 目录存在 ───
if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Force -Path $claudeDir | Out-Null
    Write-Host "==> 已创建 .claude 配置目录" -ForegroundColor DarkGray
}

# ─── 写入函数 (UTF-8 无 BOM) ───
function Write-Settings([object]$tpl) {
    $json = $tpl | ConvertTo-Json -Depth 10
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($settingsPath, $json, $utf8NoBom)
}

# ─── 备份原 settings.json (若存在), 同名覆盖旧备份 ───
$backupPath = "$claudeDir\setting-save.json"
if (Test-Path $settingsPath) {
    Copy-Item -LiteralPath $settingsPath -Destination $backupPath -Force
    Write-Host ""
    Write-Host "==> 原配置已备份: $backupPath" -ForegroundColor Cyan
}

# ─── 第一步: 先用默认模板落盘 ───
Write-Settings $template
Write-Host ""
Write-Host "==> 默认模板已写入: $settingsPath" -ForegroundColor Green
if ($Force) {
    Write-Host "    ⚠ -Force: 全部字段已按模板原文覆盖 (含密钥与请求地址)" -ForegroundColor Yellow
}
elseif ($existingToken -or $existingBaseUrl) {
    Write-Host "    ✓ 已保留现有 ANTHROPIC_AUTH_TOKEN / ANTHROPIC_BASE_URL" -ForegroundColor DarkGray
}
else {
    Write-Host "    ⚠ 未检测到现有密钥 (稍后可手动填写 ANTHROPIC_AUTH_TOKEN / ANTHROPIC_BASE_URL)" -ForegroundColor Yellow
}

# ─── 第二步: 模型是唯一可交互项, 询问是否覆盖模型字段 ───
if (-not $Force) {
    Write-Host ""
    Write-Host "其余字段均已使用默认模板。是否自定义模型? [y/N]" -ForegroundColor Yellow
    $ans = Read-Host "您的选择"
    if ("$ans".Trim() -match '^[yY]') {
        Write-Host ""
        Write-Host "进入模型自定义 (回车=保持该角色默认模型):" -ForegroundColor Cyan

        $changed = $false
        foreach ($role in @("Main", "Opus", "Sonnet", "Haiku")) {
            $field  = $RoleFields[$role]
            $defId  = $DefaultRoles[$role]
            $defIdx = Get-ModelIndex $defId
            if ($defIdx -lt 0) { $defIdx = 0 }

            Write-Host ""
            Write-Host ("── {0} ({1}) ──" -f $role, $field) -ForegroundColor Cyan
            for ($i = 0; $i -lt $Models.Count; $i++) {
                Write-ModelLine $i $Models[$i] -IsDefault:($i -eq $defIdx)
            }

            $pick = Read-Host "输入序号 (回车=默认)"
            $pick = "$pick".Trim()
            $idx = $defIdx
            if ($pick -ne "") {
                $n = 0
                if ([int]::TryParse($pick, [ref]$n) -and $n -ge 1 -and $n -le $Models.Count) {
                    $idx = $n - 1
                }
                else {
                    Write-Host "  无效输入, 已回退到默认" -ForegroundColor Yellow
                }
            }
            $newId = $Models[$idx].Id
            $template.env.$field = $newId
            if ($newId -ne $defId) { $changed = $true }
        }

        # 仅覆盖模型字段后重新落盘 (其余字段保持上一步的默认模板)
        Write-Settings $template
        Write-Host ""
        if ($changed) {
            Write-Host "==> 已覆盖模型字段并重新写入: $settingsPath" -ForegroundColor Green
        }
        else {
            Write-Host "==> 所选模型与默认一致, 无需改动" -ForegroundColor DarkGray
        }
        Write-Host "当前模型配置:" -ForegroundColor White
        foreach ($role in @("Main", "Opus", "Sonnet", "Haiku")) {
            Write-RoleSummary $role $template.env.($RoleFields[$role])
        }
    }
}

# ─── 无密钥时提示用记事本编辑 ───
if (-not $Force -and -not $existingToken -and -not $existingBaseUrl) {
    Write-Host ""
    Write-Host "是否用记事本打开 settings.json 填写密钥? [Y/n]" -ForegroundColor White
    $open = Read-Host
    if ("$open".Trim() -notmatch '^[nN]') {
        Notepad.exe $settingsPath
    }
}

# ─── 输出全量配置内容，便于复查与复制 ───
Write-Host ""
Write-Host "========== settings.json 全量内容 ==========" -ForegroundColor Cyan
Write-Host "(路径: $settingsPath)" -ForegroundColor DarkGray
Write-Host "--------------------------------------------" -ForegroundColor DarkGray
$content = Get-Content $settingsPath -Raw -Encoding UTF8
Write-Output $content
Write-Host "--------------------------------------------" -ForegroundColor DarkGray
Write-Host "如需复制：右键标题栏 → 编辑 → 标记，框选上方 JSON 后回车复制。" -ForegroundColor DarkGray
Write-Host "============================================" -ForegroundColor Cyan
