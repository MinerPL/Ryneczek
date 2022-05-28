import Ryneczek from '@classes/Ryneczek';
import { Interaction } from 'discord.js';

export interface Command {
    run: (client: Ryneczek, interaction: Interaction) => void;
}