const jimp = require("jimp");
const fs = require("fs-extra");
const pathToFfmpeg = require("ffmpeg-static");
const util = require('util');
const ytdl = require("ytdl-core");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const exec = util.promisify( require('child_process').exec);

const videoEncoder = 'libx264';
const input = process.argv[2];
const name = process.argv[3];

var startSeconds = parseInt(process.argv[4]);
var endSeconds = parseInt(process.argv[5]);

const FPS_FILE = __dirname + '\\temp\\fps.mp4';

const BACKGROUND_PATH = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\Backgrounds\\";

var url;

(async function() {
    try {
        if (input.includes("youtube.com"))
            url = await convertYoutubeUrl(input);
        else {
            console.error("bad url")
            process.exit(84)
        }
        if (endSeconds - startSeconds <= 0) {
            console.error("bad time")
            process.exit(84)
        }

        fs.rmSync(BACKGROUND_PATH + name, { recursive: true, force: true });
        fs.rmSync(__dirname + '/temp', { recursive: true, force: true });
        try {
            await fs.mkdir(__dirname + '/temp');
        } catch (error) {
        }

        console.log("convert video to 30fps");
        await exec(`"${pathToFfmpeg}" -i "${url}" -r 30 ${FPS_FILE}`);

        console.log("saving video...")
        await fs.mkdir(BACKGROUND_PATH + name)
        await exec(`"${pathToFfmpeg}" -i "${FPS_FILE}" -vf scale=1080:-1 ${BACKGROUND_PATH + name}/%d.png`);

        const Frames = fs.readdirSync(BACKGROUND_PATH + name);
        Frames.sort(function(a, b) {
            let intA = Number.parseInt(a);
            let intB = Number.parseInt(b);
            return intA - intB;
        });

        console.log("reducing frames...");
        if (startSeconds == NaN && endSeconds == NaN)
            process.exit(84)

        startSeconds = (startSeconds == NaN) ? 0 : startSeconds * 30;
        endSeconds = (endSeconds == NaN) ? Frames.length : endSeconds * 30;

        for (let i = 1; i <= startSeconds && i < Frames.length; i++) {
            fs.rmSync(BACKGROUND_PATH + name + "/" + i + ".png", { recursive: true, force: true });
        }
        for (let i = endSeconds; i <= Frames.length; i++) {
            fs.rmSync(BACKGROUND_PATH + name + "/" + i + ".png", { recursive: true, force: true });
        }

        console.log("saving data...");
        var json = fs.readFileSync(BACKGROUND_PATH + "data.json", 'utf8');
        json = JSON.parse(json);
        json[name] = input;
        fs.writeFileSync(BACKGROUND_PATH + "data.json", JSON.stringify(json), 'utf8')
    } catch (error) {
        console.log(error);
    }
})();

async function convertYoutubeUrl(url) {
    let info = await ytdl.getInfo(url);
    let format = ytdl.chooseFormat(info.formats, { quality: 'highest', container: 'mp4' });
    return format.url;
}