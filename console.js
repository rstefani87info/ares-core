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
        console.log(`[${name}] \n\t${ Array.isArray(msg)?msg.join('\n\t\t'):msg }\n`);
    }
};
const oldConsole = {
    log: console.log.bind(console),
    error: console.error.bind(console),
    warn: console.warn.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
  };

  // js standard
 function getCallerInfo() {
     const stack = new Error().stack;
     if (stack) {
       const stackLines = stack.split("\n");
       if (stackLines.length > 3) {
         const callerLine = stackLines[3].trim();
         const match = callerLine.match(/at\s+(.+):(\d+):\d+/);
         if (match) {
           return `${match[1]}:${match[2]}`; 
         }
       }
     }
     return "unknown location";
   }


  
  export function log(...messages) {
    const callerInfo = getCallerInfo();
    oldConsole.log( ...messages);
  }
  
  export function error(...messages) {
    const callerInfo = getCallerInfo();
    oldConsole.error(`[${callerInfo}]`, ...messages);
  }
  
  export function warn(...messages) {
    const callerInfo = getCallerInfo();
    oldConsole.warn(`[${callerInfo}]`, ...messages);
  }
  
  export function info(...messages) {
    const callerInfo = getCallerInfo();
    oldConsole.info(  ...messages);
  }
  
  export function debug(...messages) {
    const callerInfo = '';
    oldConsole.debug(`[${callerInfo}]`, ...messages);
  }
  
  console.log = log;
  console.error = error;
  console.warn = warn;
  console.info = info;
  console.debug = debug;
  
