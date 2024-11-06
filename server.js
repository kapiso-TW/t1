const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// 存储聊天历史
let chatHistory = [];

io.on('connection', (socket) => {
    console.log('a user connected');

    // 发送历史消息
    socket.emit('chatHistory', chatHistory);

    // 监听新的消息
    socket.on('chatMessage', (message) => {
        const msg = { id: Date.now().toString(), text: message };
        chatHistory.push(msg);
        io.emit('chatMessage', msg); // 广播新消息
    });

    // 监听撤回消息
    socket.on('retractMessage', (messageId) => {
        chatHistory = chatHistory.filter(msg => msg.id !== messageId); // 移除历史记录中的消息
        io.emit('retractMessage', messageId); // 通知所有客户端撤回消息
    });

    // 断开连接时的清理
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

// 启动服务器
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
