import { countCharacters } from "./text.js";

export function isCompatibleVersionPercentage(version1, version2){
     const majorVersion = compareMajorVersionNumber(version1, version2);
     if(majorVersion !== 0){
        return (1 * Math.sign(majorVersion)) + (majorVersion/Math.pow(10, countCharacters(version1)));
     }
     const minorVersion = compareMinorVersionNumber(version1, version2);
     if(minorVersion !== 0){
        return (50 * Math.sign(minorVersion)) + (minorVersion/Math.pow(10, countCharacters(version1)));
     }
     const patchVersion = comparePatchVersionNumber(version1, version2);
     if(patchVersion !== 0){
        return (75 * Math.sign(patchVersion)) + (patchVersion/Math.pow(10, countCharacters(version1)));
     }
     return 100;
}

export function versionTokensToString(version, separator = '.'){
    if(Array.isArray(version))
        return version.join(separator);
    else if(typeof version === "number")
        return version.toString();
    else if(typeof version === "string")
        return version;
}

export function compareVersionNumbers(version1, version2){
    const difference = subtractVersionNumber(version2, version1);
    for(let i = 0; i < difference.length; i++){
        if(difference[i] !== 0){
            return difference[i];
        }
    }
    return 0;
}

export function compareMajorVersionNumber(version1, version2){
    const difference = subtractVersionNumber(version2, version1);
    return difference[0];
}

export function compareMinorVersionNumber(version1, version2){
    const difference = subtractVersionNumber(version2, version1);
    return difference[1];
}

export function comparePatchVersionNumber(version1, version2){
    const difference = subtractVersionNumber(version2, version1);
    return difference[2];
}

export function subtractVersionNumber(version1, version2){
    let tokes0 = [];
    
    const tokes1 = normalizeVersionNumberTokens(version1);
    const tokes2 = normalizeVersionNumberTokens(version2);

    const maxTokensLength = Math.max(tokes1.length, tokes2.length);
    for(let i = 0; i < maxTokensLength; i++){
        tokes0[i] = '0';
    }

    for(let i = 0; i < maxTokensLength; i++){
        const v1Part = tokes1[i] ?? '0';
        const v2Part = tokes2[i] ?? '0';
        const v1Int = parseInt(v1Part);
        const v2Int = parseInt(v2Part);
        if(v1Int !== v2Int){
            tokes0[i] = v1Int - v2Int;
            break;
        }
    }

    return tokes0;
}

export function normalizeVersionNumber(version){
    let tokes = normalizeVersionNumberTokens(version);
    return tokes.join('.');
}

export function normalizeVersionNumberTokens(version){
    let tokes = [];
    if(typeof version === "string")
        tokes = version.split('.');
    else if(Array.isArray(version))
        tokes = version;
    else
        throw new Error("invalid_version_format");
    return tokes.map(token => token.trim().match(/^\*|\^$/g) ? token : parseInt(token.trim().match(/^[0-9]+/)[0]));
}
