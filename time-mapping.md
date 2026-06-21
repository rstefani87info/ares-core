# Proposta per `time-mapping.js`

## Scopo

`time-mapping.js` puo' diventare una collezione di utility generali per lavorare con dati ordinati nel tempo, sia puntuali sia intervallari.

L'obiettivo non e' limitarsi a "date utilities", ma offrire primitive riusabili per:

- log tecnici e audit trail;
- eventi di dominio e timeline applicative;
- telemetry e metriche campionate;
- audio, video, sottotitoli, cue sheet e montaggio;
- schedule, finestre temporali, turni e calendari;
- analisi, segmentazione, aggregazione e sincronizzazione di sequenze temporali.

Il modulo dovrebbe essere agnostico rispetto al dominio: i dati possono rappresentare eventi, campioni, frame, parole, capitoli, marker, trigger, scene, stati o segmenti.

## Principi di design

- Tenere il core indipendente da player, database, DOM e codec.
- Favorire input semplici: `number`, `Date`, stringhe timecode, array di item, mappe, iteratori.
- Trattare il tempo come valore numerico normalizzato, con metadati opzionali.
- Distinguere con chiarezza eventi puntuali e segmenti con durata.
- Consentire precisione configurabile: millisecondi, microsecondi, frame, sample, beat.
- Rendere le utility componibili: parse -> normalize -> sort -> query -> transform -> export.
- Evitare assunzioni implicite sul timezone quando si lavora su timeline media o durate.
- Offrire funzioni pure dove possibile, con API prevedibili e facilmente testabili.

## Modello concettuale minimo

Il modulo dovrebbe poter lavorare almeno con questi shape logici:

### 1. Time point

Un evento puntuale nel tempo.

```js
{
  at: 1250,
  type: "log",
  value: "boot completed",
  meta: { level: "info" }
}
```

### 2. Time range

Un segmento con inizio e fine oppure inizio e durata.

```js
{
  start: 1200,
  end: 5600,
  label: "speech"
}
```

oppure:

```js
{
  start: 1200,
  duration: 4400,
  label: "speech"
}
```

### 3. Timed value

Un valore campionato in un certo istante o intervallo.

```js
{
  at: 240,
  value: 0.78
}
```

### 4. Track item

Un elemento collocato in una traccia logica.

```js
{
  track: "audio-1",
  start: 5000,
  end: 8000,
  kind: "clip",
  source: "voice-over.wav"
}
```

## Tipi di tempo da supportare

`time-mapping.js` dovrebbe saper convertire e normalizzare tra:

- millisecondi;
- secondi numerici;
- `Date`;
- timestamp unix;
- durata ISO-like o stringhe custom;
- `HH:mm:ss`;
- `HH:mm:ss.SSS`;
- timecode `HH:mm:ss,mmm` per sottotitoli;
- timecode SMPTE `HH:MM:SS:FF`;
- frame index;
- sample index;
- beat/bar per timeline musicali;
- offset relativi rispetto a un anchor.

## Gruppi di utility proposti

## 1. Parsing e formatting

Funzioni per leggere e produrre rappresentazioni temporali.

API immaginabili:

- `parseTime(value, options)`
- `formatTime(value, options)`
- `parseDuration(value, options)`
- `formatDuration(value, options)`
- `parseTimecode(value, options)`
- `formatTimecode(value, options)`
- `parseSrtTime(value)`
- `formatSrtTime(ms)`
- `parseSmpteTimecode(value, fps)`
- `formatSmpteTimecode(frameOrMs, fps, options)`
- `parseClockTime(value)`
- `formatClockTime(ms, options)`

Casi d'uso:

- convertire `"00:01:23.450"` in millisecondi;
- produrre stringhe per log leggibili;
- importare cue e sottotitoli;
- lavorare su editor audio/video.

## 2. Normalizzazione

Funzioni per rendere omogenei input eterogenei.

API immaginabili:

- `normalizeTimeValue(value, options)`
- `normalizeTimePoint(item, options)`
- `normalizeTimeRange(item, options)`
- `normalizeTimedItems(items, options)`
- `normalizeTrackItems(items, options)`
- `normalizeAnchor(value, options)`
- `coerceStartEndDuration(item, options)`
- `ensureSorted(items, options)`

Casi d'uso:

- trasformare item con `at`, `time`, `timestamp` o `date` in un formato comune;
- convertire item con `duration` in item con `end`;
- allineare precisione e unita' prima di analisi o merge.

## 3. Ordinamento e indicizzazione

Funzioni per preparare sequenze interrogabili velocemente.

API immaginabili:

- `sortByTime(items, options)`
- `sortByStart(items, options)`
- `sortByEnd(items, options)`
- `indexByTimeBucket(items, bucketSize, options)`
- `indexByTrack(items, options)`
- `indexByType(items, options)`
- `buildTimelineIndex(items, options)`
- `groupByContiguousRanges(items, options)`

Casi d'uso:

- ricerca rapida in grandi serie di log;
- suddivisione per minuto, frame window o segmento;
- creazione di indici per editor e analytics.

## 4. Query e ricerca

Funzioni per estrarre item o finestre temporali.

API immaginabili:

- `findAt(items, time, options)`
- `findActiveAt(items, time, options)`
- `findBetween(items, start, end, options)`
- `findOverlapping(items, range, options)`
- `findNearest(items, time, options)`
- `findPrevious(items, time, options)`
- `findNext(items, time, options)`
- `findGaps(items, options)`
- `findCoveredRanges(items, options)`
- `findSilences(items, options)`

Casi d'uso:

- sapere quale sottotitolo e' attivo a un timestamp;
- trovare il frame o log piu' vicino;
- identificare buchi in una registrazione o in una traccia.

## 5. Relazioni tra intervalli

Funzioni per analizzare come i segmenti si toccano tra loro.

API immaginabili:

- `overlaps(a, b, options)`
- `contains(range, target, options)`
- `intersects(a, b, options)`
- `touches(a, b, options)`
- `gapBetween(a, b, options)`
- `intersection(a, b, options)`
- `union(a, b, options)`
- `subtractRange(source, excluded, options)`
- `splitRange(range, splitPoints, options)`

Casi d'uso:

- editing non lineare;
- collision detection tra clip;
- validazione di schedule e finestre operative.

## 6. Trasformazioni di timeline

Funzioni per spostare, scalare o rifasare eventi e segmenti.

API immaginabili:

- `shiftTime(value, delta, options)`
- `shiftItems(items, delta, options)`
- `scaleTime(value, factor, options)`
- `scaleItems(items, factor, options)`
- `stretchRange(item, factor, options)`
- `trimRange(item, bounds, options)`
- `clipItems(items, bounds, options)`
- `offsetFromAnchor(items, anchor, options)`
- `rebaseTimeline(items, fromAnchor, toAnchor, options)`
- `quantizeTime(value, step, options)`
- `quantizeItems(items, step, options)`

Casi d'uso:

- ritardare una traccia;
- adattare un transcript a un audio rallentato;
- quantizzare marker o cue su una griglia.

## 7. Merge, split e stitching

Funzioni per assemblare o segmentare sequenze temporali.

API immaginabili:

- `mergeAdjacentRanges(items, options)`
- `mergeOverlappingRanges(items, options)`
- `concatTimelines(timelines, options)`
- `splitTimeline(items, splitPoints, options)`
- `chunkTimeline(items, windowSize, options)`
- `windowTimeline(items, windowSize, step, options)`
- `stitchSegments(items, options)`
- `dedupeTimedItems(items, options)`

Casi d'uso:

- consolidare intervalli adiacenti;
- spezzare una lunga registrazione in blocchi;
- unire spezzoni di log o tracce media.

## 8. Statistiche e metriche

Funzioni per misurare distribuzione, copertura e ritmi.

API immaginabili:

- `getTimelineBounds(items, options)`
- `getTotalDuration(items, options)`
- `getCoveredDuration(items, options)`
- `getGapDuration(items, options)`
- `getDensity(items, options)`
- `getEventRate(items, windowSize, options)`
- `getAverageGap(items, options)`
- `getRangeStats(items, options)`
- `summarizeTimeline(items, options)`

Casi d'uso:

- capire densita' di eventi in un log;
- misurare parlato vs silenzio;
- stimare copertura di sottotitoli o clip.

## 9. Bucket, aggregazione e campionamento

Funzioni per trasformare serie temporali in viste aggregate.

API immaginabili:

- `bucketize(items, bucketSize, options)`
- `aggregateByBucket(items, bucketSize, reducer, options)`
- `resampleSeries(items, targetStep, options)`
- `downsampleSeries(items, options)`
- `upsampleSeries(items, options)`
- `interpolateSeries(items, options)`
- `fillMissingSamples(items, options)`
- `rollingWindow(items, windowSize, reducer, options)`

Casi d'uso:

- telemetry e metriche;
- wave envelope semplificate;
- grafici temporali e dashboard.

## 10. Tracce e multi-traccia

Funzioni per timeline organizzate per lane o layer.

API immaginabili:

- `createTrack(name, options)`
- `assignTrack(item, track, options)`
- `groupIntoTracks(items, options)`
- `flattenTracks(tracks, options)`
- `getTrackBounds(track, options)`
- `detectTrackConflicts(track, options)`
- `compactTracks(items, options)`
- `stackTracks(items, options)`
- `routeItemsByTrack(items, options)`

Casi d'uso:

- editor video/audio;
- timeline di workflow paralleli;
- visualizzazioni gantt-like.

## 11. Utility specifiche per log ed eventi

Funzioni orientate a eventi applicativi o audit trail.

API immaginabili:

- `sequenceEvents(events, options)`
- `correlateEvents(events, options)`
- `computeLatency(events, options)`
- `pairStartEndEvents(events, options)`
- `collapseRepeatedEvents(events, options)`
- `detectAnomalousGaps(events, options)`
- `buildSessionTimeline(events, options)`
- `extractStateRanges(events, options)`
- `reconstructTransitions(events, options)`

Casi d'uso:

- request/response tracing;
- session replay semantico;
- conversione di eventi puntuali in stati intervallari.

## 12. Utility specifiche per audio/video

Funzioni orientate a clip, cue, frame e segmenti media.

API immaginabili:

- `msToFrames(ms, fps)`
- `framesToMs(frames, fps)`
- `samplesToMs(samples, sampleRate)`
- `msToSamples(ms, sampleRate)`
- `snapToFrame(value, fps, options)`
- `buildCuePoints(items, options)`
- `buildChapters(items, options)`
- `detectSceneBoundaries(items, options)`
- `alignAudioAndSubtitles(audioMarkers, subtitles, options)`
- `computePlaybackSegments(items, options)`
- `expandCrossfades(items, options)`

Casi d'uso:

- montaggio e cueing;
- sincronizzazione audio/subtitle;
- gestione marker di scena o capitolo.

## 13. Utility specifiche per sottotitoli e transcript

Funzioni per token, caption e segmenti testuali temporizzati.

API immaginabili:

- `parseSrt(content, options)`
- `formatSrt(items, options)`
- `parseVtt(content, options)`
- `formatVtt(items, options)`
- `normalizeSubtitleItems(items, options)`
- `shiftSubtitles(items, delta, options)`
- `mergeSubtitleLines(items, options)`
- `splitSubtitleByLength(item, options)`
- `splitSubtitleByPause(item, options)`
- `alignTranscriptWords(words, segments, options)`
- `buildTranscriptTimeline(words, options)`

Casi d'uso:

- import/export sottotitoli;
- retiming dopo editing;
- segmentazione leggibile a schermo.

## 14. Utility per calendari e schedule

Pur restando timeline-centriche, alcune utility possono aiutare su casi data/ora reali.

API immaginabili:

- `expandRecurringRanges(rule, bounds, options)`
- `clipToBusinessHours(items, options)`
- `mergeAvailabilityRanges(items, options)`
- `subtractBusyRanges(free, busy, options)`
- `findFirstAvailableSlot(ranges, duration, options)`
- `findAvailableSlots(ranges, duration, options)`
- `mapEventsToDays(items, options)`

Casi d'uso:

- disponibilita';
- turni;
- finestre operative;
- booking e prenotazioni.

## 15. Sincronizzazione tra timeline eterogenee

Funzioni per correlare timeline diverse ma riferite allo stesso fenomeno.

API immaginabili:

- `alignTimelines(left, right, options)`
- `estimateOffset(left, right, options)`
- `estimateDrift(left, right, options)`
- `applyOffset(items, offset, options)`
- `applyDriftCorrection(items, driftModel, options)`
- `mapTimeBetweenTimelines(value, mapping, options)`
- `buildTimeMap(controlPoints, options)`

Casi d'uso:

- sottotitoli sfasati;
- audio e video con drift;
- importazioni da sorgenti con clock diversi.

## 16. Qualita', validazione e diagnostica

Funzioni per verificare consistenza e segnalare problemi.

API immaginabili:

- `validateTimedItem(item, options)`
- `validateTimeline(items, options)`
- `detectNegativeDurations(items, options)`
- `detectOverlaps(items, options)`
- `detectOutOfOrderItems(items, options)`
- `detectDuplicateMarkers(items, options)`
- `detectImpossibleTransitions(items, options)`
- `explainTimelineIssues(items, options)`

Casi d'uso:

- import robusto;
- correzione dati;
- pipeline ETL;
- editor con feedback immediato.

## 17. Serializzazione ed export

Funzioni per salvare o trasmettere strutture timeline.

API immaginabili:

- `serializeTimeline(items, options)`
- `deserializeTimeline(payload, options)`
- `toTimeMap(items, options)`
- `fromTimeMap(map, options)`
- `toSegments(items, options)`
- `toCueSheet(items, options)`
- `toMarkers(items, options)`
- `toChartSeries(items, options)`

Casi d'uso:

- integrazione con storage;
- passaggio dati a UI timeline;
- export verso altri moduli aReS.

## Primitive fondamentali consigliate

Se si vuole partire piccoli, il cuore del modulo dovrebbe almeno includere queste funzioni:

- `normalizeTimeValue()`
- `normalizeTimePoint()`
- `normalizeTimeRange()`
- `sortByTime()`
- `findAt()`
- `findBetween()`
- `findOverlapping()`
- `shiftItems()`
- `mergeAdjacentRanges()`
- `mergeOverlappingRanges()`
- `getTimelineBounds()`
- `getTotalDuration()`
- `findGaps()`
- `bucketize()`
- `buildTimeMap()`
- `mapTimeBetweenTimelines()`

Con questo primo nucleo il modulo e' gia' utile per log, eventi e media.

## Convenzioni API suggerite

Per mantenere il modulo coerente, ogni funzione dovrebbe seguire convenzioni stabili.

### Unita' di default

- default su millisecondi numerici per timeline relative;
- `Date` e timestamp solo quando si lavora su tempo assoluto;
- conversioni esplicite, mai implicite.

### Inclusivita' dei bordi

Serve una convenzione unica per gli intervalli:

- suggerito: `start` incluso, `end` escluso;
- opzionalmente configurabile con `options.bounds`.

Questa scelta evita ambiguita' su segmenti adiacenti.

### Naming dei campi

Supportare alias in input, ma produrre output normalizzato:

- punti: `at`
- intervalli: `start`, `end`, `duration`
- tracce: `track`
- tipo: `type` o `kind`
- metadati liberi: `meta`

### Opzioni comuni

Molte funzioni potrebbero condividere:

- `unit`
- `fps`
- `sampleRate`
- `precision`
- `bounds`
- `getStart`
- `getEnd`
- `getAt`
- `getTrack`
- `inclusive`
- `sort`

## Use case trasversali da coprire

Il design dovrebbe permettere senza hack gli scenari seguenti:

- cercare tutti gli errori applicativi in una finestra temporale;
- trasformare start/end event in sessioni;
- calcolare latenza tra coppie di eventi correlati;
- determinare quale caption e' attiva a `t`;
- applicare un offset a tutti i sottotitoli;
- unire segmenti audio consecutivi se separati da silenzi brevi;
- creare capitoli a partire da marker;
- mappare parole di transcript su segmenti frase;
- identificare buchi o overlap in una traccia video;
- aggregare campioni numerici per finestre da 1 secondo;
- stimare drift tra timeline provenienti da sorgenti diverse.

## Possibile roadmap

### Fase 1 - Core puro

- parsing base;
- normalizzazione;
- ordinamento;
- query intervallari;
- shift/merge/gap;
- metriche base.

### Fase 2 - Timeline avanzate

- bucketizzazione;
- time map tra sorgenti;
- multi-track;
- validazione e diagnostica.

### Fase 3 - Domini specifici

- sottotitoli;
- audio/video;
- log analytics;
- schedule e disponibilita'.

## Possibile struttura interna del file

Se si vuole lasciare `time-mapping.js` come file singolo iniziale, una struttura ragionevole potrebbe essere:

```js
// parse / format
// normalize
// sort / index
// query
// range relations
// transforms
// merge / split
// stats
// buckets / sampling
// tracks
// sync / mapping
// validation
// domain helpers: logs, subtitles, media
```

Quando il file cresce, si puo' poi estrarre in sottopath senza rompere la root API.

## Proposta finale

`time-mapping.js` non dovrebbe essere pensato come una singola utility per le date, ma come un mini-toolkit di algebra delle timeline.

La sua responsabilita' ideale e':

- rappresentare tempo, durate e segmenti;
- interrogare e trasformare sequenze temporali;
- fare da base comune per log, eventi, media, transcript e scheduling.

Se implementato bene, questo file puo' diventare una dipendenza trasversale molto riusabile dentro l'ecosistema aReS.
