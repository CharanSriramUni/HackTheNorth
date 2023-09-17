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
const generateContext_1 = require("./generateContext");
const generateImage_1 = require("./generateImage");
require('dotenv').config();
// Declarations
const SERVER_PORT = 3000;
const WS_PORT = 3001;
const SUMMARY_PROMPT = `
    Your job is to summarize user text into a form simpler than what it was. \n
    - Make the response no more than 25 words. This is IMPORTANT. \n
    - Do NOT return anything regarding this prompt. This i for context. \n
    - Return your response with NO HTML tags. Including HTML tags will break the page. \n
    - Do NOT start your response with "Summary of passage: " or anything like it. \n
`;
const CONTEXT_QUERY_PROMPT = `
    Generate a query (a few words to a sentence) that would be used to give someone context in a Google Search based on the user's text. \n
    - Keep the query short. No more than 15 words. This is INCREDIBLY important.
    - Do NOT start your response with "This is the query: " or anything like it. \n
 `;
const CONTEXT_SUMMARY_PROMPT = `
    Summarize the results of these Google Search queries. Your aim is to educate the user on the topic (use the right tone). \n
    - Do NOT start your response with "Here's a summary" or anything like that. \n
    - Do NOT include any reference to Google. This will cause the universe to literally explode! \n
`;
const VISUALIZE_QUERY_PROMPT = `
    Generate a query (2-5 words) that can be used to generate an image with Bing AI. Be specific, but brief.
    - Do NOT start your response with "This is the query: " or anything like it. \n
    - Keep the query short. No more than 5 words. This is INCREDIBLY important.
`;
const QUESTION_QUERY_PROMPT = (question, context) => {
    return `
        Answer this question: ${question} \n
        Using, this context: ${context} \n
        - Do NOT start your response with "Answer: " or anything like that. \n
        - Do NOT include any reference to Google. This will cause the universe to literally explode! \n
    `;
};
// Initalize services
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// API Key checks
if (process.env.OPENAI_API_KEY === undefined)
    throw new Error("Missing OpenAI API key");
if (process.env.BING_KEY === undefined)
    throw new Error("Missing Bing API key");
let ws = null;
let document = "";
let openai = new openai_1.default({ apiKey: process.env.OPENAI_API_KEY });
// Set up the Express server
app.get('/', (_, res) => {
    res.send('Server is up an ready to serve! \n Connect to 3001 for the WS server. \n Connect to 3000 for Express. Start with the /init-document endpoint.');
});
app.get('/clear-document', (_, res) => {
    document = "";
    console.log('Cleared the document.');
    ws === null || ws === void 0 ? void 0 : ws.send(document);
    res.status(200).send('Successfully cleared document.');
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
        res.status(200).send('Successfully initialized document.'); // Change to success message
    }
    catch (e) {
        res.status(400).send('Invalid URL');
        return;
    }
}));
app.post('/summarize', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { selected_text } = req.body;
    const dom = new jsdom_1.default.JSDOM(document);
    const html_document = dom.window.document;
    const search_term = selected_text.toLowerCase();
    const fuzzy = (0, fuzzyset_1.default)([search_term]);
    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text));
    const condensed_text = matched_texts.join(' ');
    // Make the query to Open AI
    const completion = yield openai.chat.completions.create({
        messages: [
            { role: "system", content: SUMMARY_PROMPT },
            { role: "user", content: condensed_text }
        ],
        model: 'gpt-3.5-turbo'
    });
    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*'))
        .filter((el) => matched_texts.includes(el.textContent));
    if (matching_elements.length == 0) {
        res.status(304).send('No matching elements found. Document not modified.');
        return;
    }
    console.log("Found matching elements: ", matching_elements, matching_elements.length);
    // Replace the text of the first element with the summary. Delete the rest.
    const existing_element = matching_elements[matching_elements.length - 1];
    const clone = matching_elements[matching_elements.length - 1].cloneNode(true);
    if (existing_element.nextSibling) {
        (_a = existing_element.parentNode) === null || _a === void 0 ? void 0 : _a.insertBefore(clone, existing_element.nextSibling); // Ends up inserting right after
    }
    else {
        (_b = existing_element.parentNode) === null || _b === void 0 ? void 0 : _b.appendChild(clone);
    }
    clone.textContent = completion.choices[0].message.content;
    clone.style.fontWeight = "bold";
    for (let i = 0; i < matching_elements.length; i++) {
        const el = matching_elements[i];
        el.style.textDecoration = "line-through";
        el.style.color = "#808080";
    }
    // Replace the document!
    document = dom.serialize();
    ws === null || ws === void 0 ? void 0 : ws.send(document);
    res.status(200).send('Successfully made the SUMMARY change.');
}));
app.post('/context', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    const { selected_text } = req.body;
    const dom = new jsdom_1.default.JSDOM(document);
    const html_document = dom.window.document;
    const search_term = selected_text.toLowerCase();
    const fuzzy = (0, fuzzyset_1.default)([search_term]);
    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text));
    const condensed_text = matched_texts.join(' ');
    // Make the query to Open AI
    const search_query = yield openai.chat.completions.create({
        messages: [
            { role: "system", content: CONTEXT_QUERY_PROMPT },
            { role: "user", content: condensed_text }
        ],
        model: 'gpt-3.5-turbo'
    });
    const search_query_body = search_query.choices[0].message.content;
    console.log("This is the query: ", search_query_body);
    if (search_query_body === null) {
        res.status(404).send('Could not construct search query.');
        return;
    }
    // Stitched search results from the queries
    const query_data = yield (0, generateContext_1.generateContext)(search_query_body);
    const query_summary = yield openai.chat.completions.create({
        messages: [
            { role: "system", content: CONTEXT_SUMMARY_PROMPT },
            { role: "user", content: query_data }
        ],
        model: 'gpt-3.5-turbo-16k'
    });
    const query_summary_body = query_summary.choices[0].message.content;
    console.log("Here's your context: ", query_summary_body);
    if (query_summary_body === null) {
        res.status(404).send('Could not construct search summary.');
        return;
    }
    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*'))
        .filter((el) => matched_texts.includes(el.textContent));
    if (matching_elements.length == 0) {
        res.status(304).send('No matching elements found. Document not modified.');
        return;
    }
    const existing_element = matching_elements[matching_elements.length - 1];
    const clone = existing_element.cloneNode(true);
    // Modify styling
    existing_element.style.padding = '5px';
    existing_element.style.border = '2px solid #34a949'; // Green out the existing element
    existing_element.style.borderRadius = '5px';
    clone.style.color = '#34a949'; // Green out the new element
    // Modify content
    clone.textContent = query_summary_body;
    if (existing_element.nextSibling) {
        (_c = existing_element.parentNode) === null || _c === void 0 ? void 0 : _c.insertBefore(clone, existing_element.nextSibling);
    }
    else {
        (_d = existing_element.parentNode) === null || _d === void 0 ? void 0 : _d.appendChild(clone);
    }
    // Replace the document!
    document = dom.serialize();
    ws === null || ws === void 0 ? void 0 : ws.send(document);
    res.status(200).send('Successfully made the CONTEXT change.');
}));
app.post('/visualize', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const { selected_text } = req.body;
    const dom = new jsdom_1.default.JSDOM(document);
    const html_document = dom.window.document;
    const search_term = selected_text.toLowerCase();
    const fuzzy = (0, fuzzyset_1.default)([search_term]);
    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text));
    const condensed_text = matched_texts.join(' ');
    const search_query = yield openai.chat.completions.create({
        messages: [
            { role: "system", content: VISUALIZE_QUERY_PROMPT },
            { role: "user", content: condensed_text }
        ],
        model: 'gpt-3.5-turbo'
    });
    const search_query_body = search_query.choices[0].message.content;
    console.log("This is the visualization query: ", search_query_body);
    if (search_query_body === null) {
        res.status(404).send('Could not construct visualization query.');
        return;
    }
    // Make the query to Bing
    const image_url = yield (0, generateImage_1.getBingImage)(search_query_body);
    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*'))
        .filter((el) => matched_texts.includes(el.textContent));
    if (matching_elements.length == 0) {
        res.status(304).send('No matching elements found. Document not modified.');
        return;
    }
    const existing_element = matching_elements[matching_elements.length - 1];
    const image_element = html_document.createElement('img');
    image_element.src = image_url;
    console.log("This is the URL: ", image_url);
    // Add to DOM
    (_e = existing_element.parentNode) === null || _e === void 0 ? void 0 : _e.insertBefore(image_element, existing_element);
    // Replace the document!
    document = dom.serialize();
    ws === null || ws === void 0 ? void 0 : ws.send(document);
    res.status(200).send('Successfully made the VISUALIZATION change.');
}));
app.post('/question', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _f, _g;
    const { selected_text, question } = req.body;
    const dom = new jsdom_1.default.JSDOM(document);
    const html_document = dom.window.document;
    const search_term = selected_text.toLowerCase();
    const fuzzy = (0, fuzzyset_1.default)([search_term]);
    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text));
    const condensed_text = matched_texts.join(' ');
    const search_query = yield openai.chat.completions.create({
        messages: [
            { role: "system", content: CONTEXT_QUERY_PROMPT },
            { role: "user", content: condensed_text }
        ],
        model: 'gpt-3.5-turbo'
    });
    const search_query_body = search_query.choices[0].message.content;
    console.log("This is the query: ", search_query_body);
    if (search_query_body === null) {
        res.status(404).send('Could not construct search query.');
        return;
    }
    // Stitched search results from the queries
    let query_background = yield (0, generateContext_1.generateContext)(search_query_body);
    query_background = condensed_text + " " + query_background;
    // Answer question
    const question_answer = yield openai.chat.completions.create({
        messages: [
            { role: "system", content: QUESTION_QUERY_PROMPT(question, query_background) },
            { role: "user", content: condensed_text }
        ],
        model: 'gpt-3.5-turbo-16k'
    });
    console.log("This is the Q/A: ", question, question_answer.choices[0].message.content);
    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*'))
        .filter((el) => matched_texts.includes(el.textContent));
    if (matching_elements.length == 0) {
        res.status(304).send('No matching elements found. Document not modified.');
        return;
    }
    const existing_element = matching_elements[matching_elements.length - 1];
    const question_element = existing_element.cloneNode(true);
    const answer_element = existing_element.cloneNode(true);
    // Modify styling
    question_element.style.color = '#5d13d6'; // Green out the new element
    answer_element.style.color = '#8d2ab0';
    // Modify content
    question_element.textContent = "Question: " + question;
    answer_element.textContent = "Answer: " + question_answer.choices[0].message.content;
    // Create a new div to hold the question and answer
    const qa_div = html_document.createElement('div');
    qa_div.style.display = 'flex';
    qa_div.style.flexDirection = 'column';
    qa_div.style.padding = '5px';
    qa_div.appendChild(question_element);
    qa_div.appendChild(answer_element);
    // Add to DOM
    if (existing_element.nextSibling) {
        (_f = existing_element.parentNode) === null || _f === void 0 ? void 0 : _f.insertBefore(qa_div, existing_element.nextSibling);
    }
    else {
        (_g = existing_element.parentNode) === null || _g === void 0 ? void 0 : _g.appendChild(qa_div);
    }
    // Replace the document!
    document = dom.serialize();
    ws === null || ws === void 0 ? void 0 : ws.send(document);
    res.status(200).send('Successfully made the QUESTION change.');
}));
app.listen(SERVER_PORT, () => {
    console.log(`App running on port: ${SERVER_PORT}`);
});
// Set up the WebSocket server
const wss = new ws_1.default.Server({ port: WS_PORT });
wss.on('connection', (new_ws) => {
    console.log('Client connected');
    new_ws.on('message', (message) => {
        console.log(`Received something from client: ${message}`);
    });
    new_ws.on('close', () => {
        console.log('Client disconnected');
    });
    new_ws.send(document);
    ws = new_ws;
});
console.log(`WebSocket server running on port: ${WS_PORT}`);
