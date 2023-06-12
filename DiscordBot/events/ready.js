import * as fs from 'fs';
import { getRandomInt } from '../utils/random.js';
import fetch from 'node-fetch';
import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';
import { youtubeEditor } from '../editor/youtubeEditor.js';
import { twitchEditor } from '../editor/twitchEditor.js';

export default function index(client) {
    console.log("C'est prêt !");
    client.user.setPresence({
        activities: [{
            name: "un bon travail c'est un bon boulot"
        }]
    })
    //DailyExecution(client)
    //setInterval(() => DailyExecution(client), 10000)
}

async function DailyExecution(client) {
    try {
        var json = fs.readFileSync("./data/" + "accounts.json", 'utf8');
        json = JSON.parse(json)
        var keys = Object.keys(json)
        
        var account = json[keys[getRandomInt(keys.length)]]

        var YoutubeChannel = undefined;
        var TwitchChannel = undefined;
        if (account.channelYoutube.length > 0)
            YoutubeChannel = account.channelYoutube[getRandomInt(account.channelYoutube.length)]
        if (account.channelTwitch.length > 0)
            TwitchChannel = account.channelTwitch[getRandomInt(account.channelTwitch.length)]
        if (!YoutubeChannel && !TwitchChannel)
            return;

        var youtubeID = await getRandomVideoYoutube(YoutubeChannel, account);
        if (!youtubeID)
            return;
        youtubeEditor(client, account, youtubeID)
        var twitchID = await getRandomVideoTwitch(TwitchChannel);
        if (!twitchID)
            return;
        twitchEditor(client, account, twitchID)
        console.log(youtubeID, twitchID)
    } catch (error) {
        console.log(error)
    }
}

const key = "AIzaSyCnw4WkPWxpZ3qW3jilfoj_TJ2WY1llETk";

async function getRandomVideoYoutube(channelURL, json) {
    if (!channelURL)
        return;
    try {
        const responseQuery = await fetch("https://www.googleapis.com/youtube/v3/search?part=id,snippet&type=channel&q=" + channelURL + "&key=" + key).then(res => res.json())
        if (responseQuery.pageInfo.totalResults <= 0)
            return undefined
        const idChannel = responseQuery.items[0].id.channelId
        const responseChannel = await fetch("https://www.googleapis.com/youtube/v3/channels?part=contentDetails&order=date&maxResults=50&id=" + idChannel + "&key=" + key).then(res => res.json())
        const idUpload = responseChannel.items[0].contentDetails.relatedPlaylists.uploads
        const responsePlaylist = await fetch("https://www.googleapis.com/youtube/v3/playlistItems?playlistId=" + idUpload + "&key=" + key + "&part=snippet&maxResults=50").then(res => res.json())
        const videos = responsePlaylist.items;
        var videoId = videos[getRandomInt(videos.length)].snippet.resourceId.videoId

        while (json.history.includes(videoId)) {
            videoId = videos[getRandomInt(videos.length)].snippet.resourceId.videoId
        }
        return videoId
    } catch (error) {
        console.log(error)
    }
    return undefined
}

async function getRandomVideoTwitch(channelURL) {
    if (!channelURL)
        return;
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
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
        await page.goto(channelURL + "/clips?filter=clips&range=7d");
        await setTimeout(4000);
        var urlArray = await page.evaluate(() => {
            var linksOld = document.querySelectorAll('[data-test-selector="content"]  a')
            var links = [];

            if (linksOld.length <= 0)
                return links;
            for (let i = 0; i < linksOld.length; i += 5) {
                links.push(linksOld[i].getAttribute("href"))
            }
            return links;
        })
        if (urlArray.length <= 0) {
            await browser.close();
            return undefined;
        }
        await browser.close();
        return urlArray[getRandomInt(urlArray.length)]
    } catch (error) {
        await browser.close();
        console.log(error)
    }
    return undefined;
}