# @ares/core

## Scopo

Il modulo `@ares/core` e' il fondamento runtime del framework aReS. Non e' solo una raccolta di utility: definisce l'istanza centrale `ARES`, il bootstrap del contesto applicativo e una serie di moduli tecnici che possono essere importati direttamente o inclusi per estendere il runtime.

## Cosa Espone Davvero il Package Root

L'entrypoint principale e' `index.js`.

Dal package root vengono esposti:

- la classe `ARES`;
- la funzione di default `aReSInitialize(setup, options?)`;
- i metodi di istanza `include()`, `getConfig(path)` e `getPolicy(name)`, oltre alla property `isProduction`;
- la gestione statica delle istanze tramite `ARES.instances` e `ARES.getInstance(name)`.

Il package root non espone automaticamente tutte le utility come proprieta' dell'istanza `aReS`. Le utility del core vivono soprattutto nei singoli file del modulo e vanno importate esplicitamente oppure rese disponibili tramite moduli che estendono l'istanza.

## Bootstrap

Il flusso minimo di bootstrap e' questo:

```javascript
import aReSInitialize from '@ares/core';

const aReS = aReSInitialize({
  name: 'my-app',
  environments: []
});
```

Questo crea una nuova istanza `ARES` con:

- validazione di `setup.name`, che deve essere una stringa non vuota;
- `appSetup` come configurazione applicativa;
- `idMap` come struttura di supporto per identificativi;
- registrazione dell'istanza nel registry del runtime.

Di default il bootstrap rifiuta la creazione di una seconda istanza con lo stesso `name` e lancia un errore.

```javascript
const aReS = aReSInitialize(
  { name: 'my-app', environments: [] },
  { onDuplicate: 'throw' }
);
```

Le policy supportate per `onDuplicate` sono:

- `throw` per fallire su nomi duplicati;
- `replace` per sostituire l'istanza registrata;
- `reuse` per riutilizzare l'istanza gia' presente.

## API Principale dell'Istanza

### `aReS.appSetup`

Contiene la configurazione applicativa passata al bootstrap.

Il bootstrap normalizza anche due contenitori dedicati:

- `appSetup.config` per opzioni runtime del framework;
- `appSetup.policies` per policy applicative iniettate dal consumer.

Questo evita che i moduli del core dipendano da file esterni al pacchetto o da lookup hard-coded verso la struttura dell'app host.

### `aReS.idMap`

Mantiene una struttura con `idKeyMap` e `hashKeyMap`.

### `aReS.getConfig(path, fallback?)`

Recupera configurazione runtime da `appSetup.config` con path dot-notation, per esempio `geocoders.enabled`.

### `aReS.getPolicy(name, fallback?)`

Recupera policy runtime da `appSetup.policies`, per esempio `permissions`.

### `aReS.isProduction`

Restituisce `true` se negli ambienti configurati esiste un environment selezionato con `type === 'production'`.

### `aReS.include(module)`

Consente di estendere l'istanza corrente con un modulo che esporta `aReSInitialize(aReS)`.

```javascript
import aReSInitialize from '@ares/core';
import * as datasourceRuntime from '@ares/core/datasources.js';

const aReS = aReSInitialize({ name: 'my-app', environments: [] });
aReS.include(datasourceRuntime);
```

### `ARES.getInstance(name)`

Permette di recuperare una delle istanze registrate nel runtime.

### `ARES.instances`

Espone una vista in sola lettura delle istanze registrate, indicizzate per `name`.

## Struttura del Modulo

Il modulo `core` e' composto da piu' file specializzati. I principali gruppi funzionali sono:

### Runtime e composizione

- `index.js` per bootstrap e gestione istanze;
- `datasources.js` per datasource runtime, mapper e connessioni;
- `dataDescriptors.js` per formattazione e validazione dati.

### Sicurezza e permessi

- `security.js` per cifratura e decifratura;
- `crypto.js` per hash e utility crittografiche;
- `permissions.js` per controlli di autorizzazione.

### Infrastruttura e integrazione

- `xhr.js` per richieste HTTP via wrapper;
- `commandLine.js` per CLI interattiva;
- `geographical.js` per geocoding e reverse geocoding;
- `console.js` per logging e diagnostica.

### Utility generiche

- `arrays.js`, `objects.js`, `text.js`, `regex.js`, `numbers.js`;
- `dates.js`, `datesAndTime.js`, `url.js`, `xml.js`, `trees.js`;
- `flow.js`, `prototype.js`, `scripts.js`, `errorHandling.js`, `i18n.js`.

## Modalita' d'Uso Corrette

Nel codice attuale ci sono due modalita' principali di utilizzo:

### 1. Import diretto delle utility

```javascript
import { capitalize } from '@ares/core/text.js';
import { getSHA256Hash } from '@ares/core/crypto.js';
```

Questo e' il modo piu' diretto per usare le utility pure del core.

### 2. Estensione dell'istanza `aReS`

```javascript
import aReSInitialize from '@ares/core';
import * as commandLineModule from '@ares/core/commandLine.js';

const aReS = aReSInitialize({ name: 'my-app', environments: [] });
aReS.include(commandLineModule);

aReS.initCommandLine({});
```

Questo modello viene usato quando un modulo vuole aggiungere servizi o comportamenti all'istanza runtime.

## Cosa Non Assumere

Per evitare ambiguita', e' utile chiarire cosa il modulo non garantisce automaticamente:

- non costruisce da solo un'applicazione completa;
- non aggancia tutte le utility all'istanza `aReS` in automatico;
- non implementa un life-cycle manager centralizzato di start e shutdown;
- non sostituisce i moduli superiori come `web` o i datasource specifici.

## Dipendenze

Le dipendenze dichiarate in `package.json` sono coerenti con il ruolo del modulo:

- `axios`
- `crypto-js`
- `json2xml`
- `lodash`
- `moment`
- `moment-timezone`
- `nanoid`
- `numeral`

## Documenti Correlati

- `index.md` per l'indice della documentazione del modulo;
- `life-cycle.md` per il funzionamento runtime del core;
- `strength.md` per posizionamento, punti di forza e unicita'.
