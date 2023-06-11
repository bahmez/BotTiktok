import { ChannelType, SlashCommandBuilder } from "discord.js";
import * as fs from 'fs';

const data = {
    data: new SlashCommandBuilder()
		.setName('account')
		.setDescription('La commande permet de faire des actions liées au compte')
		.addSubcommand(subcommand =>
			subcommand
				.setName('add')
				.setDescription(" permet de rajouter un compte tiktok au bot")
				.addStringOption(option => 
					option
						.setName('nom')
						.setDescription("nom du compte")
						.setRequired(true))
				.addStringOption(option => 
					option
						.setName('token')
						.setDescription("le token de connexion du compte tiktok")
						.setRequired(true))),
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
		const token = interaction.options.getString("token")

		try {
			var channel = await interaction.guild.channels.create({
				"name": name,
				type: ChannelType.GuildText
			})
			channel.setParent("1045704458283266148")
			var json = fs.readFileSync("./data/" + "accounts.json", 'utf8');
			json = JSON.parse(json)
			json[name] = {token, channelYoutube: [], channelTwitch: [], ChannelId: channel.id, history: []};
			fs.writeFileSync("./data/" + "accounts.json", JSON.stringify(json), 'utf8')
			await interaction.reply("✅ compte ajouté")
		} catch (error) {
			console.log(error)
			await interaction.reply("❌ Erreur lors de l'ajout")
		}
	}
}

export default data