/* password */
const publicHash = "2f1987bf98c09d2f5d2a23a6ae29fa53b9aec8f07ed1330bd439122f5a1a2c2c";
const reusableHash = "a7a39b72f29718e653e73503210fbb597057b7a1c77d1fe321a1afcff041d4e1";

/* element */
const messagesContainer = document.getElementById('messages');
const chatInput = document.getElementById('chat-input');
const sendMessageButton = document.getElementById('send-message');


async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function unlock() {
    const passwordInput = document.getElementById("password").value;
    const errorMessage = document.getElementById("error-message");

    const hashedPassword = await hashPassword(passwordInput);

    if (hashedPassword === reusableHash || hashedPassword === publicHash) {
        $(".lock").fadeOut(400, async function() {
            document.getElementById("lock-screen").classList.remove("active");
            document.getElementById("content").classList.add("active");
        });
        await delay(400);
        $(".unlock").fadeIn(400, async function() {
            console.log("pass");
        });
    } else {
        errorMessage.style.display = "block";
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadMessages() {
    try {
        const response = await fetch('/api/messages');
        const messages = await response.json();
        
        // 清空当前消息并添加新消息
        messagesContainer.innerHTML = '';
        messages.forEach(message => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.textContent = message;
            messagesContainer.appendChild(messageElement);
        });
        
        // 滚动到消息区的底部
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

// 发送消息
async function sendMessage() {
    const messageText = chatInput.value.trim();
    
    if (messageText) {
        try {
            await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: messageText })
            });
            chatInput.value = '';  // 清空输入框
            loadMessages();  // 刷新聊天记录
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }
}

// 加载消息并设置定时刷新
loadMessages();
setInterval(loadMessages, 5000);  // 每5秒刷新一次消息列表

// 绑定发送按钮事件
sendMessageButton.addEventListener('click', sendMessage);

// 按回车键发送消息
chatInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});