/**
 * 
 * @returns {Date}
 * @desc {en} returns the current date
 * @desc {it} restituisce la data odierna
 * @desc {es} devuelve la fecha actual
 * @desc {pt} retorna a data atual
 * @desc {fr} retourne la date actuelle




 * 
 */
export function now() {return new Date();}  

/**
 * 
 * @returns {Date}
 * @desc {en} returns yesterday's date
 * @desc {it} restituisce la data di ieri
 * @desc {es} devuelve la fecha de ayer
 * @desc {pt} retorna a data de ontem
 * @desc {fr} retourne la date d'hier




 * 
 * 
 */
export function yesterday() {return new Date(this_from.getFullYear(),this_from.getMonth(),this_from.getDate()-1);}

/**
 * @param {number} years - number of years to sum
 * @param {Date} this_from - start date
 * @returns {Date}
 * @desc {en} returns a date some years before or after
 * @desc {it} restituisce una data alcuni anni prima o dopo
 * @desc {es} devuelve una fecha algunos años antes o después
 * @desc {pt} retorna uma data alguns anos antes ou depois
 * @desc {fr} retourne une date quelques ans avant ou après




 * 
 * @prototype {Date}
 * 
 */

export function someYearsFrom (years, this_from=null){
    if(!this_from) this_from = now();
    return new Date(this_from.getFullYear() + years, this_from.getMonth(), this_from.getDate());
}

/**
 * 
 * @param {number} months - number of months to sum
 * @param {Date} this_from 
 * @returns 
 * 
 * @desc {en} returns a date some months before or after
 * @desc {it} restituisce una data alcuni mesi prima o dopo
 * @desc {es} devuelve una fecha algunos meses antes o después
 * @desc {pt} retorna uma data alguns meses antes ou depois
 * @desc {fr} retourne une date quelques mois avant ou après




 * @prototype {Date}
 * 
 */
export function someMonthsFrom (months, this_from=null){
    if(!this_from) this_from = now();
    return new Date(this_from.getFullYear(), this_from.getMonth() + months, this_from.getDate());
}
/**
 * @param {number} days - the number of days to add to the date
 * @param {Date} this_from - the date to start from (default is current date if not provided)
 * @return {Date} the date that is some days from the specified date
 * 
 * @desc {en} returns a date some days before or after
 * @desc {it} restituisce una data alcuni giorni prima o dopo
 * @desc {es} devuelve una fecha algunos días antes o después
 * @desc {pt} retorna uma data alguns dias antes ou depois
 * @desc {fr} retourne une date quelques jours avant ou après




 * @prototype {Date}
 */
export function someDaysFrom (days, this_from=null){
    if(!this_from) this_from = now();
    return new Date(this_from.getFullYear(), this_from.getMonth(), this_from.getDate() + days);
}
/**
 * @param {number} hours - The number of hours to add to the given date or the current date.
 * @param {Date|null} [this_from=null] - The date from which to calculate the new date. If not provided, the current date is used.
 * @return {Date} - The new Date object that is the specified number of hours from the given date or the current date.
 * 
 * @desc {en} returns a date some hours before or after
 * @desc {it} restituisce una data alcuni ore prima o dopo
 * @desc {es} devuelve una fecha algunos horas antes o después
 * @desc {pt} retorna uma data alguns horas antes ou depois
 * @desc {fr} retourne une date quelques heures avant ou après




 * @prototype {Date}
 */
export function someHoursFrom (hours, this_from=null){
    if(!this_from) this_from = now();
    return new Date(this_from.getFullYear(), this_from.getMonth(), this_from.getDate(), this_from.getHours() + hours);
}

/**
 *
 * @param {number} minutes - the number of minutes to add to the given time
 * @param {Date} this_from - the starting time (default is the current time)
 * @return {Date} a new Date object representing the time after adding the specified minutes
 * 
 * @desc {en} returns a date some minutes before or after
 * @desc {it} restituisce una data alcuni minuti prima o dopo
 * @desc {es} devuelve una fecha algunos minutos antes o después
 * @desc {pt} retorna uma data alguns minutos antes ou depois
 * @desc {fr} retourne une date quelques minutes avant ou après




 * @prototype {Date}
 */
export function someMinutesFrom (minutes, this_from=null){
    if(!this_from) this_from = now();
    return new Date(this_from.getFullYear(), this_from.getMonth(), this_from.getDate(), this_from.getHours(), this_from.getMinutes() + minutes);
}
/**
 *
 * @param {number} seconds - The number of seconds to add to the date.
 * @param {Date} this_from - The date to start from. Defaults to the current date and time if not provided.
 * @return {Date} A new Date object that is the specified number of seconds from the given date.
 * 
 * 
 * @desc {en} returns a date some seconds before or after
 * @desc {it} restituisce una data alcuni secondi prima o dopo
 * @desc {es} devuelve una fecha algunos segundos antes o después
 * @desc {pt} retorna uma data alguns segundos antes ou depois
 * @desc {fr} retourne une date quelques secondes avant ou après




 * 
 * @prototype {Date}
 */
export function someSecondsFrom (seconds, this_from=null){
    if(!this_from) this_from = now();
    return new Date(this_from.getFullYear(), this_from.getMonth(), this_from.getDate(), this_from.getHours(), this_from.getMinutes(), this_from.getSeconds() + seconds);
}
 
 
/**
 * 
 * @param {*} this_date 
 * @returns {array}
 * 
 * @desc {en} returns the first and last day of the month
 * @desc {it} restituisce la prima e l'ultima giornata del mese
 * @desc {es} devuelve el primer y el último día del mes
 * @desc {pt} retorna o primeiro e o último dia do mês
 * @desc {fr} retourne le premier et le dernier jour du mois




 *  
 * @prototype {Date}
 * 
 */
export function getFirstAndLastDayOfMonth(this_date) {
    var currentDate = this_date??new Date();
    currentDate.setMonth(currentDate.getMonth()-1);
    currentDate.setDate(1);
    
    var firstDay = this_date??new Date(currentDate);
    currentDate.setMonth(currentDate.getMonth() + 2);
    currentDate.setDate(0);
    var lastDay = new Date(currentDate);
    return {
      firstDay: firstDay,
      lastDay: lastDay
    };
  }
  
  /**
 * 
 * @param {*} this_date 
 * @param {string} countryCode
 * @returns {array}
 * 
 * @desc {en} returns the name of the holiday
 * @desc {it} restituisce il nome della festa
 * @desc {es} devuelve el nombre del feriado
 * @desc {pt} retorna o primeiro e o último dia do mês
 * @desc {fr} retourne le premier et le dernier jour du mois




 * 
 * @prototype {Date}
 * 
 */
  export function getHolidayName(this_date,countryCode) {
      if (typeof this_date === 'string') this_date = new Date(this_date);
      countryCode=countryCode.toUpperCase();
      var ret=null;
      for (const k in holidaysCatalog[countryCode]) {
          if (holidaysCatalog[countryCode][k](getYear(this_date))+"" == setZeroTimeToDate(this_date)+""){
              ret = k;
              break;
          } 
      }
      return ret;
  }

  /**
   *
   * @param {Date} this_date - The Date object to modify
   * @return {Date} The modified Date object with time set to midnight
   * 
   * @desc {en} returns a date with time set to midnight
   * @desc {it} restituisce una data con l'orario impostato a mezzanotte
   * @desc {es} devuelve una fecha con el tiempo establecido a medianoche
   * @desc {pt} retorna uma data com o horário definido para o meio-dia
   * @desc {fr} retourne une date avec l'heure e




   * 
   * @prototype {Date}
   */
  export function setZeroTimeToDate(this_date) {
    this_date=this_date??new Date();
    if (!(this_date instanceof Date)) {
      throw new Error('Expected Date parameter!');
    }
    this_date.setHours(0);
    this_date.setMinutes(0);
    this_date.setSeconds(0);
    this_date.setMilliseconds(0);
  
    return this_date;
  }
  /**
   * 
   * @param {*} this_stringTime 
   * @returns {number}
   * 
   * @desc {en} convert time HH:mm formatted to minutes
   * @desc {it} converte l'orario formato HH:mm in minuti 
   * @desc {es} convierte el tiempo formato HH:mm en minutos
   * @desc {pt} converte o tempo formato HH:mm em minutos
   * @desc {fr} convertit l'heure format HH:mm en minutes




   * 
   * @prototype {string}
   * 
   */
  export function convertTimeToMinutes(this_stringTime) {
      if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time)) {
          throw new Error('Invalid time format. Please use the format \'HH:mm\'');
      }
  
      var parts = time.split(":");
      var hours = parseInt(parts[0], 10);
      var minutes = parseInt(parts[1], 10);
  
      return hours * 60 + minutes;
  }

  /**
   * @param {string} min - the minimum time value
   * @param {string} max - the maximum time value
   * @param {number} minutesStep - the step size in minutes
   * @param {function} callback - the callback function to be called for each time value
   * 
   * 
   * @desc {en} Generate a sequence of time within the specified range.
   * @desc {it} Genera una sequenza di time nel range specificato.
   * @desc {es} Genera una secuencia de tiempo dentro del rango especificado.
   * @desc {pt} Gere uma sequência de tempo dentro do intervalo especificado.
   * @desc {fr} Génère une séquence de temps dans la plage spécifiée.




   * 
   */
  export function forTimeSequence(min, max, minutesStep, callback) {
      if (min >= max || minutesStep <= 0) {
          console.error("Invalid input parameters. Please ensure min is less than max and minutesStep is greater than 0.");
      }
      var current = convertTimeToMinutes(min);
      var maxInt = convertTimeToMinutes(max);
      while (current <= maxInt) {
          if (callback) callback(convertMinutesToTime(current), current);
          current += minutesStep;
      }
  }

    /**
   * @desc {en} Generate a sequence of time within the specified range.
   * @desc {it} Genera una sequenza di time nel range specificato.
   * @desc {es} Genera una secuencia de tiempo dentro del rango especificado.
   * @desc {pt} Gere uma sequência de tempo dentro do intervalo especificado.
   * @desc {fr} Génère une séquence de temps dans la plage spécifiée.




   * 
   *
   * @param {number} min - the minimum time value
   * @param {number} max - the maximum time value
   * @param {number} minutesStep - the step size in minutes
   * @return {Array} an array of time values
   */
    export function getTimeSequence(min, max, minutesStep) {
       var arr=[];
       forTimeSequence(min, max, minutesStep, function(time){
           arr.push(time);
       });
       return arr;
  }
    /**
   * 
   *
   * @param {number} minutes - the number of minutes to convert
   * @return {string} the time in the format HH:MM
   * 
   * @desc {en} returns the time in the format HH:MM
   * @desc {it} restituisce il tempo nel formato HH:MM
   * @desc {es} devuelve el tiempo en el formato HH:MM
   * @desc {pt} retorna uma string no formato HH:MM
   * @desc {fr} retourne une chaine au format HH:MM




   * 
   */
    export function convertMinutesToTime(minutes) {
      if (isNaN(minutes) || minutes < 0) {
          console.error("Invalid input. Please provide a non-negative integer.");
          return null;
      }
  
      var hours = Math.floor(minutes / 60);
      var remainingMinutes = minutes % 60;
  
      return formatTime(hours, remainingMinutes);
  }
  
    /**
   *
   * @param {number} hours - the hours to format
   * @param {number} minutes - the minutes to format
   * @return {string} the formatted time string
   * 
   * 
   * @desc {en} returns the formatted time string
   * @desc {it} restituisce la stringa formattata del tempo
   * @desc {es} devuelve la cadena de formato de tiempo
   * @desc {pt} retorna uma string no formato HH:MM
   * @desc {fr} retourne une chaine au format HH:MM




   *    
   * 
   */
    export function formatTime(hours, minutes) {
      return formatIntToNDigits(hours, 2) + ":" + formatIntToNDigits(minutes, 2);
  }
  
  /**
   * @desc {en} returns the current year
   * @desc {it} restituisce l'anno corrente
   * @desc {es} devuelve el año actual
   * @desc {pt} retorna o ano atual
   * @desc {fr} retourne l'annee courante




   * @return {number}
   */
  export function getCurrentYear() {
      return getYear(new Date());
  }

  /**
   * 
   * @returns {number}
   * 
   * @desc {en} returns the current month
   * @desc {it} restituisce il mese corrente
   * @desc {es} devuelve el mes actual
   * @desc {pt} retorna o mes atual
   * @desc {fr} retourne le mois courant




   */
  export function getCurrentMonth() {
      return getMonth(new Date());
  }

  /**
   * @returns {number}
   * @desc {en} returns the current day
   * @desc {it} restituisce il giorno corrente
   * @desc {es} devuelve el dia actual
   * @desc {pt} retorna o dia atual
   * @desc {fr} retourne le jour courant




   */
  export function getCurrentDay() {
      return getDay(new Date());
  }

  /**
   * 
   * @param {Date} date 
   * @returns {number}
   * 
   * @desc {en} returns the year
   * @desc {it} restituisce l'anno
   * @desc {es} devuelve el año
   * @desc {pt} retorna o ano
   * @desc {fr} retourne l'annee




   */
  export function getYear(date) {
      var ret = date.getFullYear();
      return ret;
  }

  /**
   * 
   * @param {Date} date 
   * @returns {number}
   * 
   * @desc {en} returns the month
   * @desc {it} restituisce il mese
   * @desc {es} devuelve el mes
   * @desc {pt} retorna o mes
   * @desc {fr} retourne le mois




   * 
   */
  export function getMonth(date) {
      var ret = date.getMonth() + 1;
      return ret;
  }

  /**
   * @param {Date} date
   * @returns {number}
   * 
   * @desc {en} returns the day
   * @desc {it} restituisce il giorno
   * @desc {es} devuelve el dia
   * @desc {pt} retorna o dia
   * @desc {fr} retourne le jour




   * 
  */
  export function getDay(date) {
      var ret = date.getDate();
      return ret;
  }
  
  /**
   * 
   * @param {Date} this_date
   * @returns {string}
   * 
   * @desc {en} returns the day name
   * @desc {it} restituisce il nome del giorno
   * @desc {es} devuelve el nombre del dia
   * @desc {pt} retorna o nome do dia
   * @desc {fr} retourne le nom du jour




   * 
   * @prototype {Date}
   */
  export function getDayName(this_date) {
      let localeBrowser = navigator.language;
      let options = { weekday: 'short' };
      let formatter = new Intl.DateTimeFormat(localeBrowser, options);
      return formatter.formatToParts(this_date)[0].value;
  }
  
  /**
   * 
   * @param {number} year
   * @returns {Date}
   * 
   * @desc {en} calculate easter
   * @desc {it} calcola la pasqua
   * @desc {es} calcula el domingo de pascua
   * @desc {pt} calcula o domingo de pascua
   * @desc {fr} calcule l'easter




   *    
   */
  export function calculateEaster(year) {
       const a = year % 19;
      const b = Math.floor(year / 100);
      const c = year % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1;
  
      return new Date(year, month - 1, day);
  }
  
  
  /**
   * 
   * @param {string} this_timeString 
   * @returns 
   */
  export function transformTo59Minutes(this_timeString) {
      const timeComponents = this_timeString.split(':');
  
      if (timeComponents.length === 2 && !isNaN(timeComponents[0]) && !isNaN(timeComponents[1])) {
          const hour = timeComponents[0];
          return hour + ':59';
      } else {
          return this_timeString;
      }
  }
  

  /**
   *
   * @desc {en} catalog of holidays 
   * @desc {it} catalogo delle vacanze
   * @desc {es} catalogo de vacaciones
   * @desc {pt} catalogo de feriados
   * @desc {fr} catalogue des vacances




   *    
   */
  export const holidaysCatalog = [
    {
      name: [
        { language: "it", value: "Capodanno (S.Silvestro)" },
        { language: "es", value: "San Silvestre" },
        { language: "pt", value: "Santa Silvestre" },
        { language: "en", value: "New Year's Day" },
        { language: "de", value: "Neujahr" },
        { language: "fr", value: "Nouvel an" },
        { language: "ja", value: "元日" },
        { language: "zh", value: "元日" },
        { language: "ru", value: "Новый Год" },
      ],
      getter: function (year) {
        return new Date(year, 0, 1);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Epifania" },
        { language: "es", value: "Epifania" },
        { language: "pt", value: "Epifania" },
        { language: "de", value: "Epifania" },
        { language: "en", value: "Epiphany" },
        { language: "fr", value: "Epifanie" },
        { language: "ja", value: "成人の日" },
        { language: "zh", value: "成人节" },
        { language: "ru", value: "Рождество Христово" },
       

    ],
      getter: function (year) {
        return new Date(year, 0, 6);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Pasqua" },
        { language: "es", value: "Pasqua" },
        { language: "pt", value: "Pasqua" },
        { language: "de", value: "Pasqua" },
        { language: "en", value: "Easter" },
        { language: "fr", value: "Paques" },
        { language: "ja", value: "春分の日" },
        { language: "zh", value: "春节" },
        { language: "ru", value: "Рождество Христово" },
    ],
      getter: function (year) {
        return calculateEaster(year);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Pasquetta (Lunedì dell'angelo)" },
        { language: "es", value: "Lunes de Pascua" },
        { language: "pt", value: "Lunes de Pascua" },
        { language: "de", value: "Ostermontag" },
        { language: "en", value: "Easter Monday" },
        { language: "fr", value: "Lundi de Paques" },
        { language: "ja", value: "復活月曜日" },
        { language: "zh", value: "复活节星期一" },
        { language: "ru", value: "Рождество Христово" },

    ],
      getter: function (year) {
        return calculateDateWithOffset(calculateEaster(year), +1);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name:[ 
        { language: "it",  value: "Liberazione (dello stato Italiano dal Nazi-Fascismo)" },
      { language: "es", value: "Liberación" },
      { language: "pt",  value: "Liberação"},
      { language: "en",  value: "Liberation Day"},
      { language: "de",  value: "Liberationstag"},
      { language: "fr",  value: "Jour de la libération"},
      { language: "ja",  value: "天皇誕生日"},
      { language: "zh",  value: "天主教诞生纪念日"},
        { language: "ru",  value: "День свободы"},

      ],
      getter: function (year) {
        return new Date(year, 3, 25);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Festa dei lavoratori" },
        { language: "es", value: "Festividad de los trabajadores" },
        { language: "pt", value: "Festa dos Trabalhadores" },
        { language: "en", value: "Workers' Day" },
        { language: "de", value: "Tag der Arbeit" },
        { language: "fr", value: "Jour du travailleur" },
        { language: "ja", value: "労働の日" },
        { language: "zh", value: "劳动节" },
        { language: "ru", value: "День рабочей силы"},

    ],
      getter: function (year) {
        return new Date(year, 4, 1);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Festa della Repubblica" },
        { language: "es", value: "Festividad de la República" },
        { language: "pt", value: "Festa da República" },
        { language: "en", value: "Republic Day" },
        { language: "de", value: "Republikationstag" },
        { language: "fr", value: "Jour de la Republique" },
        { language: "ja", value: "元日" },
        { language: "zh", value: "元旦" },
        { language: "ru", value: "День Республики"},
    ],
      getter: function (year) {
        return new Date(year, 5, 2);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Assunzione di Maria" },
        { language: "es", value: "Día de la Madre" },
        { language: "pt", value: "Assunção de Maria" },
        { language: "en", value: "Maria's Birthday" },
        { language: "de", value: "Maria-Himmelfahrtstag" },
        { language: "fr", value: "Jour de Mariage" },
        { language: "ja", value: "マリーの誕生日" },
        { language: "zh", value: "圣诞节" },
        { language: "ru", value: "День Марии"},

    ],
      getter: function (year) {
        return new Date(year, 7, 15);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Tutti i Santi" },
        { language: "es", value: "Todos los Santos" },
        { language: "pt", value: "Todos os Santos" },
        { language: "en", value: "All Saints' Day" },
        { language: "de", value: "Allerheiligen" },
        { language: "fr", value: "Jour des YYS" },
        { language: "ja", value: "みどりの日" },
        { language: "zh", value: "母亲节" },
        { language: "ru", value: "День всех сил"},

    ],
      getter: function (year) {
        return new Date(year, 10, 1);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Immacolata Concezione" },
        { language: "es", value: "Immaculada Concepción" },
        { language: "pt", value: "Imaculada Conceição" },
        { language: "en", value: "Immaculate Conception" },
        { language: "de", value: "Maria Empfaenger" },
        { language: "fr", value: "Jour de l'Immaculee" },
        { language: "ja", value: "皇太子明仁親王の誕生日" },
        { language: "zh", value: "即位纪念日" },
        { language: "ru", value: "День Иммакулата"},

    ],
      getter: function (year) {
        return new Date(year, 11, 8);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Natale" },
        { language: "es", value: "Nacimiento" },
        { language: "pt", value: "Natal" },
        { language: "en", value: "Christmas Day" },
        { language: "de", value: "Weihnachten" },
        { language: "fr", value: "Noël" },
        { language: "ja", value: "クリスマス" },
        { language: "zh", value: "圣诞节" },
        { language: "ru", value: "День Рождения"},
    ],
      getter: function (year) {
        return new Date(year, 11, 25);
      },
      isNationalHolidayIn: ["it"],
    },
    {
      name: [
        { language: "it", value: "Santo Stefano" },
        { language: "es", value: "Santo Stefano" },
        { language: "pt", value: "Santo Stefano" },
        { language: "en", value: "Santo Stefano" },
        { language: "de", value: "Santo Stefano" },
        { language: "fr", value: "Santo Stefano" },
        { language: "ja", value: "サンドステファーノ" },
        { language: "zh", value: "圣诞节" },
        { language: "ru", value: "День Санто Стефано"},
    ],
      getter: function (year) {
        return new Date(year, 11, 26);
      },
      isNationalHolidayIn: ["it"],
    },

   
      {
        name: [
            { language: "it", value: "Festa della donna" },
            { language: "es", value: "Fiesta de la mujer" },
            { language: "pt", value: "Festa da Mulher" },
            { language: "en", value: "Women's Day" },
            { language: "de", value: "Women's Day" },
            { language: "fr", value: "Fête de la femme" },
            { language: "ja", value: "女の日" },
            { language: "zh", value: "情人节" },
            { language: "ru", value: "День женщин"},
        ],
        getter: function (year) {
          return new Date(year, 2, 8); // 8 marzo
        },
        isNationalHolidayIn: ["it"],
      },
      {
        name: [
            { language: "it", value: "Festa del papà (S. Giuseppe)" },
            { language: "es", value: "Día del Padre" },
            { language: "pt", value: "Festa do Padrão" },
            { language: "en", value: "Father's Day" },
            { language: "de", value: "Father's Day" },
            { language: "fr", value: "Fête du père" },
            { language: "ja", value: "お父さんの日" },
            { language: "zh", value: "父亲节" },
            { language: "ru", value: "День отца"},
        ],
        getter: function (year) {
          return new Date(year, 2, 19);
        },
        isNationalHolidayIn: ["it"],
      },
      {
        name: [
            { language: "it", value: "Festa della mamma" },
            { language: "es", value: "Fiesta de la madre" },
            { language: "pt", value: "Festa da Madrinha" },
            { language: "en", value: "Mother's Day" },
            { language: "de", value: "Mother's Day" },
            { language: "fr", value: "Fête de la mère" },
            { language: "ja", value: "お母さんの日" },
            { language: "zh", value: "母亲节" },
            { language: "ru", value: "День матери"},
        ],
        getter: function (year) {
          return calculateNthSundayOfMonth(2,year, 4); // 4 rappresenta maggio
        },
        isNationalHolidayIn: ["it"],
      },
      {
        name: [
            { language: "it", value: "San Valentino" },
        { language: "es", value: "San Valentiño" },
        { language: "pt", value: "San Valentino" },
        { language: "en", value: "San Valentino" },
        { language: "de", value: "San Valentino" },
        { language: "fr", value: "San Valentino" },
        { language: "ja", value: "サンバレンティーノ" },
        { language: "zh", value: "圣诞节" },
        { language: "ru", value: "День Санто Вентино"}
    ],

        getter: function (year) {
          return new Date(year, 1, 14);
        },
        isNationalHolidayIn: ["it"],
      },
  ];
  
/**
 * @param {number} n - The ordinal number of the Sunday in the month (1 for the first Sunday, 2 for the second, etc.).
 * @param {number} year - The year in which the Sunday is to be calculated.
 * @param {number} month - The month in which the Sunday is to be calculated (0 for January, 1 for February, etc.).
 * @return {Date} - The date object representing the nth Sunday of the month in the given year.
 * 
 * 
 * @desc {en} Returns the date object of the nth Sunday of the month in the given year.
 * @desc {it} Restituisce la data dell'ultima settimana del mese nello anno dato
 * @desc {es} Retorna la fecha del domingo de la semana n del mese en el año dado
 * @desc {pt} Retorna a data do domingo da semana n do mês no ano dado
 * @desc {fr} Retourne la date du dimanche de la semaine n du mois dans l'annee donnée




 */
export function calculateNthSundayOfMonth(n,year, month) {
    const firstDayOfMonth = getFirstAndLastDayOfMonth(year, month)[0];
    const firstSunday = firstDayOfMonth.getDate() + (7 - firstDayOfMonth.getDay());
    return new Date(year, month, firstSunday + (n - 1) * 7);
  }