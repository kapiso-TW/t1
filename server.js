const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid'); // 用于生成唯一 ID

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let chatHistory = []; // 保存聊天记录
let userCount = 1; // 用于生成用户昵称
const userIPs = {}; // 存储 IP 地址到昵称的映射

app.use(express.static('public'));

// 当有新用户连接时
io.on('connection', (socket) => {
    // 通过 socket.request 获取用户的 IP 地址
    const userIp = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
    console.log(userIPs);
    let nickname;

    // 检查用户 IP 地址是否已有昵称
    if (userIPs[userIp]) {
        nickname = userIPs[userIp];
    } else {
        // 分配新的昵称并记录
        nickname = `User ${userCount++}`;
        userIPs[userIp] = nickname;
    }

    console.log(`${nickname} (${userIp}) 已连接`);

    // 将历史聊天记录发送给新用户
    socket.emit('chatHistory', chatHistory);

    // 监听用户发送的消息
    socket.on('chatMessage', (msg) => {
        const messageId = uuidv4(); // 生成唯一的消息 ID
        const userMessage = { id: messageId, text: `${nickname}: ${msg}` };
        chatHistory.push(userMessage); // 保存聊天记录
        io.emit('chatMessage', userMessage); // 广播消息
    });

    // 监听用户撤回消息请求
    socket.on('retractMessage', (messageId) => {
        // 查找消息并从历史记录中删除
        chatHistory = chatHistory.filter(message => message.id !== messageId);
        // 通知所有客户端更新聊天记录
        io.emit('retractMessage', messageId);
    });

    socket.on('disconnect', () => {
        console.log(`${nickname} (${userIp}) 已断开连接`);
    });
});

server.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});
