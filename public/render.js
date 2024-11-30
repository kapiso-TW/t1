const socket = io(); // 必须在任何对 socket 的使用之前声明

let nickname; // 儲存使用者名稱

/* 解鎖頁面並傳送使用者名稱 */
async function unlock() {
    console.log("Trying to unlock...");
    const passwordInput = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    // 等待异步计算的哈希结果
    const hashedPassword = await hashPassword(passwordInput);
    console.log("Hashed password:", hashedPassword); // 输出哈希值

    // 傳送 hashedPassword 到後端驗證
    socket.emit('setNickname', hashedPassword, async (response) => {
        if (response.success) {
            nickname = response.nickname; // 设置前端的 nickname
            console.log(`Welcome, ${nickname}!`);

            $(".lock").fadeOut(400, async function () {
                document.getElementById("lock-screen").classList.remove("active");
                document.getElementById("content").classList.add("active");
            });
            await delay(400);
            $(".unlock").fadeIn(400);
        } else {
            errorMessage.style.display = "block"; // 密碼錯誤
            errorMessage.textContent = "密碼錯誤，請再試一次！";
        }
    });
}

async function sendmes() {
    const mess = document.getElementById("messageInput").value; // 獲取輸入框的值
    if (mess.trim() !== "") { // 確保訊息不為空
        socket.emit('chatMessage', mess); // 發送訊息
        console.log(`${nickname} sent a message: ${mess}`);
        document.getElementById("messageInput").value = ""; // 清空輸入框
    } else {
        console.log("Message is empty, not sent.");
    }
}


function addMessage(msg) {
    const messageWrapper = document.createElement('div');
    messageWrapper.id = msg.id;
    messageWrapper.style = 'display: flex; gap: 10px; align-items: center; justify-content: center; margin-bottom: 10px;';

    // 訊息內容
    const messageContent = document.createElement('span');
    messageContent.style = 'font-size: 20px; color: white;';
    
    if (msg.retracted) {
        // 訊息已收回
        messageContent.textContent = '[訊息已收回]'; // 顯示收回提示
        messageContent.style.color = 'gray'; // 改變顏色以顯示收回狀態
        messageWrapper.classList.add('retracted');
    } else {
        // 正常訊息
        messageContent.textContent = msg.text || 'No message'; // 檢查是否有訊息
    }

    // 發送者名稱
    const senderName = document.createElement('div');
    senderName.style = 'font-weight: bold; color: lightblue;';
    senderName.textContent = msg.sender;

    console.log(`Current user: ${nickname}, Message sender: ${msg.sender}`);
    if (msg.sender === nickname) {
        // 如果是自己發送的訊息，顯示收回按鈕
        const deleteButton = document.createElement('button');
        deleteButton.className = 'button';
        deleteButton.style = 'display: flex; align-items: center;';
        deleteButton.innerHTML = '<svg viewBox="0 0 448 512" style="width: 20px; height: 20px; fill: currentColor;"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>';
        deleteButton.onclick = () => retractMessage(msg.id); // 綁定收回事件
        messageWrapper.appendChild(deleteButton);
    }

    // 根據訊息狀態調整樣式
    if (msg.sender === nickname) {
        messageWrapper.style.justifyContent = 'flex-end'; // 自己的訊息靠右對齊
        messageContent.style.backgroundColor = 'lightgreen'; // 自己訊息背景顏色
    } else {
        messageWrapper.style.justifyContent = 'flex-start'; // 別人的訊息靠左對齊
        messageContent.style.backgroundColor = 'lightblue'; // 別人訊息背景顏色
    }

    // 添加訊息到畫面
    messageWrapper.appendChild(senderName);
    messageWrapper.appendChild(messageContent);
    const chatBox = document.getElementById('chatBox');
    chatBox.appendChild(messageWrapper);
    chatBox.scrollTop = chatBox.scrollHeight; // 滾動到最新訊息 
}




/* 更新歷史訊息 */
socket.on('chatHistory', (history) => {
    history.forEach(msg => addMessage(msg));
});

/* 新訊息 */
socket.on('chatMessage', (msg) => {
    addMessage(msg);
}); 

/* 收回訊息 */
socket.on('retractMessage', (messageId) => {
    const msgElement = document.getElementById(messageId);
    if (msgElement) {
        msgElement.textContent = '已被收回';
    }
});


async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}


function retractMessage(messageId) {
    socket.emit('retractMessage', messageId);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}