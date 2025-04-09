export const i18n = {

    it:{
        "fiscal[\\s_\\-.]{0,1}code":{
            namePattern: [
                { language:"it", value:"codice[\\s_\\-.]{0,1}fiscale|C[.]{0,1}F[.]{0,1}|cod[.]{0,1}fis[.]{0,1}" },
                { language:"en", value:"fiscal[\\s_\\-.]{0,1}code" },
                { language:"fr", value:"Code[\\s_\\-.]{0,1}Fiscal" },
                { language:"es", value:"Código[\\s_\\-.]{0,1}Fiscal" },
                { language:"pt", value:"Código[\\s_\\-.]{0,1}Fiscal" },
                { language:"de", value:"Fiscal[\\s_\\-.]{0,1}Code" },
                { language:"ja", value:"Fiscal[\\s_\\-.]{0,1}Code" },
                { language:"zh", value:"Fiscal[\\s_\\-.]{0,1}Code" },
                { language:"ru", value:"Код[\\s_\\-.]{0,1}Фискального[\\s_\\-.]{0,1}Лица" },
            ],
            label: [
                { language:"it", value:"Codice Fiscale" },
                { language:"en", value:"Fiscal Code" },
                { language:"fr", value:"Code Fiscal" },
                { language:"es", value:"Código Fiscal" },
                { language:"pt", value:"Código Fiscal" },
                { language:"de", value:"Fiscal Code" },
                { language:"ja", value:"Fiscal Code" },
                { language:"zh", value:"Fiscal Code" },
                { language:"ru", value:"Код Фискального Лица" },
            ],
            pattern: "^[a-zA-Z]{6}[0-9]{2}[a-zA-Z][0-9]{2}[a-zA-Z][0-9]{3}[a-zA-Z]$",
            maxValueLength: 16,
            minValueLength: 16
        } ,

    }
}

export default i18n;

export function chooseMessage(language, dictionary, key) {
    // ritorna il valore della chiave key in dizionario dictionary per la lingua language
    // se non esiste, ritorna la chiave key
    if (dictionary[language] && dictionary[language][key]) {
        return dictionary[language][key][language]; 
    } 
}