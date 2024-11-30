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
    messageWrapper.className = msg.sender === nickname ? 'message-self' : 'message-post';

    // 發送者名稱
    const senderName = document.createElement('div');
    senderName.className = msg.sender === nickname ? 'name-self' : 'name';
    senderName.textContent = msg.sender;

    // 訊息內容
    const messageContent = document.createElement('div');
    messageContent.className = msg.sender === nickname ? 'text-self' : 'text';
    if (msg.retracted) {
        messageContent.textContent = '[訊息已收回]';
        messageContent.classList.add('retracted');
    } else {
        messageContent.textContent = msg.text || 'No message';
    }

    messageWrapper.appendChild(senderName);
    messageWrapper.appendChild(messageContent);

    const chatBox = document.getElementById('chatBox');
    chatBox.appendChild(messageWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;

    // 收回按鈕 (僅當前用戶的訊息顯示)
    if (msg.sender === nickname && !msg.retracted) {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button'; // 按鈕類型改為 'button'
        deleteButton.textContent = '收回';
        deleteButton.className = 'button recall-button'; // 添加專屬 class

        // 為按鈕綁定事件處理函數來發送收回訊息的請求
        deleteButton.onclick = () => {
            retractMessage(msg.id);
        };

        messageWrapper.appendChild(deleteButton);
    }
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