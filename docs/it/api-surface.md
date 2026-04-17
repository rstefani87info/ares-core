# Classificazione API `@ares/core`

## Scopo

Questo documento definisce una classificazione operativa dei moduli del package `@ares/core`, distinguendo tra:

- API root stabile;
- sottopath pubblici stabili;
- moduli pubblici di estensione del runtime;
- moduli transizionali ancora usati nel workspace ma non ancora abbastanza solidi da essere considerati stabili;
- moduli interni o sperimentali.

L'obiettivo e' preparare il terreno per una futura mappa `exports` senza rompere i package aReS che oggi importano sottopath del `core`.

## Regola Generale

- `@ares/core` root espone il bootstrap e la classe `ARES`.
- I sottopath vanno considerati pubblici solo se rientrano esplicitamente in una delle categorie supportate qui sotto.
- I moduli `transitional` restano importabili nel workspace corrente, ma non dovrebbero essere usati come base per nuove integrazioni senza una successiva stabilizzazione.
- I moduli `internal` non dovrebbero entrare in una futura `exports` map pubblica.

## 1. Stable Root

### `@ares/core`

Entrypoint stabile del package.

File:

- `index.js`

Contratto previsto:

- bootstrap tramite `aReSInitialize(setup, options?)`;
- classe `ARES`;
- registry delle istanze;
- `aReS.include(module)` come meccanismo di composizione del runtime.

## 2. Stable Subpaths

Questi moduli sono candidati a essere supportati come sottopath pubblici stabili.

### Utility pure e mature

- `@ares/core/crypto.js`
- `@ares/core/text.js`
- `@ares/core/url.js`
- `@ares/core/xml.js`
- `@ares/core/regex.js`
- `@ares/core/i18n.js`
- `@ares/core/datesAndTime.js`

File corrispondenti:

- `crypto.js`
- `text.js`
- `url.js`
- `xml.js`
- `regex.js`
- `i18n.js`
- `datesAndTime.js`

Caratteristiche attese:

- funzioni importabili direttamente;
- dipendenza minima dallo stato runtime di `aReS`;
- semantica abbastanza chiara per essere documentata come contratto pubblico.

## 3. Runtime Extensions

Questi moduli sono pubblici, ma il loro contratto e' orientato soprattutto all'estensione del runtime `aReS` tramite `include()`, oppure a servizi framework-centrici.

Sottopath candidati:

- `@ares/core/datasources.js`
- `@ares/core/dataDescriptors.js`
- `@ares/core/permissions.js`
- `@ares/core/commandLine.js`
- `@ares/core/geographical.js`

File corrispondenti:

- `datasources.js`
- `dataDescriptors.js`
- `permissions.js`
- `commandLine.js`
- `geographical.js`

Caratteristiche attese:

- dipendenza dal contesto `aReS` o da convenzioni del framework;
- presenza di `aReSInitialize(aReS)` oppure di classi/servizi runtime;
- contratto pubblico supportato, ma meno "generico" delle utility pure.

## 4. Transitional Public

Questi moduli sono gia' usati da consumer del workspace, quindi non possono essere rimossi o nascosti in modo brusco. Pero' non sono ancora adatti a essere dichiarati API pubbliche stabili senza un ulteriore hardening.

Sottopath da considerare transizionali:

- `@ares/core/console.js`
- `@ares/core/security.js`
- `@ares/core/xhr.js`
- `@ares/core/objects.js`
- `@ares/core/scripts.js`
- `@ares/core/arrays.js`
- `@ares/core/dates.js`
- `@ares/core/trees.js`

Motivi tipici della classificazione transizionale:

- presenza di accoppiamenti forti con il runtime o con convenzioni applicative;
- bug o refactor recenti che suggeriscono prudenza;
- superficie API ampia ma non ancora formalizzata;
- uso reale da parte di altri package aReS che impone compatibilita' nel breve periodo.

## 5. Internal O Experimental

Questi moduli non dovrebbero essere pubblicizzati come API supportate.

File:

- `flow.js`
- `prototype.js`
- `errorHandling.js`
- `numbers.js`

Indicazione:

- tenerli fuori da una futura `exports` map pubblica;
- mantenerli accessibili solo internamente o dopo una stabilizzazione dedicata;
- evitare nuovi consumer diretti nel workspace.

## 6. Evidenze Nel Workspace

Nel workspace esistono gia' import diretti verso sottopath del `core`. Alcuni esempi:

- `@ares/core/datasources.js`
- `@ares/core/dataDescriptors.js`
- `@ares/core/console.js`
- `@ares/core/security.js`
- `@ares/core/xhr.js`
- `@ares/core/objects.js`
- `@ares/core/scripts`
- `@ares/core/crypto`

Questo significa che la classificazione non e' solo documentale: qualsiasi restrizione tecnica sui sottopath richiede una migrazione coordinata degli altri moduli aReS.

## 7. Forma Canonica Degli Import

Per coerenza ESM, la forma canonica raccomandata per i sottopath documentati e':

```javascript
import { asyncConsole } from "@ares/core/console.js";
import { getSHA256Hash } from "@ares/core/crypto.js";
```

Nel workspace esistono ancora import legacy senza estensione, ad esempio:

```javascript
import * as crypto from "@ares/core/crypto";
import { getByPropertyPath } from "@ares/core/scripts";
```

Questi import vanno considerati compatibilita' storica, non forma target per nuova documentazione o nuove integrazioni.

## 8. Piano Di Migrazione Consigliato

Ordine suggerito:

1. Documentare la classificazione dei moduli.
2. Standardizzare gli import del workspace verso la forma canonica.
3. Verificare che nessun package dipenda da sottopath `internal`.
4. Introdurre una `exports` map in `package.json`.
5. Deprecare gradualmente i sottopath transizionali o le forme legacy senza estensione.

## 9. Sintesi Operativa

In questa fase:

- `index.js` e' il contratto root stabile;
- un sottoinsieme di utility e moduli runtime puo' essere trattato come pubblico supportato;
- alcuni sottopath restano pubblici solo in modo transizionale per compatibilita' col workspace;
- i moduli interni non dovrebbero entrare nel contratto pubblico futuro del package.

## 10. Separazione Tra Core Puro E Moduli Infrastrutturali

La struttura attuale del package mostra due famiglie diverse di responsabilita':

- `core puro`: bootstrap runtime, composizione moduli, utility generiche, security di base, parsing e supporto applicativo;
- `moduli infrastrutturali`: networking HTTP, geocoding, CLI interattiva, runtime datasource e integrazione con sessioni o driver esterni.

### Moduli Da Considerare Core Puro

- `index.js`
- `crypto.js`
- `text.js`
- `url.js`
- `xml.js`
- `regex.js`
- `i18n.js`
- `datesAndTime.js`
- `arrays.js`
- `objects.js`
- `dates.js`
- `trees.js`
- `permissions.js`

Questi moduli sono piu' vicini a un contratto di base del framework oppure a utility riusabili senza forte dipendenza dall'infrastruttura host.

### Moduli Accoppiati All'Infrastruttura

- `xhr.js`
- `geographical.js`
- `commandLine.js`
- `datasources.js`
- `dataDescriptors.js`

Motivi principali:

- `xhr.js` dipende direttamente da `axios` e modella un client HTTP;
- `geographical.js` dipende da provider remoti e quote esterne, sempre via `axios`;
- `commandLine.js` lega il package a `stdin`, `stdout` e processi interattivi Node;
- `datasources.js` dipende da sessioni HTTP, connessioni native, transazioni e driver esterni;
- `dataDescriptors.js` e' strettamente collegato al runtime datasource e al formatting applicativo.

### Decisione Architetturale Consigliata

La valutazione suggerisce di:

1. mantenere questi moduli ancora nel package `core` per compatibilita' del workspace;
2. classificarli come `Runtime Extensions` o `Transitional Public`, non come `core puro`;
3. pianificare una futura estrazione in package dedicati, ad esempio `@ares/http`, `@ares/geocoding`, `@ares/cli` e un package datasource/runtime separato;
4. evitare di introdurre nuove utility infrastrutturali direttamente nel package `@ares/core`.

### Impatto Sul Contratto Del Package

Nel breve periodo il package puo' continuare a esportare questi moduli, ma la documentazione dovrebbe trattarli come estensioni del runtime e non come fondamento minimo del framework.

In altre parole:

- `@ares/core` resta il contenitore storico;
- il `core puro` rappresenta il contratto da proteggere nel lungo periodo;
- i moduli infrastrutturali vanno considerati candidati a separazione, non baseline del package.
