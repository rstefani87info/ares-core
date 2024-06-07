/**
 * @author Roberto Stefani
 * @license MIT
 */

/**
 * @desc {en} Async console: collect logs for showing them in a second later, all together, in the console when the process closes. Useful for showing logs of an asynchronous process.
 * @desc {it} Async console: raccoglie i log per mostrarli in un secondo momento, tutti insieme, in console quando si chiude un processo. E' utile per mostrare i log di un processo asincrono.
 * @desc {es} Async console: recoge los logs para mostrarlos en un segundo momento, todos juntos, en la consola cuando se cierra el proceso. Es útil para mostrar los logs de un proceso asíncrono.
 * @desc {fr} Async console: collecte les logs pour les montrer dans un secondes, tous ensemble, dans la console lors de la fermeture du processus. Utile pour montrer les logs d'un processus asynchrone.
 * @desc {pt} Async console: coleciona os logs para mostrar-los em um segundo momento, todos juntos, na console quando o processo e fechado. É possível para mostrar os logs de um processo assíncrono.
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
