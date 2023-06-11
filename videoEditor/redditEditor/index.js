const jimp = require("jimp");
const fs = require("fs-extra");
const pathToFfmpeg = require("ffmpeg-static");
const util = require('util');
const fetch = (...args) => import('node-fetch').then(({
    default: fetch
}) => fetch(...args));
const puppeteer = require('puppeteer');
const { launch, getStream } = require("puppeteer-stream");
const { config, createAudioFromText } = require('tiktok-tts')
const getMP3Duration = require('get-mp3-duration');

const exec = util.promisify(require('child_process').exec);

const videoEncoder = 'h264';
var story;
const lang = process.argv[2];
const background = process.argv[3];
const outputFile = __dirname + '/output.mp4';

const title = process.argv[4];
const sessionID = process.argv[5];

const inputFolder = __dirname + '/temp/raw-frames';
const outputFolder = __dirname + '/temp/edited-frames';

const LITTLEWIDTH = 342;
const LITTLEHEIGHT = 608;

(async function () {
    try {
        try {
            fs.rmSync(__dirname + '/temp', {
                recursive: true,
                force: true
            });
        } catch (error) {}
        try {
            await fs.mkdir(__dirname + '/temp');
            await fs.mkdir(inputFolder);
            await fs.mkdir(outputFolder);
            await fs.mkdir(__dirname + '/temp/audio');
        } catch (error) {}
        story = fs.readFileSync(__dirname + "/story", 'utf8')
        console.log("Generating voice...")
        await CreateSpeechStory()
        console.log("Generating data...")
        const buffer = fs.readFileSync(__dirname + '/temp/audio_result.mp3')
        const duration = Math.round(getMP3Duration(buffer) / 1000)

        var FramesBackground = fs.readdirSync(background);
        var start = Math.round(Math.random() * ((FramesBackground.length - (duration * 30)) - 1) + 1);
        FramesBackground.sort(function(a, b) {
            let intA = Number.parseInt(a);
            let intB = Number.parseInt(b);
            return intA - intB;
        });

        console.log("total frames : " + (duration * 30));
        console.log("estimed time: " + fancyTimeFormat(duration * 15))
        console.log("creating a new video...")
        for (let frameCount = 0; frameCount < (duration * 30); frameCount++) {
            let frameBackground = await jimp.read(`${background}/${FramesBackground[start + frameCount]}`);

            var frame = await Editor(frameBackground);

            await frame.writeAsync(`${outputFolder}/${frameCount}.png`);
        }

        console.log("compilation...")
        await exec(`"${pathToFfmpeg}" -start_number 0 -framerate 30 -i ${outputFolder}/%d.png -vcodec ${videoEncoder} -pix_fmt yuv420p ${__dirname}/temp/no-audio.mp4`);

        try {
            await fs.rm(outputFile, { recursive: true, force: true });
            console.log("deleted last output file")
        } catch (error) {
        }
        await exec(`"${pathToFfmpeg}" -i ${__dirname}/temp/no-audio.mp4 -i ${__dirname}/temp/audio_result.mp3 -c copy -map 0:v:0 -map 1:a:0? ${outputFile}`);
    } catch (error) {
        console.log(error);
        process.exit(84);
    }
})();

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true)
        }, time)
    })
}

function fancyTimeFormat(duration) {
    // Hours, minutes and seconds
    var hrs = ~~(duration / 3600);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}

const langType = {
    "en": "en_us_001",
    "fr": "fr_002"
};

function splitMulti(str, tokens){
    var tempChar = tokens[0];
    for(var i = 1; i < tokens.length; i++){
        str = str.split(tokens[i]).join(tempChar);
    }
    str = str.split(tempChar);
    return str;
}

async function CreateSpeechStory() {
    var storyPart = splitMulti(story, [".", ":", "!", "?", ";", ",", "(", ")", "[", "]"])
    var concatArg = "concat:";

    config(sessionID);
    for (let i = 0; i < storyPart.length; i++) {
        if (storyPart[i].length > 400) {
            console.error("Story too long")
            process.exit(84)
        }
        if (storyPart[i].length === 0)
            continue;
        await createAudioFromText(encodeURIComponent(storyPart[i]), `${__dirname}/temp/audio/${i}`, langType[lang]);
        await sleep(500)
        if (i !== 0)
            concatArg += '|';   
        concatArg += __dirname + "/temp/audio/" + i + ".mp3";
    }
    await exec(`"${pathToFfmpeg}" -i "${concatArg}" -acodec copy ${__dirname}/temp/audio_result.mp3`);
}

async function createTextImage(text, color, font) {
    let textImage = new jimp(1000, 1000, 0x0);

    textImage.print(font, 0, 0, text);
    textImage.autocrop(0.0003, false);
    for (let y = 0; y < textImage.bitmap.height; y++) {
        for (let x = 0; x < textImage.bitmap.width; x++) {
            if (0x0 !== textImage.getPixelColor(x, y))
                textImage.setPixelColor(jimp.cssColorToHex(color), x, y);
        }
    }
    return textImage;
}

// Editor With big background
async function Editor(background) {
    const newImage = new jimp(1080, 1920, 'black');

    const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
    var text = await createTextImage(title, "white", font);
    text.scale(1.5);

    let sizeBackground = LITTLEWIDTH;
    background.crop((background.bitmap.width / 2) - (sizeBackground / 2), 0, sizeBackground, background.bitmap.height);
    background.resize(1080, jimp.AUTO);

    newImage.composite(background, 0, 0);
    newImage.composite(text, (newImage.bitmap.width / 2) - (text.bitmap.width / 2), (newImage.bitmap.height / 2) - LITTLEHEIGHT - 100);
    return newImage;
}