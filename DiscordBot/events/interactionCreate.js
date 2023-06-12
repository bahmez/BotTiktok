import { handleReponseReddit, onSubmitFormReddit } from "../editor/redditEditor.js";
import { handleReponseTwitch, onSubmitFormTwitch } from "../editor/twitchEditor.js";
import { handleReponseYoutube, onSubmitFormYoutube } from "../editor/youtubeEditor.js";

export default async function index(interaction) {
    Executor.forEach((exec) => {
        if (exec.condition(interaction))
            exec.function(interaction)
    })
}

const Executor = [
    {
        condition: (interaction) => interaction.isChatInputCommand(),
        function: async (interaction) => {
            const command = interaction.client.commands.get(interaction.commandName);
    
            if (!command) return;
        
            try {
                await command.execute(interaction)
            } catch (error) {
                console.error(error);
                await interaction.reply({content: "il y a une erreur sur la commande", ephemeral: true})
            }
        }
    },
    {
        condition: (interaction) => interaction.isButton(),
        function: async (interaction) => {
            var data = interaction.customId.split(".")
            const idExecutor = {"yt": handleReponseYoutube, "twitch": handleReponseTwitch, "reddit": handleReponseReddit}

            idExecutor[data[0]](interaction, data)
        }
    },
    {
        condition: (interaction) => interaction.isModalSubmit(),
        function: async (interaction) => {
            var data = interaction.customId.split(".")
            const idExecutor = {"yt": onSubmitFormYoutube, "twitch": onSubmitFormTwitch, "reddit": onSubmitFormReddit}

            idExecutor[data[0]](interaction, data)
        }
    }
]
