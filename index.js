/**
 * @author Roberto Stefani
 * @license MIT
 * A collection of base utilities of aReS framework.
 */

export class ARES {
    static instances = {};
    constructor(setup){
        this.appSetup = setup ?? { environments: [] };
        this.idMap = { idKeyMap:{}, hashKeyMap:{} };
        ARES.instances[this._appSetup.name] = this;
    }

    set appSetup(setup){
        this._appSetup = setup;
    }

    get appSetup() { return this._appSetup; }

    set idMap(idMap){
        this._idMap = idMap;
    }
   
    get idMap(){
      return this._idMap;
    }

    get isProduction(){
        return this._appSetup.environments.find(x=>x.type.toLowerCase()=='production' && x.selected)!== undefined;
    }

    include(module){
        return module.aReSInitialize(this);
    }
    
    static getInstance(name){
        return ARES.instances[name];
    }
}

export default function aReSInitialize(setup){
    const aReS = new ARES(setup);
    return aReS;
}



