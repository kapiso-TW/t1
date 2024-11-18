let nickname; // 儲存使用者名稱
const socket = io();

/* 解鎖頁面並傳送使用者名稱 */
async function unlock() {
    console.log("try unlocking...");
    const passwordInput = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    // 等待异步计算的哈希结果
    const hashedPassword = await hashPassword(passwordInput);
    console.log("Hashed password:", hashedPassword); // 这里会输出实际的哈希值，而不是 Promise

    // 傳送 hashedPassword 到後端驗證
    socket.emit('setNickname', hashedPassword, async (response) => {
        if (response.success) {
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


async function sendmes(){
    const mess = document.getElementById("messageInput");
    if( mess != "" ){
        socket.emit('chatMessage', mess );
        console.log(nickname + 'send a mes');
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


/* 添加訊息到畫面 */
function addMessage(msg) {
    const messageWrapper = document.createElement('div');
    messageWrapper.id = msg.id;
    messageWrapper.style = 'display: flex; gap: 10px; align-items: center; justify-content: center; margin-bottom: 10px;';

    // 訊息內容
    const messageContent = document.createElement('span');
    messageContent.style = 'font-size: 20px; color: white;';
    messageContent.textContent = msg.text;

    // 收回按鈕（僅顯示給訊息的發送者）
    if (msg.sender === nickname) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'button';
        deleteButton.style = 'display: flex; align-items: center;';
        deleteButton.innerHTML = '<svg viewBox="0 0 448 512" class="svgIcon" style="width: 20px; height: 20px; fill: currentColor;"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>';
        deleteButton.onclick = () => retractMessage(msg.id); // 綁定收回事件
        messageWrapper.appendChild(deleteButton);
    }

    // 添加訊息到畫面
    messageWrapper.appendChild(messageContent);
    const chatBox = document.getElementById('chat-box'); // 確保 chatBox 元素存在
    chatBox.appendChild(messageWrapper);
    chatBox.scrollTop = chatBox.scrollHeight;
}

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