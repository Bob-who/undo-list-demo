// Firebase数据库备份工具
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const backupDir = path.join(__dirname, '../backups');

// 确保备份目录存在
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`创建备份目录: ${backupDir}`);
}

// 获取当前日期时间格式化字符串
function getFormattedDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  
  return `${year}${month}${day}_${hour}${minute}`;
}

// 执行备份
function backupDatabase() {
  const dateStr = getFormattedDate();
  const backupFilePath = path.join(backupDir, `backup_${dateStr}.json`);
  
  const command = `firebase database:get / --project undo-list-fd50a --output "${backupFilePath}"`;
  
  console.log(`开始备份数据库...`);
  console.log(`执行命令: ${command}`);
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`备份失败: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`备份过程中出现警告: ${stderr}`);
    }
    
    console.log(`备份成功完成！文件保存至: ${backupFilePath}`);
    
    // 清理旧备份（可选，保留最近10个备份）
    cleanupOldBackups();
  });
}

// 清理旧备份，仅保留最近的指定数量
function cleanupOldBackups(keepCount = 10) {
  fs.readdir(backupDir, (err, files) => {
    if (err) {
      console.error(`无法读取备份目录: ${err.message}`);
      return;
    }
    
    // 仅筛选备份文件
    const backupFiles = files.filter(file => 
      file.startsWith('backup_') && file.endsWith('.json')
    );
    
    // 如果备份文件少于保留数量，不需要清理
    if (backupFiles.length <= keepCount) {
      console.log(`当前备份数量(${backupFiles.length})不超过保留数量(${keepCount})，无需清理`);
      return;
    }
    
    // 按文件名排序（包含日期时间）
    backupFiles.sort();
    
    // 要删除的文件
    const filesToDelete = backupFiles.slice(0, backupFiles.length - keepCount);
    
    console.log(`清理旧备份，将删除${filesToDelete.length}个文件`);
    
    filesToDelete.forEach(file => {
      const filePath = path.join(backupDir, file);
      fs.unlink(filePath, err => {
        if (err) {
          console.error(`删除文件 ${file} 失败: ${err.message}`);
        } else {
          console.log(`删除旧备份: ${file}`);
        }
      });
    });
  });
}

// 立即执行一次备份
backupDatabase();

// 导出备份函数，可供其他模块使用或定时任务调用
module.exports = {
  backupDatabase,
  cleanupOldBackups
};

console.log('备份工具初始化完成。可以通过 node tools/backup.js 命令手动执行备份。'); 