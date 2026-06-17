# Claude Code 配置同步脚本
# 用法:
#   irm https://blog.srprolin.top/claude-config.ps1 | iex
#   # 或本地运行:
#   .\claude-config.ps1            # 默认保留现有密钥与请求地址
#   .\claude-config.ps1 -Force     # 按模板原文整体覆盖 (含密钥与请求地址)
#
# 默认行为: 保留用户已有的 ANTHROPIC_AUTH_TOKEN 与 ANTHROPIC_BASE_URL,
#           其余字段用下方模板覆盖。

param(
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Host ""
    Write-Host "Warning: Windows PowerShell 5 CANNOT display Chinese characters." -ForegroundColor Yellow
    Write-Host "  PowerShell 7 is recommended: https://apps.microsoft.com/detail/9mz1snwt0n5d?hl=zh-CN&gl=SG" -ForegroundColor Cyan
    Write-Host ""
}

$claudeDir    = "$env:USERPROFILE\.claude"
$settingsPath = "$claudeDir\settings.json"

# ─── 配置模板 (受保护字段除外，按此覆盖) ───
$template = [ordered]@{
    env = [ordered]@{
        ANTHROPIC_AUTH_TOKEN                      = "sk-4cf8aabe01a57a05b3ba279f55af9b4b"
        ANTHROPIC_BASE_URL                        = "https://code.srprolin.top"
        ANTHROPIC_MODEL                           = "glm-5.2[1m]"
        ANTHROPIC_DEFAULT_OPUS_MODEL              = "glm-5-turbo"
        ANTHROPIC_DEFAULT_SONNET_MODEL            = "mimo-v2.5-pro[1m]"
        ANTHROPIC_DEFAULT_HAIKU_MODEL             = "mimo-v2.5[1m]"
        CLAUDE_CODE_AUTO_COMPACT_WINDOW           = "1000000"
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC  = "1"
    }
    permissions = [ordered]@{
        allow = @()
        deny  = @()
    }
}

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

# ─── 应用受保护字段 (默认模式优先用现有值，否则留空待用户填写) ───
if (-not $Force) {
    $template.env.ANTHROPIC_AUTH_TOKEN = $existingToken
    $template.env.ANTHROPIC_BASE_URL   = $existingBaseUrl
}

# ─── 确保 .claude 目录存在 ───
if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Force -Path $claudeDir | Out-Null
    Write-Host "==> 已创建 .claude 配置目录" -ForegroundColor DarkGray
}

# ─── 写入 (UTF-8 无 BOM) ───
$json = $template | ConvertTo-Json -Depth 10
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($settingsPath, $json, $utf8NoBom)

# ─── 报告 ───
Write-Host "==> 配置已写入: $settingsPath" -ForegroundColor Green
if ($Force) {
    Write-Host "    ⚠ -Force: 全部字段已按模板原文覆盖 (含密钥与请求地址)" -ForegroundColor Yellow
}
elseif ($existingToken -or $existingBaseUrl) {
    Write-Host "    ✓ 已保留现有 ANTHROPIC_AUTH_TOKEN / ANTHROPIC_BASE_URL" -ForegroundColor DarkGray
}
else {
    Write-Host "    ⚠ 未检测到现有密钥，请手动填写 ANTHROPIC_AUTH_TOKEN 与 ANTHROPIC_BASE_URL" -ForegroundColor Yellow
    Write-Host "    是否用记事本打开 settings.json 进行编辑？ [Y/n]" -ForegroundColor White
    $open = Read-Host
    if ($open -ne "n" -and $open -ne "N") {
        Notepad.exe $settingsPath
    }
}
