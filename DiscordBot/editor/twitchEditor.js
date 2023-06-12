import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import { TextInputStyle } from 'discord.js';
import { getRandomInt } from '../utils/random.js';
import { spawn } from "child_process";
import * as fs from 'fs';
import puppeteer from 'puppeteer';
import { setTimeout } from 'timers/promises';
import { publishVideo } from './tiktokPublisher.js';

const key = "AIzaSyCnw4WkPWxpZ3qW3jilfoj_TJ2WY1llETk";

export async function twitchEditor(client, account, id) {
    var textChannel = await client.channels.fetch(account.ChannelId)

    textChannel.send({
        "content": `@ pas de everyone\n` + id,
        "components": [
          {
            "type": 1,
            "components": [
              {
                "style": 1,
                "label": `Valider la vidéo`,
                "custom_id": "twitch.enable",
                "disabled": false,
                "type": 2
              },
              {
                "style": 4,
                "label": `Refuser la vidéo`,
                "custom_id": "twitch.disable",
                "disabled": false,
                "type": 2
              }
            ]
          }
        ],
        "embeds": [
          {
            "type": "rich",
            "title": `Twitch Editeur`,
            "description": `Demande de validation`,
            "color": 0xff1500,
            "fields": [
              {
                "name": `lien de la vidéo`,
                "value": "[lien de la vidéo](https://www.twitch.tv" + id + ")"
              },
              {
                "name": `La vidéo a déjà était publié ?`,
                "value": (account.history.includes(id)) ? "oui" : "non"
              }
            ]
          }
        ]
      })
}

export async function handleReponseTwitch(interaction, data) {
    if (data[1] === "disable") {
        return interaction.message.delete();
    }
    const id = interaction.message.content.split("\n")[1];
    
    if (data.length <= 0) {
        await interaction.reply("❌ Erreur lors de la création de la vidéo")
        return interaction.message.delete();
    }

    const modal = new ModalBuilder()
        .setCustomId(data.join("."))
        .setTitle('Création de la vidéo');
    const idInput = new TextInputBuilder()
        .setCustomId('id')
        .setLabel("id de la vidéo [FAUT PAS TOUCHER]")
        .setStyle(TextInputStyle.Short)
        .setValue(id)
        .setRequired(true);
    const title = new TextInputBuilder()
        .setCustomId('title')
        .setLabel("Le titre de la vidéo")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const description = new TextInputBuilder()
        .setCustomId('description')
        .setLabel("Description de la vidéo")
        .setRequired(true)
        .setStyle(TextInputStyle.Paragraph);
    const typeBackground = new TextInputBuilder()
        .setCustomId('typeBackground')
        .setLabel("type de background")
        .setRequired(true)
        .setStyle(TextInputStyle.Short);

    const firstActionRow = new ActionRowBuilder().addComponents(title);
    const secondActionRow = new ActionRowBuilder().addComponents(description);
    const thirdActionRow = new ActionRowBuilder().addComponents(typeBackground);
    const fouthActionRow = new ActionRowBuilder().addComponents(idInput);
    
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fouthActionRow);

    await interaction.showModal(modal);
}

const PATH_VIDEO_CLIP = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\videoEditor\\clipEditor";
const PATH_CLIP = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\videoEditor\\clipEditor\\index.js";
const PATH_BACKGROUND_DIR = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\Backgrounds\\";

export async function onSubmitFormTwitch(interaction, data) {
    const title = interaction.fields.getTextInputValue("title")
    const description = interaction.fields.getTextInputValue("description")
    const type = interaction.fields.getTextInputValue("typeBackground")
    const id = interaction.fields.getTextInputValue("id")

    await interaction.reply({ content: 'Démarrage du programme...'})
    interaction.message.delete();
    const video = await getDataVideo("https://www.twitch.tv" + id);
    
    if (video.length <= 0) {
        return await interaction.reply("❌ Erreur lors de la création de la vidéo")
    }

    var embed = {"embeds": [
        {
          "type": "rich",
          "url": "https://www.twitch.tv" + id,
          "title": "console [" + data.join(".") + "] - En cours...",
          "description": "",
          "color": 0xff0000
        }
    ]}
    const message = await interaction.message.channel.send(embed)
    await interaction.deleteReply()
    var consoleText = "";

    const backgrounds = fs.readdirSync(PATH_BACKGROUND_DIR);
    backgrounds.splice(backgrounds.indexOf("data.json"), 1);

    var args = [PATH_CLIP, type,
        video[0],
        PATH_BACKGROUND_DIR + "/" + backgrounds[getRandomInt(backgrounds.length)],
        title
    ]
    const exec = spawn('node', args)
    exec.stdout.on("data", async data => {
        consoleText += `stdout: ${data}`;
        embed.embeds[0].description = consoleText
        await message.edit(embed);
    });
    
    exec.stderr.on("data", async data => {
        consoleText += `stderr: ${data}`;
        embed.embeds[0].description = consoleText
        await message.edit(embed);
    });
    exec.on("close", async code => {
        console.log(`child process exited with code ${code}`);
        embed.embeds[0].title = "console - Exit " + code
        await message.edit(embed);
        if (code === 0) {
            publishVideo(message, description, PATH_VIDEO_CLIP, id)
        }
    });
}

async function getDataVideo(url) {
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
        await page.goto(url);
        await setTimeout(10000);
        var video = await page.evaluate(() => {
            return document.querySelector('video').getAttribute("src")
        });
        var title = await page.evaluate(() => {
            return document.querySelector('[data-a-target="stream-title"]').innerHTML
        });
        await browser.close();
        return [video, title]
    } catch (error) {
        await browser.close();
        console.log(error)
    }
    return [];
}