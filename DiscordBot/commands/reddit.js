import { SlashCommandBuilder } from "discord.js";
import { redditEditor } from "../editor/redditEditor.js";
import * as fs from 'fs';

const data = {
    data: new SlashCommandBuilder()
		.setName('reddit')
		.setDescription('La commande permet de faire des actions liées à reddit')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription("permet de rajouter une vidéo ou une story à ajouter ou une place à suivre")
				.addStringOption(option => 
					option
						.setName('nom')
						.setDescription("nom du compte")
						.setRequired(true))
				.addStringOption(option => 
					option
						.setName('type')
						.setDescription("Le type de la vidéo")
						.setRequired(true)
						.addChoices(
							{ name: 'Histoire reddit', value: 'channel' },
							{ name: 'Vidéo reddit', value: 'video' }
						))
				.addStringOption(option => 
					option
						.setName('url')
						.setDescription("le lien de l'histoire, vidéo ou de la chaîne")
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
			if (type === "video") {
				return await interaction.reply("❌ les vidéos reddit sont pas encore prit en compte")
			} else {
        		var account = json[name]

				if (!account)
					return await interaction.reply("❌ Erreur le compte tiktok n'existe pas")
				redditEditor(interaction.client, account, url)
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