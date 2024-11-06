const express = require('express');
const bodyParser = require('body-parser');
const app = express();

// 中间件
app.use(bodyParser.json());
app.use(express.static('public'));

// 存储聊天消息的数组（在实际应用中，这将是一个数据库）
let messages = [];

// 获取聊天记录
app.get('/api/messages', (req, res) => {
    res.json(messages);
});

// 发送聊天消息
app.post('/api/messages', (req, res) => {
    const { message } = req.body;
    if (message) {
        messages.push(message);
        res.status(200).send('Message sent');
    } else {
        res.status(400).send('Message is empty');
    }
});

// 启动服务器
app.listen(3000, () => {
    console.log(`Server running at http://localhost:3000`);
});

