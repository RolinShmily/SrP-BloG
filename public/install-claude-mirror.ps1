# Claude Code 国内镜像安装脚本
# 用法: irm https://blog.srprolin.top/install.ps1 | iex

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'

$VERSION = "2.1.168"
$DOWNLOAD_URL = "https://download.srprolin.top/claude-install-mirror/claude.exe"
$REFERER = "https://blog.srprolin.top"

if (-not [Environment]::Is64BitProcess) {
    Write-Error "Claude Code does not support 32-bit Windows."
    exit 1
}

# ─── 检测 PowerShell 版本 ───
if ($PSVersionTable.PSVersion.Major -lt 7) {
    Write-Host ""
    Write-Host "Warning: Windows PowerShell 5 CANNOT display Chinese characters." -ForegroundColor Yellow
    Write-Host "  PowerShell 7 is recommended: https://apps.microsoft.com/detail/9mz1snwt0n5d?hl=zh-CN&gl=SG" -ForegroundColor Cyan
    Write-Host ""
}

$installDir = "$env:USERPROFILE\.local\bin"
$binaryPath = "$installDir\claude.exe"
$settingsPath = "$env:USERPROFILE\.claude\settings.json"

function Ensure-Settings {
    $claudeDir = "$env:USERPROFILE\.claude"
    if (-not (Test-Path $claudeDir)) {
        New-Item -ItemType Directory -Force -Path $claudeDir | Out-Null
        Write-Host "    已创建 .claude 配置目录" -ForegroundColor DarkGray
    }
    if (Test-Path $settingsPath) {
        Write-Host "    settings.json 已存在，跳过配置" -ForegroundColor DarkGray
    }
    else {
        $settingsContent = @'
{
  "env": {
    "ANTHROPIC_BASE_URL": "",
    "ANTHROPIC_AUTH_TOKEN": "",
    "ANTHROPIC_MODEL": "claude-opus-4-8",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-opus-4-8",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-sonnet-4-6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5",
    "CLAUDE_CODE_MODEL_CONTEXT_WINDOWS": "{\"claude-opus-4-8\":1000000,\"claude-sonnet-4-6\":1000000,\"claude-haiku-4-5\":200000,\"mimo-v2.5-pro\":1000000,\"mimo-v2.5\":1000000}",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
  },
  "permissions": {
    "allow": [],
    "deny": []
  }
}
'@
        Set-Content -Path $settingsPath -Value $settingsContent -Encoding UTF8
        Write-Host "    已生成默认 settings.json" -ForegroundColor DarkGray
        Write-Host "    ⚠ 填入 API Key 和请求地址后即可使用，脚本末尾可打开编辑。" -ForegroundColor Yellow
    }
}
function Prompt-OpenSettings {
    if (-not (Test-Path $settingsPath)) { return }
    Write-Host ""
    $open = Read-Host "    是否用记事本打开 settings.json 进行编辑？ [Y/n]"
    if ($open -ne "n" -and $open -ne "N") {
        Notepad.exe $settingsPath
    }
}

# ─── 检测已安装 ───
$existingClaude = Get-Command claude -ErrorAction SilentlyContinue
if ($existingClaude) {
    $installedVersion = & $existingClaude.Source --version 2>&1
    Write-Host ""
    Write-Host "⚠ Claude Code 已安装" -ForegroundColor Yellow
    Write-Host "   当前版本: $installedVersion" -ForegroundColor DarkGray
    Write-Host "   最新镜像版本: $VERSION" -ForegroundColor Cyan
    Write-Host "   路径: $($existingClaude.Source)" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    [1] 升级 (卸载后重新安装)" -ForegroundColor White
    Write-Host "    [2] 卸载" -ForegroundColor White
    Write-Host "    [3] 编辑配置文件" -ForegroundColor White
    Write-Host ""
    $action = Read-Host "    请选择操作 [1/2/3] (默认 1)"
    if ($action -eq "3") {
        Prompt-OpenSettings
        exit 0
    }

    # 卸载：同时处理 npm 安装和原生安装
    $uninstalled = $false

    # npm 安装方式
    $npmExe = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmExe) {
        $npmList = & npm list -g @anthropic-ai/claude-code 2>&1
        if ($npmList -match "@anthropic-ai/claude-code") {
            Write-Host "==> 检测到 npm 安装，正在卸载 ..." -ForegroundColor Cyan
            & npm uninstall -g @anthropic-ai/claude-code
            $uninstalled = $true
        }
    }

    # 原生安装方式
    if (Test-Path $binaryPath) {
        Write-Host "==> 检测到原生安装，正在删除 ..." -ForegroundColor Cyan
        Remove-Item -Force $binaryPath
        $uninstalled = $true
    }

    if ($uninstalled) {
        Write-Host "    已卸载 ✓" -ForegroundColor Green
    }
    else {
        Write-Host "    未检测到安装文件，跳过卸载" -ForegroundColor DarkGray
    }

    if ($action -eq "2") { exit 0 }
    Write-Host ""
}

# ─── 检测 Node.js ───
$nodeExe = Get-Command node -ErrorAction SilentlyContinue
if ($nodeExe) {
    $nodeVersion = & $nodeExe.Source --version 2>&1
    Write-Host "    Node.js $nodeVersion 已就绪" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "    检测到 Node.js，可通过 npm 安装官方原版 Claude Code。" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    [1] npm 安装 (官方原版)" -ForegroundColor White
    Write-Host "    [2] 原生安装 (镜像)" -ForegroundColor White
    Write-Host ""
    $choice = Read-Host "    请选择安装方式 [1/2] (默认 1)"
    if ($choice -ne "2") {
        Write-Host ""
        Write-Host "==> 正在通过 npm 安装 Claude Code ..." -ForegroundColor Cyan
        try {
            & npm install -g @anthropic-ai/claude-code
            $npmClaude = Get-Command claude -ErrorAction SilentlyContinue
            if ($npmClaude) {
                Write-Host ""
                Write-Host "✅ 安装完成!" -ForegroundColor Green
                Write-Host "   $(& $npmClaude.Source --version 2>&1)" -ForegroundColor DarkGray
            }
        }
        catch {
            Write-Error "npm 安装失败: $_"
            exit 1
        }
        Ensure-Settings
        Prompt-OpenSettings
        exit 0
    }
}

# ─── 下载 ───
Write-Host "==> 正在下载 Claude Code v$VERSION ..." -ForegroundColor Cyan
$tempPath = "$env:TEMP\claude-code-install.exe"

try {
    $webClient = New-Object System.Net.WebClient
    $webClient.Headers.Add("Referer", $REFERER)

    # Get total size via HEAD request
    $totalBytes = 0
    $totalMB = "?"
    try {
        $headRequest = [System.Net.WebRequest]::Create($DOWNLOAD_URL)
        $headRequest.Method = "HEAD"
        $headRequest.Headers.Add("Referer", $REFERER)
        $headResponse = $headRequest.GetResponse()
        $totalBytes = $headResponse.ContentLength
        $headResponse.Close()
        if ($totalBytes -gt 0) { $totalMB = [math]::Round($totalBytes / 1MB, 1) }
    }
    catch { }

    # Download asynchronously without event handlers (avoids runspace threading issues)
    $webClient.DownloadFileAsync($DOWNLOAD_URL, $tempPath)

    $barLen = 30
    while ($webClient.IsBusy) {
        Start-Sleep -Milliseconds 300
        if (-not (Test-Path $tempPath)) { continue }
        $currentSize = (Get-Item $tempPath).Length
        $received = [math]::Round($currentSize / 1MB, 1)
        if ($totalBytes -gt 0) {
            $pct = [math]::Floor($currentSize / $totalBytes * 100)
            $filled = [math]::Floor($barLen * $pct / 100)
            $empty = $barLen - $filled
            $bar = ("█" * $filled) + ("░" * $empty)
            Write-Host "`r    [$bar] $pct%  $received/$totalMB MB" -NoNewline -ForegroundColor Yellow
        }
        else {
            Write-Host "`r    下载中 ... $received MB" -NoNewline -ForegroundColor Yellow
        }
    }

    Write-Host ""
    if (-not (Test-Path $tempPath)) { throw "下载完成但文件不存在" }
    Write-Host "    下载完成 ✓" -ForegroundColor Green
}
catch {
    Write-Error "下载失败: $_"
    if (Test-Path $tempPath) { Remove-Item -Force $tempPath }
    exit 1
}

# ─── 校验大小 ───
$size = (Get-Item $tempPath).Length
if ($size -lt 100MB) {
    Write-Error "文件异常 ($([math]::Round($size/1MB,1)) MB)，可能下载不完整或被拦截。"
    Remove-Item -Force $tempPath
    exit 1
}

# ─── 部署 ───
Write-Host "==> 正在部署到 $installDir ..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $installDir | Out-Null
if (Test-Path $binaryPath) { Remove-Item -Force $binaryPath }
Copy-Item -Path $tempPath -Destination $binaryPath -Force
Remove-Item -Force $tempPath -ErrorAction SilentlyContinue

# ─── PATH ───
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$inMachine = $machinePath -like "*$installDir*"
$inUser = $userPath -like "*$installDir*"

if ($inMachine -or $inUser) {
    Write-Host "    PATH 已配置" -ForegroundColor DarkGray
}
else {
    $pathSet = $false
    try {
        [Environment]::SetEnvironmentVariable("Path", "$machinePath;$installDir", "Machine")
        Write-Host "    系统 PATH 已更新 (新终端生效)" -ForegroundColor DarkGray
        $pathSet = $true
    }
    catch {
        try {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
            Write-Host "    用户 PATH 已更新 (新终端生效)" -ForegroundColor DarkGray
            $pathSet = $true
        }
        catch { }
    }
    if ($pathSet) {
        $env:Path = "$env:Path;$installDir"
    }
    else {
        Write-Host "    ⚠ 自动设置 PATH 失败，请手动将以下路径添加到系统 PATH:" -ForegroundColor Yellow
        Write-Host "      $installDir" -ForegroundColor White
    }
}

Ensure-Settings

Write-Host ""
Write-Host "✅ 安装完成!" -ForegroundColor Green
Write-Host "   $(& $binaryPath --version 2>&1)" -ForegroundColor DarkGray
Write-Host "   $binaryPath" -ForegroundColor DarkGray

Prompt-OpenSettings
