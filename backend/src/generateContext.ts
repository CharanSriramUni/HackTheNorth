import cheerio from 'cheerio';

const selectRandom = () => {
    const userAgents = ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.45 Safari/537.36", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36", ]
    var randomNumber = Math.floor(Math.random() * userAgents.length);
    return userAgents[randomNumber];
}

const getSearchLinks = async (query: string) => {
    let user_agent = selectRandom();
    let header = {
        "User-Agent": `${user_agent}`
    }
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const res = await fetch(url, { // Node 18 or install node-fetch
        headers: header
    })
    const html = await res.text()
    const $ = cheerio.load(html);
    let links: string[] = []
    $('.yuRUbf').each((index, element) => {
        const link = $(element).find("a").attr('href')
        if(link && links.length < 1){
            links.push(link)
        }
    });
    return links
}

async function scrapeContent(url: string) {
    let user_agent = selectRandom();
    let header = {
        "User-Agent": `${user_agent}`
    }
    const res = await fetch(url, { // Node 18 or install node-fetch
        headers: header
    })
    const html = await res.text()
    const $ = cheerio.load(html);
    let text = ""
    $('p').each((index, element) => {
        const content = $(element).text();
        text += content + " "
      });
    return text
}

export async function generateContext(query: string) {
    let text = ""
    let links: string[] = []

    while(links.length == 0 || text.length == 0) {
        text = ""
        links = await getSearchLinks(query)
        for(const link of links) {
            const newText = await scrapeContent(link)
            text += newText + " "
        }
    }

    return text
}