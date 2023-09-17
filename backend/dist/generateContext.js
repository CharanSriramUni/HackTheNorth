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
exports.generateContext = void 0;
const cheerio_1 = __importDefault(require("cheerio"));
const selectRandom = () => {
    const userAgents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",];
    var randomNumber = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomNumber];
};
const getSearchLinks = (query) => __awaiter(void 0, void 0, void 0, function* () {
    let user_agent = selectRandom();
    let header = {
        "User-Agent": `${user_agent}`
    };
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    const res = yield fetch(url, {
        headers: header
    });
    const html = yield res.text();
    const $ = cheerio_1.default.load(html);
    let links = [];
    $('.yuRUbf').each((index, element) => {
        const link = $(element).find("a").attr('href');
        if (link && links.length < 2) {
            links.push(link);
        }
    });
    return links;
});
function scrapeContent(url) {
    return __awaiter(this, void 0, void 0, function* () {
        let user_agent = selectRandom();
        let header = {
            "User-Agent": `${user_agent}`
        };
        const res = yield fetch(url, {
            headers: header
        });
        const html = yield res.text();
        const $ = cheerio_1.default.load(html);
        let text = "";
        $('p').each((index, element) => {
            const content = $(element).text();
            text += content + " ";
        });
        return text;
    });
}
function generateContext(query) {
    return __awaiter(this, void 0, void 0, function* () {
        let text = "";
        let links = [];
        while (links.length == 0 || text.length == 0) {
            text = "";
            links = yield getSearchLinks("javascript");
            for (const link of links) {
                const newText = yield scrapeContent(link);
                text += newText + " ";
            }
        }
        return text;
    });
}
exports.generateContext = generateContext;
