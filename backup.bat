@echo off
echo 开始备份数据库...

set TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=backups\backup_%TIMESTAMP%.json

echo 备份文件: %BACKUP_FILE%

firebase database:get / --project undo-list-fd50a --output %BACKUP_FILE%

if %ERRORLEVEL% EQU 0 (
    echo 备份成功完成！
    echo 文件已保存至: %BACKUP_FILE%
) else (
    echo 备份失败，错误代码: %ERRORLEVEL%
)

echo.
echo 按任意键退出...
pause >nul 