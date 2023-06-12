import { REST, Routes }from 'discord.js';
import { TOKEN, CLIENTID } from './config.js';

const rest = new REST({ version: '10' }).setToken(TOKEN);

export default async function index(commandsCollection) {
    var commands = []

	for (const command of commandsCollection.values()) {
        commands.push(command.data.toJSON())
    }

	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(
			Routes.applicationCommands(CLIENTID),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
}