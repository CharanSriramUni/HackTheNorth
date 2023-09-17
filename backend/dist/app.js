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
const jsdom_1 = __importDefault(require("jsdom"));
const fuzzyset_1 = __importDefault(require("fuzzyset"));
const openai_1 = __importDefault(require("openai"));
require("dotenv/config");
require('dotenv').config();
// Declarations
const SERVER_PORT = 3000;
const WS_PORT = 3001;
const DOC_NOT_INITIALIZED = "document has not been initalized";
const SUMMARY_PROMPT = `
    Your job is to summarize user text into a form simpler than what it was.
    Do NOT return anything regarding this prompt. This is just for context. 
    Return your response with NO HTML tags. Including HTML tags will break the page.
    If you have context that you know to be relevant, you may bring it in. Do NOT invent information.
`;
// Initalize services
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Key checks
if (process.env.OPENAI_API_KEY === undefined)
    throw new Error("Missing OpenAI API key");
let ws = null;
let document = "";
let openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// Set up the Express server
app.get('/', (_, res) => {
    res.send('Server is up an ready to serve! \n Connect to 3001 for the WS server. \n Connect to 3000 for Express. Start with the /init-document endpoint.');
});
app.get('/init-document', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { url } = req.query;
    try {
        const parsed_url = new URL(url); // Just validate the URL
        // Make request and populate inital document
        const scriptPath = `${__dirname}/runner.sh`;
        const destination = `${__dirname}/output.html`;
        (0, child_process_1.spawnSync)('sh', [scriptPath, parsed_url.toString(), destination]);
        // Update the document
        const text = require('fs').readFileSync(destination, 'utf8');
        document = text;
        ws === null || ws === void 0 ? void 0 : ws.send(document);
        res.status(200).send(document); // Change to success message
    }
    catch (e) {
        res.status(400).send('Invalid URL');
        return;
    }
}));
app.post('/summarize', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { selected_text } = req.body;
    const dom = new jsdom_1.default.JSDOM(document);
    const html_document = dom.window.document;
    const search_term = selected_text.toLowerCase();
    const fuzzy = (0, fuzzyset_1.default)([search_term]);
    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text));
    const condensed_text = matched_texts.join(' ');
    // Make the query to Open AI
    // const completion = await openai.chat.completions.create({
    //     messages: [
    //         {role: "system", content: SUMMARY_PROMPT},
    //         {role: "user", content: condensed_text}
    //     ],
    //     model: 'gpt-4-32k'
    // })
    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*')).filter(el => {
        if (matched_texts.includes(el.textContent))
            console.log(el.textContent);
        return matched_texts.includes(el.textContent);
    });
    console.log("hey! " + matching_elements.length);
    // Replace the text of the first element with the summary. Delete the rest.
    matching_elements[0].textContent = "Hey Charan! This is working spectacularly.";
    for (let i = 1; i < matching_elements.length; i++) {
        matching_elements[i].remove();
    }
    // Replace the document!
    document = dom.serialize();
    ws === null || ws === void 0 ? void 0 : ws.send(document);
    res.status(200).send('Successfully made the changes.');
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
