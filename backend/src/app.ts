import  { getBingImage } from './generateImage';
import { spawnSync } from 'child_process';
import express from 'express';
import WebSocket from 'ws';
import JSDOM from 'jsdom';
import FuzzySet from 'fuzzyset';
import OpenAI from 'openai'
import 'dotenv/config';
import { generateContext } from './generateContext';
require('dotenv').config()

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
const CONTEXT_SUMMARY_PROMPT =`
    Summarize the results of these Google Search queries. Your aim is to educate the user on the topic (use the right tone). \n
    - Do NOT start your response with "Here's a summary" or anything like that. \n
    - Do NOT include any reference to Google. This will cause the universe to literally explode! \n
`
const VISUALIZE_QUERY_PROMPT = `
    Generate a query (2-5 words) that can be used to generate an image with Bing AI. Be specific, but brief.
    - Do NOT start your response with "This is the query: " or anything like it. \n
    - Keep the query short. No more than 5 words. This is INCREDIBLY important.
`
const QUESTION_QUERY_PROMPT = (question: string, context: string) => {
    return `
        Answer this question: ${question} \n
        Using, this context: ${context} \n
        - Do NOT start your response with "Answer: " or anything like that. \n
        - Do NOT include any reference to Google. This will cause the universe to literally explode! \n
    `
}

let age_prompt = ''


// Initalize services
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Key checks
if (process.env.OPENAI_API_KEY === undefined) throw new Error("Missing OpenAI API key");
if (process.env.BING_KEY === undefined) throw new Error("Missing Bing API key");

let ws: WebSocket | null = null;
let document = "";
let openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

// Set up the Express server
app.get('/', (_, res) => {
    res.send('Server is up an ready to serve! \n Connect to 3001 for the WS server. \n Connect to 3000 for Express. Start with the /init-document endpoint.');
});

app.get('/clear-document', (_, res) => {
    document = "";
    console.log('Cleared the document.')
    ws?.send(document);
    res.status(200).send('Successfully cleared document.');
})

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
app.post('/age', async (req, res) => {
    const { age } = req.body;
    if(age == "child") {
        age_prompt = "Answer as if you are writing to someone with an elementary school vocabularly.\n";
    }else if(age == "teen") {
        age_prompt = "Answer as if you are writing to someone with a middle/high school vocabulary.\n";
    }else {
        age_prompt = '';
    }
});
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
            {role: "system", content: age_prompt+SUMMARY_PROMPT},
            {role: "user", content: condensed_text}
        ],
        model: 'gpt-3.5-turbo'
    })

    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*'))
        .filter((el: Element) => matched_texts.includes(el.textContent!));
    
    if (matching_elements.length == 0) {
        res.status(304).send('No matching elements found. Document not modified.');
        return;
    }

    console.log("Found matching elements: ", matching_elements, matching_elements.length);
    
    // Replace the text of the first element with the summary. Delete the rest.
    const existing_element = matching_elements[matching_elements.length - 1] as HTMLElement;
    const clone = matching_elements[matching_elements.length - 1].cloneNode(true) as HTMLElement;

    if (existing_element.nextSibling) {
        existing_element.parentNode?.insertBefore(clone, existing_element.nextSibling); // Ends up inserting right after
    } else {
        existing_element.parentNode?.appendChild(clone);
    }

    clone.textContent = completion.choices[0].message.content;
    clone.style.fontWeight = "bold";

    for (let i = 0; i < matching_elements.length; i++) {
        const el = matching_elements[i] as HTMLElement;
        el.style.textDecoration = "line-through";
        el.style.color = "#808080"
    }

    // Replace the document!
    document = dom.serialize();
    
    ws?.send(document);
    res.status(200).send('Successfully made the SUMMARY change.');
})

app.post('/context', async (req, res) => {
    const { selected_text } = req.body;
    
    const dom = new JSDOM.JSDOM(document);
    const html_document = dom.window.document;

    const search_term = selected_text.toLowerCase();
    const fuzzy = FuzzySet([search_term]);

    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text!));

    const condensed_text = matched_texts.join(' ');
    
    // Make the query to Open AI
    const search_query = await openai.chat.completions.create({
        messages: [
            {role: "system", content: CONTEXT_QUERY_PROMPT},
            {role: "user", content: condensed_text}
        ],
        model: 'gpt-3.5-turbo'
    })

    const search_query_body = search_query.choices[0].message.content;
    console.log("This is the query: ", search_query_body)

    if (search_query_body === null) {
        res.status(404).send('Could not construct search query.');
        return;
    }

    // Stitched search results from the queries
    const query_data = await generateContext(search_query_body);
    
    const query_summary = await openai.chat.completions.create({
        messages: [
            {role: "system", content: age_prompt+CONTEXT_SUMMARY_PROMPT},
            {role: "user", content: query_data}
        ],
        model: 'gpt-3.5-turbo-16k'
    })

    const query_summary_body = query_summary.choices[0].message.content;
    console.log("Here's your context: ", query_summary_body)

    if (query_summary_body === null) {
        res.status(404).send('Could not construct search summary.');
        return;
    }

    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*'))
        .filter((el: Element) => matched_texts.includes(el.textContent!));

    if (matching_elements.length == 0) {
        res.status(304).send('No matching elements found. Document not modified.');
        return;
    }

    const existing_element = matching_elements[matching_elements.length - 1] as HTMLElement;
    const clone = existing_element.cloneNode(true) as HTMLElement;

    // Modify styling
    existing_element.style.padding = '5px';
    existing_element.style.border = '2px solid #34a949'; // Green out the existing element
    existing_element.style.borderRadius = '5px';
    clone.style.color = '#34a949'; // Green out the new element

    // Modify content
    clone.textContent = query_summary_body;

    if (existing_element.nextSibling) {
        existing_element.parentNode?.insertBefore(clone, existing_element.nextSibling);
    } else {
        existing_element.parentNode?.appendChild(clone);
    }

    // Replace the document!
    document = dom.serialize();
    
    ws?.send(document);
    res.status(200).send('Successfully made the CONTEXT change.');
})

app.post('/visualize', async (req, res) => {
    const { selected_text } = req.body;
    
    const dom = new JSDOM.JSDOM(document);
    const html_document = dom.window.document;

    const search_term = selected_text.toLowerCase();
    const fuzzy = FuzzySet([search_term]);

    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text!));

    const condensed_text = matched_texts.join(' ');

    const search_query = await openai.chat.completions.create({
        messages: [
            {role: "system", content: VISUALIZE_QUERY_PROMPT},
            {role: "user", content: condensed_text}
        ],
        model: 'gpt-3.5-turbo'
    })

    const search_query_body = search_query.choices[0].message.content;
    console.log("This is the visualization query: ", search_query_body);

    if (search_query_body === null) {
        res.status(404).send('Could not construct visualization query.');
        return;
    }

    // Make the query to Bing
    const image_url = await getBingImage(search_query_body);

    // Now that we have the matched texts, find the elements they correspond to
    const matching_elements = Array.from(html_document.querySelectorAll('*'))
        .filter((el: Element) => matched_texts.includes(el.textContent!));
    
    if (matching_elements.length == 0) {
        res.status(304).send('No matching elements found. Document not modified.');
        return;
    }

    const existing_element = matching_elements[matching_elements.length - 1] as HTMLElement;
    const image_element = html_document.createElement('img');
    image_element.src = image_url;

    console.log("This is the URL: ", image_url);

    // Add to DOM
    existing_element.parentNode?.insertBefore(image_element, existing_element);

    // Replace the document!
    document = dom.serialize();
    
    ws?.send(document);
    res.status(200).send('Successfully made the VISUALIZATION change.');
})

app.post('/question', async (req, res) => {
    const { selected_text, question } = req.body;
    
    const dom = new JSDOM.JSDOM(document);
    const html_document = dom.window.document;

    const search_term = selected_text.toLowerCase();
    const fuzzy = FuzzySet([search_term]);

    const all_texts = Array.from(html_document.querySelectorAll('*')).map(el => el.textContent);
    const matched_texts = all_texts.filter(text => fuzzy.get(text!));

    const condensed_text = matched_texts.join(' ');

    const search_query = await openai.chat.completions.create({
        messages: [
            {role: "system", content: CONTEXT_QUERY_PROMPT},
            {role: "user", content: condensed_text}
        ],
        model: 'gpt-3.5-turbo'
    })

    const search_query_body = search_query.choices[0].message.content;
    console.log("This is the query: ", search_query_body)

    if (search_query_body === null) {
        res.status(404).send('Could not construct search query.');
        return;
    }

    // Stitched search results from the queries
    let query_background = await generateContext(search_query_body);
    query_background = condensed_text + " " + query_background;

    // Answer question
    const question_answer = await openai.chat.completions.create({
        messages: [
            {role: "system", content: age_prompt+QUESTION_QUERY_PROMPT(question, query_background)},
            {role: "user", content: condensed_text}
        ],
        model: 'gpt-3.5-turbo-16k'
    })

    console.log("This is the Q/A: ", question, question_answer.choices[0].message.content);

     // Now that we have the matched texts, find the elements they correspond to
     const matching_elements = Array.from(html_document.querySelectorAll('*'))
     .filter((el: Element) => matched_texts.includes(el.textContent!));
 
    if (matching_elements.length == 0) {
        res.status(304).send('No matching elements found. Document not modified.');
        return;
    }

    const existing_element = matching_elements[matching_elements.length - 1] as HTMLElement;
    const question_element = existing_element.cloneNode(true) as HTMLElement;
    const answer_element = existing_element.cloneNode(true) as HTMLElement;

    // Modify styling
    question_element.style.color = '#5d13d6'; // Green out the new element
    answer_element.style.color = '#8d2ab0'

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
        existing_element.parentNode?.insertBefore(qa_div, existing_element.nextSibling);
    } else {
        existing_element.parentNode?.appendChild(qa_div);
    }

    // Replace the document!
    document = dom.serialize();
    
    ws?.send(document);
    res.status(200).send('Successfully made the QUESTION change.');
})

app.listen(SERVER_PORT, () => {
    console.log(`App running on port: ${SERVER_PORT}`);
});

// Set up the WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (new_ws) => {
    console.log('Client connected');

    new_ws.on('message', (message) => {
        console.log(`Received something from client: ${message}`);
    });

    new_ws.on('close', () => {
        console.log('Client disconnected');
    })

    new_ws.send(document);
    ws = new_ws;
});

console.log(`WebSocket server running on port: ${WS_PORT}`);