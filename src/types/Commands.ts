import Ryneczek from '@classes/Client';
import { Interaction } from 'discord.js';

export interface Command {
    run: (client: Ryneczek, interaction: Interaction) => void;
}