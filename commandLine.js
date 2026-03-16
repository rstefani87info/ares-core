/**
 * @author Roberto Stefani
 * @license MIT
 */
import * as readline from 'node:readline';

export default function aReSInitialize(aReS) {
    aReS.initCommandLine=(commandLineSettings, fileUtilities)=>init(aReS, commandLineSettings, fileUtilities);
}

/**
 * Initializes the command line interface.
 * @param {object} aReS - The aReS framework instance.
 * @param {object} commandLineSettings - The settings and functions for the command line.
 * @param {object} fileUtilities - Utilities for file handling.
 */
export function init(aReS, commandLineSettings, fileUtilities) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log("Command Line Interface initialized. Type 'help' for available commands.");

    rl.on('line', (line) => {
        const args = line.trim().split(/\s+/);
        const command = args[0];

        if (command === 'exit') {
            rl.close();
            process.exit(0);
        } else if (command === 'help') {
            console.log("Available commands:");
            console.log("  exit - Exit the application");
            console.log("  help - Show this help message");
            if (commandLineSettings) {
                Object.keys(commandLineSettings).forEach(key => {
                     if (typeof commandLineSettings[key] === 'function') {
                         console.log(`  ${key} - Execute ${key}`);
                     }
                });
            }
        } else if (commandLineSettings && typeof commandLineSettings[command] === 'function') {
            try {
                // Pass aReS and remaining arguments to the command function
                const result = commandLineSettings[command](aReS, ...args.slice(1));
                if (result !== undefined) {
                    console.log(result);
                }
            } catch (error) {
                console.error(`Error executing command '${command}':`, error.message);
            }
        } else if (command) {
            console.log(`Unknown command: '${command}'. Type 'help' for available commands.`);
        }
        
        rl.prompt();
    });

    rl.prompt();
}
