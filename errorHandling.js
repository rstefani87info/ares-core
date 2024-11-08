import {isAsyncFunction} from "./scripts.js";
export function tryToDo(action,  onError=null, onFinally=null) {
    const res = {};
    try{
        res.response=onError && onError instanceof Function ? action() : action;
    }catch(e){
        console.warn(e);
        res.error = e;
        if(onError && onError instanceof Function)onError(e, res);
    }finally{
        if(onFinally instanceof Function)onFinally(res);
    }
    return res;
}

export async function tryToDoAsync(action,  onError=null, onFinally=null) {
    const res = {};
    try{
        res.response=onError && onError instanceof Function ? (await action()) : action;
    }catch(e){
        console.warn(e);
        res.error = e;
        if(onError && onError instanceof Function)onError(e, res);
    }finally{
        if(onFinally instanceof Function)onFinally(res);
    }
    return res;
}