export async function tryTo(action,done,fail){
    let ret = null;
    try{
        const res = await action();
        ret=done(res);
    }
    catch(e){
        ret=fail(e);
    }
    return ret;
}