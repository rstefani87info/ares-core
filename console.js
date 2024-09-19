/**
 * @author Roberto Stefani
 * @license MIT
 */

/**
 * Async console: collect logs for showing them in a second later, all together, in the console when the process closes. Useful for showing logs of an asynchronous process.
 */
export const asyncConsole={
    map:{},
    log:(name,msg)=>{
        asyncConsole.map[name]=asyncConsole.map[name]??[];
        asyncConsole.map[name].push(msg);
    },
    output:(...names)=>{
        for (const name in asyncConsole.map) {
            if(names.includes(name)) {
                powerConsole.log(name,asyncConsole.map[name].join('\n\t\t'));
            }
        }
    }
}

export const powerConsole = {
    map: {},
    log: (name, msg, format='log') => {
        console.log(console.log(`[${name}] \n\t${ Array.isArray(msg)?msg.join('\n\t\t'):msg }\n`));
    }
};
