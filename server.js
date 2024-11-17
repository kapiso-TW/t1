const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid'); // summon ID

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let chatHistory = []; // save chat

app.use(express.static('public'));

io.on('connection', (socket) => {
    let nickname; // 使用者名稱

    // 等待使用者發送名稱
    socket.on('setNickname', (hashedPassword) => {
        if (hashedPassword === "2f1987bf98c09d2f5d2a23a6ae29fa53b9aec8f07ed1330bd439122f5a1a2c2c") {
            nickname = "User A";
        } else if (hashedPassword === "a7a39b72f29718e653e73503210fbb597057b7a1c77d1fe321a1afcff041d4e1") {
            nickname = "User B";
        } else {
            socket.disconnect();
            return;
        }

        console.log(`${nickname} connected`);

        // 傳送歷史訊息
        socket.emit('chatHistory', chatHistory);
    });

    // 收到新訊息
    socket.on('chatMessage', (msg) => {
        const messageId = uuidv4(); // 生成訊息ID
        const userMessage = { id: messageId, text: `${nickname}: ${msg}`, sender: nickname };
        chatHistory.push(userMessage); // 保存訊息
        io.emit('chatMessage', userMessage); // 廣播訊息
    });

    // 收回訊息
    socket.on('retractMessage', (messageId) => {
        // 確認發送者身份
        const message = chatHistory.find(msg => msg.id === messageId);
        if (message && message.sender === nickname) {
            chatHistory = chatHistory.filter(msg => msg.id !== messageId); // 移除訊息
            io.emit('retractMessage', messageId); // 廣播收回
        }
    });

    socket.on('disconnect', () => {
        console.log(`${nickname} disconnected`);
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
