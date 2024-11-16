const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid'); // 生成唯一 ID

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let chatHistory = []; // 保存聊天歷史

app.use(express.static('public'));

// 新連線
io.on('connection', (socket) => {
    let nickname = null; // 使用者名稱

    // 等待客戶端設置名稱
    socket.on('setNickname', (name) => {
        nickname = name || `User-${uuidv4().slice(0, 6)}`;
        console.log(`${nickname} connected`);
        socket.emit('chatHistory', chatHistory); // 發送聊天記錄
    });

    // 監聽新訊息
    socket.on('chatMessage', (msg) => {
        if (!nickname) return; // 尚未設置名稱則不處理
        const messageId = uuidv4(); // 為訊息生成唯一 ID
        const userMessage = { id: messageId, text: `${nickname}: ${msg}`, sender: nickname };
        chatHistory.push(userMessage); // 保存聊天訊息
        io.emit('chatMessage', userMessage); // 廣播訊息
    });

    // 監聽訊息收回
    socket.on('retractMessage', (messageId) => {
        const message = chatHistory.find((msg) => msg.id === messageId);

        // 僅允許發送者收回自己的訊息
        if (message && message.sender === nickname) {
            chatHistory = chatHistory.filter((msg) => msg.id !== messageId);
            io.emit('retractMessage', messageId);
        } else {
            socket.emit('errorMessage', 'You can only retract your own messages.');
        }
    });

    socket.on('disconnect', () => {
        console.log(`${nickname || 'Unknown user'} disconnected`);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
