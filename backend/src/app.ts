import { spawnSync } from 'child_process';
import express from 'express';
import WebSocket from 'ws';

// Declarations
const SERVER_PORT = 3000;
const WS_PORT = 3001;
const DOC_NOT_INITIALIZED = "document has not been initalized";

const app = express();

let ws: WebSocket | null = null;
let document = "";
 
// Set up the Express server
app.get('/', (_, res) => {
    res.send('Server is up an ready to serve!');
});

app.get('/init-document', async (req, res) => {
    const { url } = req.query;
    
    try {
        const parsed_url = new URL(url as string); // Just validate the URL

        // Make request and populate inital document
        const scriptPath = `${__dirname}/runner.sh`;
        spawnSync('sh', [scriptPath, parsed_url.toString()])

        const text = "";
        document = text;

        ws?.send(document);
        res.status(200).send(text); // Change to success message
    } catch (e) {
        res.status(400).send('Invalid URL');
        return;
    }

})

app.listen(SERVER_PORT, () => {
    console.log(`App running on port: ${SERVER_PORT}`);
});

// Set up the WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (new_ws) => {
    console.log('Client connected');

    new_ws.on('message', (message) => {
        // Shouldn't happen ?
        console.log(`Received something from client: ${message}`);
    });

    new_ws.send(document);
    ws = new_ws;
});

console.log(`WebSocket server running on port: ${WS_PORT}`);