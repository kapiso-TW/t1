// server.js
const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

server.on('connection', (ws) => {
    console.log("A new client connected");

    // 接收客户端消息
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        console.log(`Received message from ${data.user}: ${data.message}`);

        // 广播消息给所有连接的客户端
        server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    ws.on('close', () => {
        console.log("A client disconnected");
    });
});

console.log("WebSocket server is running on https://localhost:3000");
