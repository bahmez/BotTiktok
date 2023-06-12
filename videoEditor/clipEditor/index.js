const jimp = require("jimp");
const fs = require("fs-extra");
const pathToFfmpeg = require("ffmpeg-static");
const util = require('util');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const exec = util.promisify( require('child_process').exec);

const videoEncoder = 'h264';
var inputFile = process.argv[3];
const type = parseInt(process.argv[2]);
const background = process.argv[4];
const outputFile = __dirname + '/output.mp4';

const title = process.argv[5];

const inputFolder = __dirname + '/temp/raw-frames';
const outputFolder = __dirname + '/temp/edited-frames';

const LITTLEWIDTH = 342;
const LITTLEHEIGHT = 608;

const FPS_FILE = __dirname + '/temp/fps.mp4';

(async function() {
    try {
        if (type > 2 || type < 0) {
            console.error("bad type");
            process.exit(84);
        }
        if (inputFile.includes("youtube.com"))
            inputFile = await convertYoutubeUrl(inputFile);

        try {
            fs.rmSync(__dirname + '/temp', { recursive: true, force: true });
        } catch (error) {
        }
        try {
            await fs.mkdir(__dirname + '/temp');
            await fs.mkdir(inputFolder);
            await fs.mkdir(outputFolder);
        } catch (error) {
        }

        console.log("convert video to 30fps");
        await exec(`"${pathToFfmpeg}" -i "${inputFile}" -r 30 ${FPS_FILE}`);

        console.log("reading video...")
        await exec(`"${pathToFfmpeg}" -i "${FPS_FILE}" -vf scale=1080:-1 ${inputFolder}/%d.png`);

        const FramesVideo = fs.readdirSync(inputFolder);
        var FramesBackground = null;
        var start = 0;

        if (type != 0) {
            FramesBackground = fs.readdirSync(background);
            start = Math.round(Math.random() * ((FramesBackground.length - FramesVideo.length) - 1) + 1);
            FramesBackground.sort(function(a, b) {
                let intA = Number.parseInt(a);
                let intB = Number.parseInt(b);
                return intA - intB;
            });
        }
        FramesVideo.sort(function(a, b) {
            let intA = Number.parseInt(a);
            let intB = Number.parseInt(b);
            return intA - intB;
        });

        console.log("total frames : " + FramesVideo.length);
        console.log("estimed time: " + fancyTimeFormat(FramesVideo.length / 2))
        console.log("creating a new video...")
        for (let frameCount = 0; frameCount < FramesVideo.length; frameCount++) {
            let frameVideo = await jimp.read(`${inputFolder}/${FramesVideo[Math.floor(frameCount)]}`);
            let frameBackground;
            if (type != 0)
                frameBackground = await jimp.read(`${background}/${FramesBackground[start + Math.floor(frameCount)]}`);

            const functionEditor = [Editor1, Editor2, Editor3];
            var frame = await functionEditor[type](frameVideo, frameBackground);

            await frame.writeAsync(`${outputFolder}/${frameCount}.png`);
        }

        console.log("compilation...")
        await exec(`"${pathToFfmpeg}" -start_number 0 -framerate 30 -i ${outputFolder}/%d.png -vcodec ${videoEncoder} -pix_fmt yuv420p ${__dirname}/temp/no-audio.mp4`);

        try {
            await fs.rm(outputFile, { recursive: true, force: true });
            console.log("deleted last output file")
        } catch (error) {
        }
        await exec(`"${pathToFfmpeg}" -i ${__dirname}/temp/no-audio.mp4 -i "${FPS_FILE}" -c copy -map 0:v:0 -map 1:a:0? ${outputFile}`);
    } catch (error) {
        console.log(error);
        process.exit(84);
    }
})();

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

async function convertYoutubeUrl(url) {
    let info = await ytdl.getInfo(url);
    let format = ytdl.chooseFormat(info.formats, { quality: 'highest', container: 'mp4' });
    return format.url;
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

// Editor Without background
async function Editor1(frame) {
    const newImage = new jimp(1080, 1920, 'black');

    const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
    var text = await createTextImage(title, "white", font);
    text.scale(1.5);
    
    newImage.composite(text, (newImage.bitmap.width / 2) - (text.bitmap.width / 2), (newImage.bitmap.height / 2) - LITTLEHEIGHT - 100);
    newImage.composite(frame, 0, (newImage.bitmap.height / 2) - (frame.bitmap.height / 2));
    return newImage;
}

// Editor With medium background
async function Editor2(frame, background) {
    const newImage = new jimp(1080, 1920, 'black');

    let sizeBackground = 700;
    background.crop((background.bitmap.width / 2) - (sizeBackground / 2), 0, sizeBackground, background.bitmap.height);
    background.resize(1080, jimp.AUTO);

    const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
    var text = await createTextImage(title, "white", font);
    text.scale(1.5);
    
    newImage.composite(text, (newImage.bitmap.width / 2) - (text.bitmap.width / 2), 50);
    newImage.composite(frame, 0, 200);
    newImage.composite(background, 0, 200 + frame.bitmap.height);
    return newImage;
}

// Editor With big background
async function Editor3(frame, background) {
    const newImage = new jimp(1080, 1920, 'black');

    const font = await jimp.loadFont(jimp.FONT_SANS_64_WHITE);
    var text = await createTextImage(title, "white", font);
    text.scale(1.5);
    
    let sizeBackground = LITTLEWIDTH;
    background.crop((background.bitmap.width / 2) - (sizeBackground / 2), 0, sizeBackground, background.bitmap.height);
    background.resize(1080, jimp.AUTO);
    
    newImage.composite(background, 0, 0);
    newImage.composite(text, (newImage.bitmap.width / 2) - (text.bitmap.width / 2), (newImage.bitmap.height / 2) - LITTLEHEIGHT - 100);
    newImage.composite(frame, 0, (newImage.bitmap.height / 2) - (frame.bitmap.height / 2));
    return newImage;
}