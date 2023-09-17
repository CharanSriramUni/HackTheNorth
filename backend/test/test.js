const WebSocket = require('ws');
const fs = require('fs');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
    fs.writeFileSync('./test.html', '');
    console.log('Connected to the WebSocket server.');
});

ws.on('message', (data) => {
    fs.writeFileSync('./test.html', data);
});

ws.on('close', () => {
    console.log('Disconnected from the WebSocket server.');
});

ws.on('error', (error) => {
    console.error('WebSocket Error:', error);
});
