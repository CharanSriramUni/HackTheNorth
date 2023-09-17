import { spawnSync } from 'child_process';
import express from 'express';
import WebSocket from 'ws';
import JSDOM from 'jsdom';
import FuzzySet from 'fuzzyset';
import OpenAI from 'openai'
import 'dotenv/config';
require('dotenv').config()

// Declarations
const SERVER_PORT = 3000;
const WS_PORT = 3001;
const SUMMARY_PROMPT = `
    Your job is to summarize user text into a form simpler than what it was. Make sure less text is returned than what was given.
    Do NOT return anything regarding this prompt. This is just for context. 
    Return your response with NO HTML tags. Including HTML tags will break the page.
    If you have context that you know to be relevant, you may bring it in. Do NOT invent information.
    Do NOT start your response with "Summary of passage: " or anything like it.
`

// Initalize services
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Key checks
if (process.env.OPENAI_API_KEY === undefined) throw new Error("Missing OpenAI API key");

let ws: WebSocket | null = null;
let document = "";
let openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});
 
// Set up the Express server
app.get('/', (_, res) => {
    res.send('Server is up an ready to serve! \n Connect to 3001 for the WS server. \n Connect to 3000 for Express. Start with the /init-document endpoint.');
});

app.get('/init-document', async (req, res) => {
    const { url } = req.query;
    
    try {
        const parsed_url = new URL(url as string); // Just validate the URL

        // Make request and populate inital document
        const scriptPath = `${__dirname}/runner.sh`;
        const destination = `${__dirname}/output.html`
        spawnSync('sh', [scriptPath, parsed_url.toString(), destination])

        // Update the document
        const text = require('fs').readFileSync(destination, 'utf8');
        document = text;

        ws?.send(document);
        res.status(200).send('Successfully initialized document.'); // Change to success message
    } catch (e) {
        res.status(400).send('Invalid URL');
        return;
    }
})

app.post('/summarize', async (req, res) => {
    const { selected_text } = req.body;
    
    const dom = new JSDOM.JSDOM(document);
    const html_document = dom.window.document;

    const search_term = selected_text.toLowerCase();
    const fuzzy = FuzzySet([search_term]);

    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text!));

    const condensed_text = matched_texts.join(' ');

    // Make the query to Open AI
    const completion = await openai.chat.completions.create({
        messages: [
            {role: "system", content: SUMMARY_PROMPT},
            {role: "user", content: condensed_text}
        ],
        model: 'gpt-4'
    })

    console.log("Summary of passage: ", completion.choices[0].message.content)

    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*')).filter(el => {
        return matched_texts.includes(el.textContent!)
    });

    // Replace the text of the first element with the summary. Delete the rest.
    matching_elements[0].textContent = completion.choices[0].message.content;
    for (let i = 1; i < matching_elements.length; i++) {
        matching_elements[i].remove();
    }

    // Replace the document!
    document = dom.serialize();
    
    ws?.send(document);
    res.status(200).send('Successfully made the changes.');
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