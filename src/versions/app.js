// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyDQoFW6eYP0Xq6Tv2Mf6Z3qYbCjFoVRSGY",
    authDomain: "todo-list-demo-e5f9c.firebaseapp.com",
    databaseURL: "https://todo-list-demo-e5f9c-default-rtdb.firebaseio.com",
    projectId: "todo-list-demo-e5f9c",
    storageBucket: "todo-list-demo-e5f9c.appspot.com",
    messagingSenderId: "1045286535483",
    appId: "1:1045286535483:web:c9e5c8b7a2a8a5c1f7a3e9"
};

// 初始化 Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const tasksRef = database.ref('tasks');

// DOM 元素
const taskInput = document.getElementById('task-input');
const addButton = document.getElementById('add-button');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const categorySelect = document.getElementById('category-select');

// 当前过滤状态
let currentFilter = 'all';

// 本地存储键
const LOCAL_STORAGE_KEY = 'todoApp.tasks';

// 触摸事件变量，用于降低敏感度
let touchStartTime = 0;
const TOUCH_DELAY = 150; // 触摸延迟时间（毫秒）

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 从Firebase加载任务
    loadTasksFromFirebase();
    
    // 如果Firebase不可用，从本地存储加载
    window.addEventListener('offline', () => {
        console.log('网络连接断开，切换到本地存储模式');
        loadTasksFromLocalStorage();
    });
    
    // 恢复在线时，同步到Firebase
    window.addEventListener('online', () => {
        console.log('网络连接恢复，同步到Firebase');
        const tasks = getTasksFromLocalStorage();
        syncTasksToFirebase(tasks);
    });
    
    // 添加任务事件监听
    addButton.addEventListener('click', addTask);
    
    // 添加触摸事件处理，降低敏感度
    addButton.addEventListener('touchstart', handleTouchStart);
    addButton.addEventListener('touchend', (e) => {
        handleTouchEnd(e, addTask);
    });
    
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });
    
    // 过滤按钮事件监听
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            setFilter(filter);
            
            // 更新活跃按钮样式
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
        
        // 添加触摸事件处理，降低敏感度
        button.addEventListener('touchstart', handleTouchStart);
        button.addEventListener('touchend', (e) => {
            handleTouchEnd(e, () => {
                const filter = button.dataset.filter;
                setFilter(filter);
                
                // 更新活跃按钮样式
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    });
});

// 触摸开始处理函数
function handleTouchStart() {
    touchStartTime = Date.now();
}

// 触摸结束处理函数
function handleTouchEnd(event, callback) {
    // 防止默认行为和事件冒泡
    event.preventDefault();
    
    // 计算触摸持续时间
    const touchDuration = Date.now() - touchStartTime;
    
    // 如果触摸时间太短，可能是误触，不执行操作
    if (touchDuration < TOUCH_DELAY) {
        return;
    }
    
    // 执行回调函数
    callback();
}

// 从Firebase加载任务
function loadTasksFromFirebase() {
    tasksRef.on('value', (snapshot) => {
        const tasksData = snapshot.val() || {};
        renderTasks(tasksData);
        
        // 同时保存到本地存储作为备份
        saveTasksToLocalStorage(tasksData);
    });
}

// 从本地存储加载任务
function loadTasksFromLocalStorage() {
    const tasks = getTasksFromLocalStorage();
    renderTasks(tasks);
}

// 获取本地存储中的任务
function getTasksFromLocalStorage() {
    const tasksJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    return tasksJSON ? JSON.parse(tasksJSON) : {};
}

// 保存任务到本地存储
function saveTasksToLocalStorage(tasks) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tasks));
}

// 同步任务到Firebase
function syncTasksToFirebase(tasks) {
    tasksRef.set(tasks);
}

// 添加新任务
function addTask() {
    const taskText = taskInput.value.trim();
    const category = categorySelect.value;
    
    if (taskText) {
        const newTaskRef = tasksRef.push();
        const taskId = newTaskRef.key;
        
        const newTask = {
            id: taskId,
            text: taskText,
            completed: false,
            category: category,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        newTaskRef.set(newTask)
            .then(() => {
                console.log('任务添加成功');
                taskInput.value = '';
                taskInput.focus();
            })
            .catch(error => {
                console.error('添加任务失败:', error);
                // 如果Firebase添加失败，保存到本地
                const tasks = getTasksFromLocalStorage();
                tasks[taskId] = {...newTask, createdAt: Date.now()};
                saveTasksToLocalStorage(tasks);
                renderTasks(tasks);
            });
    }
}

// 删除任务
function deleteTask(taskId) {
    tasksRef.child(taskId).remove()
        .catch(error => {
            console.error('删除任务失败:', error);
            // 如果Firebase删除失败，从本地存储删除
            const tasks = getTasksFromLocalStorage();
            delete tasks[taskId];
            saveTasksToLocalStorage(tasks);
            renderTasks(tasks);
        });
}

// 切换任务完成状态
function toggleTaskComplete(taskId, completed) {
    const taskRef = tasksRef.child(taskId);
    
    taskRef.update({ completed: !completed })
        .then(() => {
            // 添加完成动画
            if (!completed) {
                const taskElement = document.querySelector(`[data-id="${taskId}"]`);
                taskElement.classList.add('task-complete-animation');
                setTimeout(() => {
                    taskElement.classList.remove('task-complete-animation');
                }, 300);
            }
        })
        .catch(error => {
            console.error('更新任务状态失败:', error);
            // 如果Firebase更新失败，更新本地存储
            const tasks = getTasksFromLocalStorage();
            if (tasks[taskId]) {
                tasks[taskId].completed = !completed;
                saveTasksToLocalStorage(tasks);
                renderTasks(tasks);
            }
        });
}

// 编辑任务
function editTask(taskId, currentText) {
    const newText = prompt('编辑任务', currentText);
    
    if (newText !== null && newText.trim() !== '') {
        tasksRef.child(taskId).update({ text: newText.trim() })
            .catch(error => {
                console.error('编辑任务失败:', error);
                // 如果Firebase更新失败，更新本地存储
                const tasks = getTasksFromLocalStorage();
                if (tasks[taskId]) {
                    tasks[taskId].text = newText.trim();
                    saveTasksToLocalStorage(tasks);
                    renderTasks(tasks);
                }
            });
    }
}

// 设置过滤器
function setFilter(filter) {
    currentFilter = filter;
    const tasks = getTasksFromLocalStorage();
    renderTasks(tasks);
}

// 渲染任务列表
function renderTasks(tasksData) {
    // 清空任务列表
    taskList.innerHTML = '';
    
    // 将对象转换为数组并排序（最新的任务在前面）
    const tasksArray = Object.values(tasksData).sort((a, b) => b.createdAt - a.createdAt);
    
    // 根据过滤器筛选任务
    const filteredTasks = tasksArray.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });
    
    // 如果没有任务，显示空状态
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        const message = currentFilter === 'all' 
            ? '没有任务，添加一个吧！' 
            : currentFilter === 'active' 
                ? '没有待完成的任务' 
                : '没有已完成的任务';
        
        emptyState.innerHTML = `
            <p>${message}</p>
            ${currentFilter === 'all' ? '<button id="add-sample-tasks">添加示例任务</button>' : ''}
        `;
        
        taskList.appendChild(emptyState);
        
        // 添加示例任务按钮事件
        const addSampleButton = document.getElementById('add-sample-tasks');
        if (addSampleButton) {
            addSampleButton.addEventListener('click', addSampleTasks);
            
            // 添加触摸事件处理
            addSampleButton.addEventListener('touchstart', handleTouchStart);
            addSampleButton.addEventListener('touchend', (e) => {
                handleTouchEnd(e, addSampleTasks);
            });
        }
        
        return;
    }
    
    // 渲染任务列表
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.dataset.id = task.id;
        
        // 获取分类样式
        const categoryClass = `category-${task.category || 'other'}`;
        const categoryText = getCategoryText(task.category);
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <span class="category-tag ${categoryClass}">${categoryText}</span>
            <div class="task-actions">
                <button class="edit-btn">编辑</button>
                <button class="delete-btn">删除</button>
            </div>
        `;
        
        // 添加事件监听
        const checkbox = taskItem.querySelector('.task-checkbox');
        const editBtn = taskItem.querySelector('.edit-btn');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => {
            toggleTaskComplete(task.id, task.completed);
        });
        
        // 添加触摸事件处理
        checkbox.addEventListener('touchstart', handleTouchStart);
        checkbox.addEventListener('touchend', (e) => {
            handleTouchEnd(e, () => {
                toggleTaskComplete(task.id, task.completed);
            });
        });
        
        editBtn.addEventListener('click', () => {
            editTask(task.id, task.text);
        });
        
        // 添加触摸事件处理
        editBtn.addEventListener('touchstart', handleTouchStart);
        editBtn.addEventListener('touchend', (e) => {
            handleTouchEnd(e, () => {
                editTask(task.id, task.text);
            });
        });
        
        deleteBtn.addEventListener('click', () => {
            if (confirm('确定要删除这个任务吗？')) {
                deleteTask(task.id);
            }
        });
        
        // 添加触摸事件处理
        deleteBtn.addEventListener('touchstart', handleTouchStart);
        deleteBtn.addEventListener('touchend', (e) => {
            handleTouchEnd(e, () => {
                if (confirm('确定要删除这个任务吗？')) {
                    deleteTask(task.id);
                }
            });
        });
        
        taskList.appendChild(taskItem);
    });
}

// 获取分类文本
function getCategoryText(category) {
    switch(category) {
        case 'work': return '工作';
        case 'personal': return '个人';
        case 'shopping': return '购物';
        case 'other': return '其他';
        default: return '其他';
    }
}

// 添加示例任务
function addSampleTasks() {
    const sampleTasks = [
        { text: '完成项目报告', category: 'work' },
        { text: '购买生日礼物', category: 'shopping' },
        { text: '锻炼30分钟', category: 'personal' }
    ];
    
    sampleTasks.forEach(task => {
        const newTaskRef = tasksRef.push();
        const taskId = newTaskRef.key;
        
        newTaskRef.set({
            id: taskId,
            text: task.text,
            completed: false,
            category: task.category,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        }).catch(error => {
            console.error('添加示例任务失败:', error);
        });
    });
} 