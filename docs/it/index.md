# Documentazione `@ares/core`

## Scopo

Questa cartella raccoglie la documentazione specifica del modulo `@ares/core`.

Il modulo `core` e' lo strato fondamentale del framework aReS: crea l'istanza runtime condivisa, definisce il meccanismo di estensione dei moduli e ospita utility e servizi trasversali usati dagli altri pacchetti.

## Percorso di Lettura Consigliato

1. Leggere `core.md` per una panoramica tecnica del package e della sua API reale.
2. Leggere `api-surface.md` per capire quali moduli e sottopath del core sono da considerare stabili, transizionali o interni.
3. Leggere `life-cycle.md` per capire bootstrap, stato runtime, inclusione moduli e cleanup.
4. Leggere `strength.md` per il posizionamento del framework e gli elementi distintivi del core.

## Documenti Disponibili

- [Panoramica Tecnica](./core.md)
- [Classificazione API e Sottopath](./api-surface.md)
- [Life Cycle](./life-cycle.md)
- [Punti di Forza e Unicita'](./strength.md)

## Quando Usare Questa Documentazione

Questa documentazione e' utile quando serve:

- capire cosa espone davvero `@ares/core`;
- distinguere tra root API, sottopath stabili, moduli transizionali e helper interni;
- distinguere tra utility importabili direttamente e servizi agganciati via `include()`;
- orientarsi nella struttura interna del modulo;
- valutare il ruolo del core rispetto ai moduli superiori del framework.

## Nota

Questa cartella documenta il modulo `core`, non l'intero ecosistema aReS. Per i moduli specifici come `web`, `files`, `os` o `datasource-mysql` va consultata la documentazione locale di ciascun pacchetto.
