# Claude Code 国内镜像安装脚本
# 用法: irm https://blog.srprolin.top/install.ps1 | iex

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$ProgressPreference = 'SilentlyContinue'

$DOWNLOAD_URL = "https://drive.srprolin.top/claude-install-mirror/claude.exe"
$REFERER = "https://blog.srprolin.top"

if (-not [Environment]::Is64BitProcess) {
    Write-Error "Claude Code 不支持 32 位 Windows。"
    exit 1
}

$installDir = "$env:USERPROFILE\.local\bin"
$binaryPath = "$installDir\claude.exe"

# ─── 下载 ───
Write-Host "==> 正在下载 Claude Code v2.1.133 ..." -ForegroundColor Cyan
$tempPath = "$env:TEMP\claude-code-install.exe"

try {
    $webClient = New-Object System.Net.WebClient
    $webClient.Headers.Add("Referer", $REFERER)

    Register-ObjectEvent $webClient DownloadProgressChanged -Action {
        $pct = $EventArgs.ProgressPercentage
        $received = [math]::Round($EventArgs.BytesReceived / 1MB, 1)
        $total = [math]::Round($EventArgs.TotalBytesToReceive / 1MB, 1)
        Write-Host "`r    [$pct%] $received / $total MB" -NoNewline -ForegroundColor Yellow
    } | Out-Null

    $webClient.DownloadFile($DOWNLOAD_URL, $tempPath)
    Write-Host "`r    下载完成                                     " -ForegroundColor Green
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

if (Test-Path $binaryPath) {
    $running = Get-Process -Name "claude" -ErrorAction SilentlyContinue |
               Where-Object { $_.Path -eq $binaryPath }
    if ($running) {
        $staged = "$installDir\claude-new.exe"
        Copy-Item -Path $tempPath -Destination $staged -Force
        Remove-Item -Force $tempPath
        Write-Host ""
        Write-Host "✅ 下载完成! Claude Code 正在运行，请关闭后执行:" -ForegroundColor Green
        Write-Host "   Remove-Item '$binaryPath'" -ForegroundColor Yellow
        Write-Host "   Rename-Item '$staged' 'claude.exe'" -ForegroundColor Yellow
        exit 0
    }
    Remove-Item -Force $binaryPath
}

Copy-Item -Path $tempPath -Destination $binaryPath -Force
Remove-Item -Force $tempPath -ErrorAction SilentlyContinue

# ─── PATH (系统级) ───
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($machinePath -notlike "*$installDir*") {
    try {
        [Environment]::SetEnvironmentVariable("Path", "$machinePath;$installDir", "Machine")
        $env:Path = "$env:Path;$installDir"
        Write-Host "    系统 PATH 已更新 (新终端生效)" -ForegroundColor Yellow
    }
    catch {
        Write-Warning "设置系统 PATH 失败 (需要管理员权限)，回退为用户 PATH"
        $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($userPath -notlike "*$installDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
            $env:Path = "$env:Path;$installDir"
            Write-Host "    用户 PATH 已更新 (新终端生效)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "✅ 安装完成!" -ForegroundColor Green
Write-Host "   $(& $binaryPath --version 2>&1)" -ForegroundColor DarkGray
Write-Host "   $binaryPath" -ForegroundColor DarkGray
