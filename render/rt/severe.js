// server.js
const WebSocket = require('ws');
const fs = require('fs');
const path = './messages.json';

// 初始化 WebSocket 服务器
const server = new WebSocket.Server({ port: 3000 });
console.log("WebSocket server is running on ws://localhost:3000");

// 读取消息文件并解析成数组
function loadMessages() {
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path);
        return JSON.parse(data);
    }
    return [];
}

// 保存消息到文件
function saveMessage(message) {
    const messages = loadMessages();
    messages.push(message);
    fs.writeFileSync(path, JSON.stringify(messages, null, 2));
}

server.on('connection', (ws) => {
    console.log("A new client connected");

    // 发送历史消息给新连接的客户端
    const history = loadMessages();
    ws.send(JSON.stringify({ type: 'history', data: history }));

    // 接收并广播新消息
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log(`Received message from ${data.user}: ${data.message}`);

        // 保存消息
        saveMessage(data);

        // 广播消息给所有连接的客户端，包括自己
        server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'message', data }));
            }
        });
    });

    ws.on('close', () => {
        console.log("A client disconnected");
    });
});
