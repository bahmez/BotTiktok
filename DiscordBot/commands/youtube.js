import { SlashCommandBuilder } from "discord.js";
import * as fs from 'fs';
import { youtubeEditor } from "../editor/youtubeEditor.js";

const data = {
    data: new SlashCommandBuilder()
		.setName('youtube')
		.setDescription('La commande permet de faire des actions liées à youtube')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription("permet de rajouter une chaîne à suivre ou une vidéo à ajouter sur le compte tiktok")
				.addStringOption(option => 
					option
						.setName('type')
						.setDescription("Le type de la vidéo")
						.setRequired(true)
						.addChoices(
							{ name: 'Chaîne youtube', value: 'channel' },
							{ name: 'Vidéo youtube', value: 'video' }
						))
				.addStringOption(option => 
					option
						.setName('nom')
						.setDescription("nom du compte")
						.setRequired(true))
				.addStringOption(option => 
					option
						.setName('url')
						.setDescription("le lien de la vidéo ou de la chaîne")
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('remove')
				.setDescription("propose la liste des chaînes/places suivi et on a juste à selectionner le quel on veut supprimer")),
	async execute(interaction) {
		var sub = interaction.options.getSubcommand()
		if (!Object.keys(SubExecute).includes(sub))
			return await interaction.reply({content: "il y a une erreur sur la commande", ephemeral: true})
		SubExecute[sub](interaction)
	}
}

const SubExecute = {
	add: async (interaction) => {
		const type = interaction.options.getString("type")
		const url = interaction.options.getString("url")
		const name = interaction.options.getString("nom")

		try {
			var json = fs.readFileSync("./data/" + "accounts.json", 'utf8');
			json = JSON.parse(json)
			if (!Object.keys(json).includes(name))
				return await interaction.reply("❌ Erreur le compte tiktok n'existe pas")
			if (type === "channel") {
				json[name].channelYoutube.push(url);
				fs.writeFileSync("./data/" + "accounts.json", JSON.stringify(json), 'utf8')
				await interaction.reply("✅ chaîne youtube ajouté sur le compte tiktok")
			} else {
        		var account = json[name]

				if (!account)
					return await interaction.reply("❌ Erreur le compte tiktok n'existe pas")
				youtubeEditor(interaction.client, account, url)
				await interaction.reply("✅ Lancement de demande")
			}
		} catch (error) {
			console.log(error)
			await interaction.reply("❌ Erreur lors de l'ajout")
		}
	},
	remove: async (interaction) => {

	}
}

export default data