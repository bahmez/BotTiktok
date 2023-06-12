import { info } from "console";
import { SlashCommandBuilder } from "discord.js";
import { setTimeout } from 'timers/promises';
import puppeteer from 'puppeteer';

async function getAccountInformation(name) {
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
        await page.goto("https://www.tiktok.com/" + name);
        await setTimeout(5000);
        var subscription = await page.evaluate(() => {
			return document.querySelector(".tiktok-1kd69nj-DivNumber:nth-child(1) strong").innerText;
		})
		var followers = await page.evaluate(() => {
			return document.querySelector(".tiktok-1kd69nj-DivNumber:nth-child(2) strong").innerText;
		})
		var likes = await page.evaluate(() => {
			return document.querySelector(".tiktok-1kd69nj-DivNumber:nth-child(3) strong").innerText;
		})
		var title = await page.evaluate(() => {
			return document.querySelector(".tiktok-arkop9-H2ShareTitle").innerText;
		})
		var description = await page.evaluate(() => {
			return document.querySelector(".tiktok-1n8z9r7-H2ShareDesc").innerText;
		})
		var profile = await page.evaluate(() => {
			return document.querySelector("#main-content-others_homepage .tiktok-gcksof-SpanAvatarContainer-StyledAvatar .tiktok-1zpj2q-ImgAvatar").getAttribute("src");
		})
		var videos = await page.evaluate(() => {
			const shorts = document.querySelectorAll(".tiktok-yvmafn-DivVideoFeedV2 > div");
			const results = [];

			for (let i = 0; i < shorts.length; i++) {
				const short = shorts[i];
				let result = {};
				result["title"] = short.querySelector(".tiktok-j2a19r-SpanText").innerText;
				//result["image"] = short.querySelector(".tiktok-1itcwxg-ImgPoster").getAttribute("src");
				result["views"] = short.querySelector(".video-count").innerText;
				results.push(result);
			}
			return results;
		})
        await browser.close();
        return {
			link: "https://www.tiktok.com/" + name,
			subscription,
			followers,
			likes,
			profile,
			videos,
			description,
			title
		};
    } catch (error) {
        await browser.close();
        console.log(error)
		throw "error";
    }
}

const data = {
    data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription("Permet de voir les informations d'un compte tiktok")
		.addStringOption(option => 
			option
				.setName('nom')
				.setDescription("nom du compte")
				.setRequired(true)),
	async execute(interaction) {
		const name = interaction.options.getString("nom")

		var embed = {"embeds": [
			{
			  "type": "rich",
			  "title": "Chargement des informations en cours",
			  "description": "",
			  "color": 0xff0000
			}
		]}
		await interaction.reply(embed)
		let information = {};
		try {
			information = await getAccountInformation(name);
		} catch (error) {
			console.log(error);
			return interaction.editReply("❌ Erreur lors du chargement des informations")
		}
		interaction.editReply({
			"embeds": [
			  {
				"type": "rich",
				"title": information["title"],
				"description": information["description"],
				"color": 0x00FFFF,
				"fields": [
				  {
					"name": `followers`,
					"value": information["followers"],
					"inline": true
				  },
				  {
					"name": `subscription`,
					"value": information["subscription"],
					"inline": true
				  },
				  {
					"name": `Likes`,
					"value": information["likes"],
					"inline": true
				  }
				],
				"thumbnail": {
				  "url": information["profile"],
				  "height": 0,
				  "width": 0
				},
				"url": information["link"]
			  }
			]
		})
		for (let i = 0; i < information["videos"].length; i++) {
			if (i >= 10)
				break;
			let video = information["videos"][i];
			await interaction.channel.send({
				"embeds": [
				  {
					"type": "rich",
					"title": video["title"],
					"description": "",
					"color": 0xff0000,
					"fields": [
					  {
						"name": `views`,
						"value": video["views"]
					  }
					],
					"thumbnail": {
					  "url": video["image"],
					  "height": 0,
					  "width": 0
					}
				  }
				]
			  })
		}
	}
}

export default data