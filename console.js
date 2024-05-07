/**
 * @author Roberto Stefani
 * @license MIT
 */

/**
 * @desc {it} Async console: raccoglie i log per mostrarli in un secondo momento, tutti insieme, in console quando si chiude un processo. E' utile per mostrare i log di un processo asincrono.
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
        console.log(console.log(`[${name}]{\n\t${ Array.isArray(msg)?msg.join('\n\t\t'):msg }\n}`));
    }
};
