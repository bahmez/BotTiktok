import * as fs from 'fs';
import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';

export async function publishVideo(message, description, path, id) {
    const nameAccount = message.channel.name
    try {
        const videos = fs.readdirSync(path).filter(file => file.endsWith(".mp4"));

        var json = fs.readFileSync("./data/" + "accounts.json", 'utf8');
        json = JSON.parse(json)
        var account = json[nameAccount]

        if (!account) {
            return await message.reply("❌ aucun compte est relié au channel")
        }
        if (videos.length <= 0) {
            return await message.reply("❌ Erreur aucune vidéo a été crée")
        }
        for (let i = 0; i < videos.length; i++) {
            if (!await addVideoToTiktok(account.token, path + "/" + videos[i], description)) {
                message.reply("❌ Erreur lors de la publication de la vidéo [côté puppeteer]")
            }
        }
    } catch (error) {
        message.reply("❌ Erreur lors de la publication de la vidéo")
        console.log(error)
    }
    try {
        var json = fs.readFileSync("./data/" + "accounts.json", 'utf8');
        json = JSON.parse(json)
        json[nameAccount].history.push(id)
        fs.writeFileSync("./data/" + "accounts.json", JSON.stringify(json), 'utf8')
    } catch (error) {
        message.reply("❌ Erreur lors de l'enregistrement des informations")
        console.log(error)
    }
    message.reply({"embeds": [
        {
          "type": "rich",
          "url": "",
          "title": "c'est fait !",
          "description": "La vidéo vient d'être postée sur le compte " + nameAccount,
          "color": 0x5cbd57
        }
    ]})
}

async function addVideoToTiktok(token, pathVideo, description) {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: false,
        args: [
            `--window-size=1920,1080`,
            '--no-sandbox',
            'disable-infobars',
            '--disable-notifications',
            '--enable-javascript',
            "--mute-audio",
            "--autoplay-policy=no-user-gesture-required",
            '--disable-web-security', 
            '--disable-features=IsolateOrigins,site-per-process'
        ],
        ignoreDefaultArgs: ["--disable-extensions"]
    });
    try {
        const page = await browser.newPage();
        await page.setViewport({
            width: 1800,
            height: 2500
        });
        console.log(token)
        const cookies = [
            {
                "domain": ".tiktok.com",
                "expirationDate": 1674838429.758005,
                "hostOnly": false,
                "httpOnly": true,
                "name": "sid_tt",
                "path": "/",
                "sameSite": "unspecified",
                "secure": false,
                "session": false,
                "storeId": "0",
                "value": token,
                "id": 17
            }
        ]
        await page.setCookie(...cookies);
        await setTimeout(1000);
        await page.goto("https://www.tiktok.com/upload?lang=fr");
        await setTimeout(10000);
        var elementHandle = await page.$(
            'iframe',
        );
        var frame = await elementHandle.contentFrame();
        await setTimeout(1000)
        var inputfile = await frame.$("input[type=file]")
        await inputfile.uploadFile(pathVideo)
        await setTimeout(30000);
        await frame.click(".DraftEditor-editorContainer span > span")
        await setTimeout(1000);
        await page.keyboard.down('ControlLeft')
        await page.keyboard.press('KeyA')
        await page.keyboard.press('KeyC');
        await page.keyboard.up('ControlLeft')
        await setTimeout(500);
        await page.keyboard.press('Backspace');
        await setTimeout(500);
        await page.keyboard.type(description);
        await setTimeout(1000);
        await frame.click(".btn-post")
        await setTimeout(30000);
        await browser.close();
    } catch (error) {
        await browser.close();
        console.log(error)
        return false;
    }
    return true;
}