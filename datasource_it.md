
## Introduzione

Questo playbook fornisce una guida strutturata per l'implementazione di datasource nel framework aReS. I datasource rappresentano l'astrazione che permette di interagire con diverse fonti di dati in modo uniforme.

## Struttura di un Datasource

### Configurazione Base

- **Definizione del datasource**
  - `name`: Nome univoco del datasource
  - `environments`: Configurazioni per diversi ambienti
    - `production`: Configurazione per l'ambiente di produzione
      - `[connectionName]`: Nome della connessione
        - `driver`: Classe che implementa la connessione
        - `host`: Host del database
        - `port`: Porta del database
        - `database`: Nome del database
        - `user`: Username
        - `password`: Password
        - `maxPoolSize`: Dimensione massima del pool di connessioni
        - `minPoolSize`: Dimensione minima del pool di connessioni
        - `serverSelectionTimeoutMS`: Timeout per la selezione del server
    - `test`: Configurazione per l'ambiente di test
      - `[connectionName]`: Nome della connessione
        - `driver`: Classe che implementa la connessione
        - `host`: Host del database
        - `port`: Porta del database
        - `database`: Nome del database
        - `user`: Username
        - `password`: Password
        - `maxPoolSize`: Dimensione massima del pool di connessioni
        - `minPoolSize`: Dimensione minima del pool di connessioni
        - `serverSelectionTimeoutMS`: Timeout per la selezione del server
  - `queries`: Definizione delle query (mapper)
    - `[queryName]`: Nome della query
      - `connectionSetting`: Nome della connessione da utilizzare
      - `query`: Query SQL o comando da eseguire
      - `parametersValidationRoles`: Funzione che definisce la validazione dei parametri
      - `mapParameters`: Funzione per mappare i parametri di input
      - `mapResult`: Funzione per mappare i risultati
      - `transformToDTO`: Funzione per trasformare i risultati in DTO
      - `onEmptyResult`: Funzione da eseguire quando non ci sono risultati
      - `postExecute`: Funzione da eseguire dopo l'esecuzione della query
      - `transaction`: Booleano o numero che indica se la query deve essere eseguita in una transazione
      - `methods`: Metodi HTTP supportati (per REST)

### Implementazione di un Driver di Connessione

- **Classe Base**
  - Estensione di `DBConnection`, `SQLDBConnection` o `NOSQLDBConnection`
  - Costruttore
    - Parametri di connessione
    - Riferimento al datasource
    - ID di sessione
    - Nome della configurazione di connessione
  - Metodi richiesti
    - `nativeConnect`: Stabilisce la connessione al database
    - `nativeDisconnect`: Chiude la connessione al database
    - `_executeNativeQueryAsync`: Esegue una query in modo asincrono
    - `executeNativeQueryAsync`: Implementazione specifica per il database
    - `executeQuerySync`: Versione sincrona (o simulata) dell'esecuzione della query

- **Gestione delle Transazioni**
  - `startTransaction`: Inizia una transazione
  - `commit`: Conferma una transazione
  - `rollback`: Annulla una transazione

- **Gestione del Pool di Connessioni**
  - `createPool`: Crea un pool di connessioni
  - `setPool`: Imposta il pool di connessioni

### Implementazione di un Mapper

- **Struttura del Mapper**
  - `name`: Nome del mapper
  - `connectionSetting`: Nome della configurazione di connessione
  - `query`: Query o comando da eseguire
  - `parametersValidationRoles`: Funzione per la validazione dei parametri
    - Definizione dei ruoli di validazione
      - `type`: Tipo di dato
      - `required`: Se il parametro è obbligatorio
      - `source`: Funzione per estrarre il valore dal request
      - `pattern`: Pattern regex per la validazione
      - `minLength`: Lunghezza minima
      - `maxLength`: Lunghezza massima
  - `mapParameters`: Funzione per mappare i parametri
  - `mapResult`: Funzione per mappare i risultati
  - `transformToDTO`: Funzione per trasformare i risultati in DTO
  - `onEmptyResult`: Funzione da eseguire quando non ci sono risultati
  - `postExecute`: Funzione da eseguire dopo l'esecuzione della query

### Registrazione e Utilizzo

- **Registrazione del Datasource**
  - Importazione della funzione `loadDatasource`
  - Chiamata a `loadDatasource` con i parametri appropriati
    - Riferimento all'applicazione aReS
    - Configurazione del datasource
    - Callback per quando un mapper viene caricato
    - Flag per forzare il ricaricamento

- **Utilizzo del Datasource**
  - Accesso al datasource tramite `aReS.datasourceMap[datasourceName]`
  - Esecuzione di una query tramite `datasource[queryName].execute(request)`
  - Gestione dei risultati

## Considerazioni sulla Sicurezza

- **Validazione dei Parametri**
  - Utilizzo di `format` per validare i parametri di input
  - Definizione di regole di validazione appropriate

- **Gestione delle Connessioni**
  - Chiusura corretta delle connessioni
  - Utilizzo di pool di connessioni

- **Autenticazione e Autorizzazione**
  - Verifica dei permessi tramite `aReS.permissions.isResourceAllowed`
  - Implementazione di token JWT per API REST

- **Protezione dei Dati**
  - Omissione di dati sensibili nei risultati
  - Utilizzo di encryption per dati sensibili

## Estensibilità

- **Creazione di Nuovi Driver**
  - Estensione delle classi base
  - Implementazione dei metodi richiesti

- **Personalizzazione dei Mapper**
  - Definizione di funzioni di mapping personalizzate
  - Implementazione di logica di business nei mapper

- **Integrazione con Altri Servizi**
  - Implementazione di connessioni REST
  - Supporto per altri protocolli

## Risoluzione dei Problemi

- **Gestione degli Errori**
  - Utilizzo di try/catch per gestire le eccezioni
  - Logging appropriato degli errori

- **Debugging**
  - Utilizzo di `console.log` per il debugging
  - Ispezione dei risultati delle query

- **Ottimizzazione delle Prestazioni**
  - Utilizzo di pool di connessioni
  - Ottimizzazione delle query
