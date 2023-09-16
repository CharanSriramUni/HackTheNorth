"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const express_1 = __importDefault(require("express"));
const ws_1 = __importDefault(require("ws"));
// Declarations
const SERVER_PORT = 3000;
const WS_PORT = 3001;
const DOC_NOT_INITIALIZED = "document has not been initalized";
const app = (0, express_1.default)();
let ws = null;
let document = "";
// Set up the Express server
app.get('/', (_, res) => {
    res.send('Server is up an ready to serve!');
});
app.get('/init-document', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.query;
    try {
        const parsed_url = new URL(url); // Just validate the URL
        // Make request and populate inital document
        const scriptPath = `${__dirname}/runner.sh`;
        console.log(scriptPath);
        const result = (0, child_process_1.spawnSync)('sh', [scriptPath, parsed_url.toString()]);
        console.log(result.stderr.toString());
        const text = "";
        document = text;
        ws === null || ws === void 0 ? void 0 : ws.send(document);
        res.status(200).send(text); // Change to success message
    }
    catch (e) {
        res.status(400).send('Invalid URL');
        return;
    }
}));
app.listen(SERVER_PORT, () => {
    console.log(`App running on port: ${SERVER_PORT}`);
});
// Set up the WebSocket server
const wss = new ws_1.default.Server({ port: WS_PORT });
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
