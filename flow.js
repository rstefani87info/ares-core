/**
 * Executes an action and routes its result to either the success or failure callback.
 *
 * @param {Function} action Function to execute. It may return either a value or a promise.
 * @param {Function} done Callback invoked with the resolved action result.
 * @param {Function} fail Callback invoked with the thrown error.
 * @returns {Promise<*>} The value returned by `done` or `fail`.
 */
export async function tryTo(action,done,fail, consoleManager = console){
    let ret = null;
    if(done == null) done = (res) => res;
    if(fail == null) fail = (e) => e;
    try{
        let res =  action();
        if (res instanceof Promise) {
            res = await res;
        }
        consoleManager.debug(`[DEBUG] tryTo: success - ${action.name}`);
        
        ret=done(res);
    }
    catch(e){
        ret=fail(e);
        consoleManager.error(`[ERROR] tryTo: error - ${action instanceof Function ? action.toString() : action}`, e);
    }
    return ret;
}

/**
 * Starts `tryTo()` and returns its result, invoking `fail()` again if the returned value is falsy.
 *
 * @param {*} action Action to execute.
 * @param {Function} done Callback invoked when `action` succeeds.
 * @param {Function} fail Callback invoked when `action` fails, and again when the returned value is falsy.
 * @returns {*} The value returned by `tryTo(action, done, fail)`.
 */
export async function when(action,done=null,fail=null, failureCondition = null, consoleManager = console){
    if(!(action instanceof Function)) {
        const fixedAction = action;
        action = () => fixedAction;
    }
    if(failureCondition == null) {
        failureCondition = (v) => !v;
    }
    if(done == null) done = (res) => res;
    if(fail == null) fail = (e) => e;
    let ret = await tryTo(action,(res)=>res,fail, consoleManager);
    if(failureCondition(ret)){
        ret = fail(ret);
        if(ret instanceof Promise) ret = await ret;
        consoleManager.warn(`[WARN] tryTo: warning - ${action instanceof Function ? action.toString() : action}`, ret);
    }
    else {
        ret = done(ret);
        if(ret instanceof Promise) ret = await ret;
    }
    return ret;
}

/**
 * Executes multiple actions in parallel and routes their results to either the success or failure callback.
 *
 * @param {*} actions Array of actions to execute.
 * @param {Function} done Callback invoked with the resolved action results.
 * @param {Function} fail Callback invoked with the thrown error.
 * @param {*} consoleManager Console manager to use for logging.
 * @returns {*} The value returned by `when(action, done, fail, ...)`.
 */
export async function whenAll(actions,done=null,fail=null, failureCondition = null, consoleManager = console){
     return actions.map(action => when(action,done,fail,failureCondition, consoleManager));
}

/**
 * Executes `when()` and converts failures into a thrown `Error`.
 *
 * @param {*} action Action to execute.
 * @param {Function} done Callback invoked when `action` succeeds.
 * @param {string} fail Error message used to build the thrown exception.
 * @returns {*} The value returned by `when(action, done, ...)`.
 * @throws {Error} Thrown when `action` fails or when `when()` triggers its failure branch.
 */
export async function whenOrException(action,done=null, fail='action_failed', failureCondition = null, consoleManager = console){
    return when(action,done,()=>{ throw new Error(fail)}, failureCondition, consoleManager);
}

/**
 * Executes `whenAll()` and converts failures into a thrown `Error`.
 *
 * @param {*} actions Array of actions to execute.
 * @param {Function} done Callback invoked with the resolved action results.
 * @param {string} fail Error message used to build the thrown exception.
 * @returns {*} The value returned by `whenAll(actions, done, fail, ...)`.
 * @throws {Error} Thrown when any of the actions fail or when `whenAll()` triggers its failure branch.
 */
export async function whenAllOrException(actions,done=null, fail='action_failed', failureCondition = null, consoleManager = console){
    return whenAll(actions,done,()=>{ throw new Error(fail)}, failureCondition, consoleManager);
}
