const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const CHAT_HISTORY_FILE = './chatHistory.json';

// 初始化聊天記錄
let chatHistory = [];
if (fs.existsSync(CHAT_HISTORY_FILE)) {
    try {
        chatHistory = JSON.parse(fs.readFileSync(CHAT_HISTORY_FILE, 'utf-8'));
    } catch (error) {
        console.error('Error reading chat history file:', error);
        chatHistory = []; // 如果讀取失敗，初始化為空
    }
}

app.use(express.static('public'));

io.on('connection', (socket) => {
    let nickname;

    // 驗證密碼
    socket.on('setNickname', (hashedPassword, callback) => {
        if (hashedPassword == "2f1987bf98c09d2f5d2a23a6ae29fa53b9aec8f07ed1330bd439122f5a1a2c2c") {
            nickname = "Sally";
            callback({ success: true });
            console.log("sa");
        } else if (hashedPassword == "a7a39b72f29718e653e73503210fbb597057b7a1c77d1fe321a1afcff041d4e1") {
            nickname = "XXX";
            callback({ success: true });
            console.log("x");
        } else {
            callback({ success: false });
            socket.disconnect();
        }

        console.log(`${nickname} connected`);

        // 發送歷史聊天記錄
        socket.emit('chatHistory', chatHistory);
    });

    // 接收新訊息
    socket.on('chatMessage', (msg) => {
        const messageId = `${Date.now()}-${Math.random()}`; // 簡單生成唯一ID
        const userMessage = { id: messageId, text: `${nickname}: ${msg}`, sender: nickname };
        chatHistory.push(userMessage);
        saveChatHistory(); // 儲存到檔案
        io.emit('chatMessage', userMessage);
    });

    // 收回訊息
    socket.on('retractMessage', (messageId) => {
        const message = chatHistory.find(msg => msg.id === messageId);
        if (message && message.sender === nickname) {
            chatHistory = chatHistory.filter(msg => msg.id !== messageId); // 從記錄中移除
            saveChatHistory(); // 儲存更新後的檔案
            io.emit('retractMessage', messageId); // 廣播刪除
        }
    });

    socket.on('disconnect', () => {
        console.log(`${nickname} disconnected`);
    });
});

// 儲存聊天記錄到檔案
function saveChatHistory() {
    try {
        fs.writeFileSync(CHAT_HISTORY_FILE, JSON.stringify(chatHistory, null, 2), 'utf-8');
        console.log('Chat history saved successfully');
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}


server.listen(3000, () => {
    console.log('Succese turn on');
});