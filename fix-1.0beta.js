// 这是一个修复脚本，用于修复1.0beta版本中的saveTasks函数重复定义问题
const fs = require('fs');
const path = require('path');

// 文件路径
const filePath = path.join(__dirname, 'src/versions/index 1.0beta.html');

// 读取文件内容
fs.readFile(filePath, 'utf8', (err, data) => {
  if (err) {
    console.error('读取文件时出错:', err);
    return;
  }
  
  // 创建备份
  fs.writeFile(filePath + '.bak', data, (err) => {
    if (err) {
      console.error('创建备份时出错:', err);
      return;
    }
    console.log('已创建原文件备份');
  });
  
  // 找到并替换两处错误
  
  // 1. 修复 tasksRef 初始化，在用户登录时设置为用户特定的路径
  let modifiedContent = data.replace(
    /firebase\.auth\(\)\.onAuthStateChanged\(function\(user\) \{\s+if \(user\) \{\s+\/\/ 用户已登录\s+console\.log\('用户已登录:', user\.email\);\s+currentUser = user;\s+updateUserInfo\(user\);\s+authContainer\.style\.display = 'none';/g,
    `firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // 用户已登录
        console.log('用户已登录:', user.email);
        currentUser = user;
        updateUserInfo(user);
        authContainer.style.display = 'none';
        
        // 设置用户特定的任务引用
        tasksRef = database.ref('users/' + user.uid + '/tasks');`
  );
  
  // 2. 修复用户未登录状态下的逻辑
  modifiedContent = modifiedContent.replace(
    /\/\/ 用户未登录\s+console\.log\('用户未登录'\);\s+currentUser = null;\s+updateUserInfo\(null\);\s+\s+\/\/ 显示登录界面/g,
    `// 用户未登录
        console.log('用户未登录');
        currentUser = null;
        updateUserInfo(null);
        
        // 重置任务引用
        tasksRef = null;
        
        // 显示登录界面`
  );
  
  // 3. 修改loadTasks函数以检查任务引用是否存在
  modifiedContent = modifiedContent.replace(
    /function loadTasks\(\) \{\s+console\.log\('从 Firebase 加载任务\.\.\.'\);\s+\s+return new Promise\(\(resolve, reject\)/g,
    `function loadTasks() {
    console.log('从 Firebase 加载任务...');
    
    if (!currentUser || !tasksRef) {
        console.log('用户未登录或任务引用未设置，无法加载任务');
        return Promise.resolve(false);
    }
    
    return new Promise((resolve, reject)`
  );
  
  // 4. 删除重复的saveTasks函数
  modifiedContent = modifiedContent.replace(
    /\/\/ 保存任务\s+function saveTasks\(\) \{\s+console\.log\('保存任务到 Firebase\.\.\.'\);\s+\s+\/\/ 防止重复同步[\s\S]*?isSyncing = false;\s+return true; \/\/ 返回 true 因为已经保存到本地存储\s+\}\);\s+\}/g,
    `// 使用修改后的saveTasks函数（在上面定义）`
  );
  
  // 写回文件
  fs.writeFile(filePath, modifiedContent, (err) => {
    if (err) {
      console.error('写入文件时出错:', err);
      return;
    }
    console.log('文件已修复。问题解决：');
    console.log('1. tasksRef 现在在用户登录时正确设置为用户特定的路径');
    console.log('2. 删除了重复的saveTasks函数定义，避免了函数覆盖');
    console.log('3. 修复了未登录状态下的数据加载逻辑');
    console.log('4. 任务现在会正确保存到用户特定的数据路径下');
  });
}); 