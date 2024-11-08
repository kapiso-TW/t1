const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid'); // summon ID

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let chatHistory = []; // save chat
let userCount = 1; // user name
const userIPs = {}; // save ip

app.use(express.static('public'));

// new connection
io.on('connection', (socket) => {
    // get ip by using socket.request 
    const userIp = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
    console.log(userIPs);
    let nickname;

    // check ip have id or not
    if (userIPs[userIp]) {
        nickname = userIPs[userIp];
    } else {
        // if no, give a new id 
        nickname = `User ${userCount++}`;
        userIPs[userIp] = nickname;
    }

    console.log(`${nickname} (${userIp}) connected`);

    // history chat give
    socket.emit('chatHistory', chatHistory);

    // listen new chat
    socket.on('chatMessage', (msg) => {
        const messageId = uuidv4(); // summon id for mes
        const userMessage = { id: messageId, text: `${nickname}: ${msg}` };
        chatHistory.push(userMessage); // save chat
        io.emit('chatMessage', userMessage); // give all
    });

    // listen chat del
    socket.on('retractMessage', (messageId) => {
        // find and del
        chatHistory = chatHistory.filter(message => message.id !== messageId);
        // update all
        io.emit('retractMessage', messageId);
    });

    socket.on('disconnect', () => {
        console.log(`${nickname} (${userIp}) disconnected`);
    });
});

server.listen(3000, () => {
    console.log('Succese turn on');
});
