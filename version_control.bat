@echo off
setlocal

:: 获取当前日期
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (
  set mydate=%%c-%%a-%%b
)

:get_version
set /p VERSION="输入版本号 (例如 1.1.0): "
echo %VERSION% | findstr "^[0-9]\+\.[0-9]\+\.[0-9]\+$" >nul
if errorlevel 1 (
  echo 错误：版本号格式不正确，请重新输入。
  goto get_version
)

set /p DESC="输入更新描述: "

:: 检查版本目录是否已存在
if exist "src\versions\v%VERSION%" (
  echo 错误：版本目录已存在，请选择不同的版本号。
  goto get_version
)

:: --- Git 操作 (开始) ---
:: 切换到开发目录 (这一行可能不需要，因为脚本应该已经在 Undo-List-project 目录下了)
cd /d "%~dp0"

:: 检查 Git 是否已安装
git --version >nul 2>&1
if errorlevel 1 (
  echo 错误：未检测到 Git。请先安装 Git 并将其添加到 PATH 环境变量。
  pause
  exit /b 1
)

:: 添加所有更改到暂存区
git add .

:: 提交更改 (使用版本号和描述作为提交信息)
git commit -m "Release v%VERSION%: %DESC%"

:: --- Git 操作 (结束) ---

:: 创建新版本目录
mkdir "src\versions\v%VERSION%"

:: 备份当前版本 (可选: 放到 backups/release 子目录)
copy "src\current\todo.html" "backups\release\todo_v%VERSION%_%mydate%.html"

:: 复制到版本目录
copy "src\current\todo.html" "src\versions\v%VERSION%\todo.html"

:: 更新部署版本 (注意这里的路径改为了 public)
copy "src\current\todo.html" "public\index.html"

:: 更新 changelog.md (自动添加)
(
  echo ## [v%VERSION%] - %mydate%
  echo ### %DESC%
  echo.
  type changelog.md
) > temp_changelog.md
move /y temp_changelog.md changelog.md

:: 部署到Firebase (注意这里的路径改为了当前目录, 需要先执行firebase init)
firebase deploy

:: --- Git 操作 (推送) ---
:: 推送到 GitHub (如果已配置远程仓库)
git push origin main

echo 版本 v%VERSION% 已创建、更新日志已更新、已提交到 Git 并部署

endlocal