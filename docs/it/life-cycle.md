# aReS Core Life Cycle

## Scopo

Questo documento descrive il ciclo di vita del modulo `@ares/core` del framework aReS in base alla struttura attuale del codice.

Il `core` non e' solo una raccolta di utility: e' il punto in cui nasce l'istanza `aReS`, vengono agganciate le estensioni del framework e si definiscono alcuni servizi trasversali usati dagli altri moduli.

## Visione Rapida

Il flusso generale del modulo `core` e' questo:

1. Si crea un'istanza `aReS` a partire da `appSetup`.
2. L'istanza conserva configurazione, stato condiviso e mappa delle istanze create.
3. I moduli aggiuntivi vengono inclusi tramite `aReS.include(module)`.
4. I moduli inclusi estendono l'istanza aggiungendo metodi e servizi.
5. Durante il runtime il core fornisce supporto a datasource, validazione, sicurezza, utility di rete, scripting e logging.
6. I moduli consumer usano questi servizi per costruire il comportamento applicativo.

## 1. Bootstrap

Il punto di ingresso del core e' `index.js`.

- La funzione di default `aReSInitialize(setup)` crea una nuova istanza della classe `ARES`.
- Il costruttore salva `appSetup` e inizializza alcune strutture di stato base, come `idMap`.
- L'istanza viene anche registrata in `ARES.instances`, cosi' puo' essere recuperata in seguito per nome.

In pratica il bootstrap produce il contenitore centrale del framework.

## 2. Stato Centrale

La classe `ARES` rappresenta il contesto condiviso del framework.

Le responsabilita' principali sono:

- conservare `appSetup`, cioe' la configurazione dell'applicazione host;
- esporre `isProduction`, calcolato in base agli ambienti marcati come `production`;
- mantenere mappe di supporto come `idMap`;
- fungere da oggetto estendibile su cui i moduli possono registrare nuove capacita';
- consentire il recupero di un'istanza gia' creata tramite `ARES.getInstance(name)`.

Questo rende `aReS` il centro del ciclo di vita del framework.

## 3. Inclusione Moduli

Il meccanismo di estensione e' `aReS.include(module)`.

Il core si aspetta che un modulo esporti `aReSInitialize(aReS)`.

Quando un modulo viene incluso:

1. il modulo riceve l'istanza corrente;
2. aggiunge metodi, factory o servizi al contesto `aReS`;
3. il resto del framework puo' usare immediatamente questi nuovi punti di estensione.

Esempi nel modulo `core`:

- `datasources.js` aggiunge `aReS.loadDatasource(...)`;
- `commandLine.js` aggiunge `aReS.initCommandLine(...)`;
- `geographical.js` aggiunge `aReS.getGeocoder(...)`.

Questo pattern permette al framework di crescere per composizione invece che tramite una singola classe monolitica.

## 4. Inizializzazione Servizi Core

Dopo il bootstrap, il `core` mette a disposizione diversi servizi trasversali.

### Datasource Runtime

`datasources.js` e' uno dei moduli piu' importanti del ciclo di vita.

Il suo ruolo e':

- caricare definizioni datasource;
- costruire oggetti `Datasource`;
- creare mapper di richiesta tramite `DatasourceRequestMapper`;
- validare e normalizzare i parametri di input;
- aprire connessioni;
- eseguire query;
- mappare i risultati;
- arricchire la risposta con metadata o helper.

Il ciclo tipico di una datasource e':

1. `aReS.loadDatasource(...)` riceve la configurazione;
2. viene creata o recuperata una `Datasource`;
3. le query dichiarate vengono trasformate in mapper;
4. ogni mapper puo' eseguire validazione input, query, mapping risultato e post-processing.

### Validazione e Normalizzazione

`dataDescriptors.js` definisce il sistema di formattazione/validazione dei dati.

Questo livello viene usato soprattutto dai mapper datasource:

- prende un oggetto sorgente;
- applica descriptor e regole di validazione;
- normalizza i valori;
- segnala errori in una struttura condivisa.

Nel ciclo di vita reale, questo passaggio avviene prima dell'esecuzione delle query.

### Utility di Sicurezza

`security.js` fornisce utility di cifratura e decifratura.

Queste utility:

- derivano una chiave da password;
- cifrano stringhe, oggetti e array;
- decifrano il contenuto mantenendo la struttura originale.

Nel life cycle del framework, queste funzioni non partono automaticamente, ma vengono chiamate dai moduli che hanno bisogno di proteggere dati o payload.

### Utility HTTP e Networking

`xhr.js` fornisce `XHRWrapper`, un wrapper sopra `axios`.

Serve a:

- costruire chiamate HTTP con base URL;
- impostare token Bearer;
- inviare richieste `GET`, `POST`, `PATCH`, `PUT`, `DELETE`;
- uniformare in parte la shape delle risposte.

Nel ciclo di vita del core, questo componente e' un servizio di infrastruttura riusabile da datasource, integrazioni esterne e moduli accessori.

### Permessi

`permissions.js` espone utility per verificare se una risorsa e' consentita a un certo utente.

Nel life cycle corrente il modulo:

- legge una sorgente di permessi;
- filtra in base a `userId`;
- verifica l'accesso a una risorsa;
- puo' alzare errore in caso di accesso negato.

Questo e' il livello base di autorizzazione su cui altri moduli possono costruire controlli piu' applicativi.

### Logging e Diagnostica

`console.js` fornisce due concetti:

- `asyncConsole`, che accumula messaggi e li stampa in un secondo momento;
- un override del `console` globale per aggiungere contesto ai log.

Nel ciclo di vita pratico, questo influenza tutto il runtime dopo l'import del modulo, perche' modifica il comportamento del logging di processo.

### Scripting e Reflection

`scripts.js` contiene utility di introspezione e trasformazione:

- lettura di docklet/commenti;
- estrazione metadati;
- riflessione su funzioni;
- generazione di facade dinamiche.

Questo livello serve a trasformare funzioni e descrizioni in comportamenti eseguibili o meta-programmati.

### Utility Accessorie

Il `core` contiene anche moduli accessori che possono essere usati in fasi specifiche:

- `commandLine.js` per una CLI interattiva;
- `geographical.js` per geocoding e reverse geocoding;
- utility generiche per date, array, oggetti, URL, XML, regex, testo e numeri.

Queste parti non sono necessariamente centrali nel bootstrap, ma fanno parte del toolbox runtime del framework.

## 5. Esecuzione di una Richiesta o Operazione

Un ciclo tipico lato business, usando il core, e' il seguente:

1. l'applicazione crea `aReS` con il proprio `appSetup`;
2. include i moduli necessari;
3. inizializza una datasource o un servizio;
4. arriva un input, ad esempio un request object o un payload;
5. il core valida e formatta i parametri;
6. viene verificato il permesso, se previsto dal flusso del modulo consumer;
7. il mapper esegue la query o la logica;
8. il risultato viene trasformato;
9. il consumer riceve un oggetto finale con dati, errori o metadata.

Il `core` quindi non rappresenta da solo l'intera applicazione, ma orchestra i mattoni fondamentali su cui si appoggiano gli altri moduli.

## 6. Stato Runtime

Durante l'esecuzione il core tende a mantenere stato in memoria dentro l'istanza `aReS` e dentro gli oggetti runtime associati.

Esempi:

- `ARES.instances` mantiene il registro delle istanze create;
- `aReS.datasourceMap` mantiene le datasource caricate;
- ogni `Datasource` puo' mantenere sessioni, pool e connessioni;
- moduli come `geographical.js` possono cacheare servizi come i geocoder per lingua.

Questo significa che il ciclo di vita del core non e' puramente stateless: c'e' una fase di bootstrap, una fase di accumulo stato e una fase di uso continuativo.

## 7. Chiusura e Cleanup

La chiusura non e' ancora completamente centralizzata nel `core`, ma alcuni componenti espongono primitive di cleanup.

Per esempio:

- `Datasource.close()` prova a chiudere le connessioni aperte.

In una visione architetturale, manca ancora un vero life-cycle manager unico che coordini:

- bootstrap;
- start completo;
- shutdown ordinato;
- rilascio risorse;
- flush log e cleanup finale.

## 8. Limiti Attuali del Life Cycle

Osservando il codice attuale, il life cycle del `core` e' potente ma ancora molto aperto.

I principali limiti architetturali sono:

- forte mutazione dell'istanza `aReS` da parte dei moduli;
- presenza di stato globale o condiviso;
- contratti non sempre uniformi tra moduli;
- side effect globali in alcuni componenti;
- dipendenze applicative non sempre isolate dal pacchetto core.

Questi aspetti non impediscono l'uso del framework, ma influenzano prevedibilita', testabilita' e publish come libreria indipendente.

## 9. Sintesi

In sintesi, il modulo `@ares/core` fa da motore del framework:

- crea l'istanza centrale `aReS`;
- conserva configurazione e stato runtime;
- permette l'inclusione modulare di funzionalita';
- offre servizi di validazione, datasource, sicurezza, networking e utility;
- supporta l'esecuzione delle operazioni applicative costruite dai moduli superiori.

Se si guarda il framework come un sistema a strati, il `core` e' lo strato fondamentale che definisce contesto, strumenti e convenzioni su cui si appoggia tutto il resto.
