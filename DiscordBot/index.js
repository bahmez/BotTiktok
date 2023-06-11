import { Client, Collection, GatewayIntentBits } from "discord.js";
import { TOKEN } from "./config.js";
import * as fs from 'fs';
import CommandsRegister from "./CommandsRegister.js";

const client = new Client({ disableEveryone: true, intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

fs.readdir("./events/", (err, files) => {
    if(err) return console.error;
    files.forEach(async (file) => {
        if(!file.endsWith(".js")) return undefined
        const event = await import("./events/"+file)
        const eventName = file.split(".")[0]
        console.log("Evenement "+eventName+" est actif !")
        client.on(eventName, event.default.bind(event));
    });
});

fs.readdir("./commands/", async (err, files) => {
    if(err) return console.error;
    for (const file of files) {
        if(!file.endsWith(".js")) return undefined
        const command = (await import("./commands/"+file)).default;
        console.log("Commande "+command.data.name+" est actif !")
        client.commands.set(command.data.name, command);
    }
    CommandsRegister(client.commands);
});


client.login(TOKEN);
client.on("error", console.error);
client.on("warn", console.warn);