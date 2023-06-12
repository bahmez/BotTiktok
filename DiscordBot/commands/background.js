import { SlashCommandBuilder } from "discord.js";
import { spawn } from "child_process";
import * as fs from 'fs';

const PATH = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\backgroundSaver\\index.js";
const PATH_BACKGROUND_DIR = "C:\\Users\\Administrator\\Documents\\FarmNetworkAccount\\Backgrounds\\";

const data = {
    data: new SlashCommandBuilder()
		.setName('background')
		.setDescription('La commande permet de faire des actions liées au background')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription("permet de rajouter un background")
				.addStringOption(option => 
					option
						.setName('nom')
						.setDescription("nom du background")
						.setRequired(true))
				.addStringOption(option => 
					option
						.setName('url')
						.setDescription("lien d'une vidéo ou un lien youtube")
						.setRequired(true))
				.addIntegerOption(option => 
					option
						.setName('début')
						.setDescription("en secondes"))
				.addIntegerOption(option => 
					option
						.setName('fin')
						.setDescription("en secondes")))
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription("permet d'enlever un background")
				.addStringOption(option => 
					option
						.setName('nom')
						.setDescription("nom du background")
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('list')
				.setDescription("permet d'avoir la list des backgrounds avec leur référence (vidéo youtube)")),
	async execute(interaction) {
		var sub = interaction.options.getSubcommand()
		if (!Object.keys(SubExecute).includes(sub))
			return await interaction.reply({content: "il y a une erreur sur la commande", ephemeral: true})
		SubExecute[sub](interaction)
	}
}

const SubExecute = {
	add: async (interaction) => {
		const name = interaction.options.getString("nom")
		const url = interaction.options.getString("url")
		const start = interaction.options.getInteger("début") ?? 0;
		const end = interaction.options.getInteger("fin") ?? null;

		var consoleText = "";
		var embed = {"embeds": [
			{
			  "type": "rich",
			  "title": "console - En cours...",
			  "description": "",
			  "color": 0xff0000
			}
		]}

		await interaction.reply(embed)
		const exec = spawn('node', [PATH, url, name, start, end])
		exec.stdout.on("data", async data => {
			consoleText += `stdout: ${data}`;
			embed.embeds[0].description = consoleText
			await interaction.editReply(embed);
		});
		
		exec.stderr.on("data", async data => {
			consoleText += `stderr: ${data}`;
			embed.embeds[0].description = consoleText
			await interaction.editReply(embed);
		});
		exec.on("close", async code => {
			console.log(`child process exited with code ${code}`);
			embed.embeds[0].title = "console - Exit " + code
			await interaction.editReply(embed);
		});
	},
	remove: async (interaction) => {
		const name = interaction.options.getString("nom")

		try {
			fs.rmSync(PATH_BACKGROUND_DIR + name, {recursive: true, force: true})
			var json = fs.readFileSync(PATH_BACKGROUND_DIR + "data.json", 'utf8');
        	json = JSON.parse(json);
        	delete json[name];
        	fs.writeFileSync(PATH_BACKGROUND_DIR + "data.json", JSON.stringify(json), 'utf8')
			await interaction.reply("✅ Suppression terminé")
		} catch (error) {
			console.error(error)
			await interaction.reply("❌] Erreur lors de la suppression")
		}
	},
	list: async (interaction) => {
		try {
			var json = fs.readFileSync(PATH_BACKGROUND_DIR + "data.json", 'utf8');
			json = JSON.parse(json)
			var response = "Liste des backgrounds :\n\n";
			var keys = Object.keys(json);
	
			for (let i = 0; i < keys.length; i++) {
				const element = json[keys[i]]
				response += "     🔸 " + keys[i] + " : " + element + "\n"
			}
			await interaction.reply(response)
		} catch (error) {
			console.log(error)
			await interaction.reply("❌ Erreur lors de l'affichage de la liste")
		}
	}
}

export default data