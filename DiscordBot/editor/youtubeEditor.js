import { ActionRowBuilder, ModalBuilder, TextInputBuilder } from '@discordjs/builders';
import { TextInputStyle } from 'discord.js';
import fetch from 'node-fetch';
import { getRandomInt } from '../utils/random.js';
import { spawn } from "child_process";
import * as fs from 'fs';
import { publishVideo } from './tiktokPublisher.js';

const key = "AIzaSyCnw4WkPWxpZ3qW3jilfoj_TJ2WY1llETk";

export async function youtubeEditor(client, account, id) {
    var textChannel = await client.channels.fetch(account.ChannelId)
    var dataVideo = await getVideoData(id);
    var timeVideo = await convertISO8601Duration(dataVideo.contentDetails.duration);

    textChannel.send({
        "content": `@ pas de everyone`,
        "components": [
          {
            "type": 1,
            "components": [
              {
                "style": 1,
                "label": `Valider la vidéo`,
                "custom_id": "yt.enable." + id,
                "disabled": false,
                "type": 2
              },
              {
                "style": 4,
                "label": `Refuser la vidéo`,
                "custom_id": "yt.disable." + id,
                "disabled": false,
                "type": 2
              }
            ]
          }
        ],
        "embeds": [
          {
            "type": "rich",
            "title": `Youtube Editeur`,
            "description": `Demande de validation`,
            "color": 0xff1500,
            "fields": [
              {
                "name": `type de la vidéo`,
                "value": (timeVideo > 120) ? "2" : "1"
              },
              {
                "name": `lien de la vidéo`,
                "value": "[lien de la vidéo](https://www.youtube.com/watch?v=" + id + ")"
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

export async function handleReponseYoutube(interaction, data) {
    if (data[1] === "disable") {
        return interaction.message.delete();
    }

    var id = [...data];
    id.splice(0, 2)
    id = id.join(".")

    var dataVideo = await getVideoData(id);
    var timeVideo = await convertISO8601Duration(dataVideo.contentDetails.duration);

    data.splice(1, 0, (timeVideo > 120) ? "2" : "1");

    const modal = new ModalBuilder()
        .setCustomId(data.join("."))
        .setTitle('Création de la vidéo');
    const title = new TextInputBuilder()
        .setCustomId('title')
        .setLabel("Le titre de la vidéo")
        .setStyle(TextInputStyle.Short)
        .setValue(dataVideo.snippet.title)
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
    
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);

    await interaction.showModal(modal);
}

const PATH_VIDEO_CLIP = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\videoEditor\\clipEditor\\";
const PATH_VIDEO_VIDEO = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\videoEditor\\youtubeEditor\\";
const PATH_CLIP = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\videoEditor\\clipEditor\\index.js";
const PATH_VIDEO = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\videoEditor\\youtubeEditor\\index.js";
const PATH_BACKGROUND_DIR = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\Backgrounds\\";

export async function onSubmitFormYoutube(interaction, data) {
    const title = interaction.fields.getTextInputValue("title")
    const description = interaction.fields.getTextInputValue("description")
    const type = interaction.fields.getTextInputValue("typeBackground")

    var id = [...data];
    id.splice(0, 3)
    id = id.join(".")

    var embed = {"embeds": [
        {
          "type": "rich",
          "url": "https://www.youtube.com/watch?v=" + id,
          "title": "console [" + data.join(".") + "] - En cours...",
          "description": "",
          "color": 0xff0000
        }
    ]}
    await interaction.reply({ content: 'Démarrage du programme...'})
    interaction.message.delete();
    const message = await interaction.message.reply(embed)
    await interaction.deleteReply()
    var consoleText = "";

    const backgrounds = fs.readdirSync(PATH_BACKGROUND_DIR);
    backgrounds.splice(backgrounds.indexOf("data.json"), 1);

    var args = [(data[2] == 1) ? PATH_CLIP : PATH_VIDEO, type,
        "https://www.youtube.com/watch?v=" + id,
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
            publishVideo(message, description, (data[2] == 1) ? PATH_VIDEO_CLIP : PATH_VIDEO_VIDEO, id)
        }
    });
}

async function getVideoData(id) {
    try {
        const responseQuery = await fetch("https://www.googleapis.com/youtube/v3/videos?id=" + id + "&part=contentDetails,snippet&key=" + key).then(res => res.json())
        return responseQuery.items[0]
    } catch (error) {
        console.log(error)
    }
}

function convertISO8601Duration(duration) {
    var iso8601DurationRegex = /(-)?P(?:([.,\d]+)Y)?(?:([.,\d]+)M)?(?:([.,\d]+)W)?(?:([.,\d]+)D)?T(?:([.,\d]+)H)?(?:([.,\d]+)M)?(?:([.,\d]+)S)?/;
    var matches = duration.match(iso8601DurationRegex);
    var data = {
        sign: matches[1] === undefined ? '+' : '-',
        years: matches[2] === undefined ? 0 : matches[2],
        months: matches[3] === undefined ? 0 : matches[3],
        weeks: matches[4] === undefined ? 0 : matches[4],
        days: matches[5] === undefined ? 0 : matches[5],
        hours: matches[6] === undefined ? 0 : matches[6],
        minutes: matches[7] === undefined ? 0 : matches[7],
        seconds: matches[8] === undefined ? 0 : matches[8]
    };
    var seconds = (data.hours * 60 * 60) + (data.minutes * 60) + data.seconds

    return seconds;
}