import test from "node:test";
import assert from "node:assert/strict";

import timeMapping, {
  aggregateByBucket,
  alignTimelines,
  applyOffset,
  buildTimeMap,
  computeLatency,
  detectTrackConflicts,
  estimateDrift,
  estimateOffset,
  findActiveAt,
  findAt,
  findBetween,
  findGaps,
  formatSmpteTimecode,
  formatSrt,
  formatSrtTime,
  getCoveredDuration,
  getTimelineBounds,
  mapTimeBetweenTimelines,
  mergeOverlappingRanges,
  normalizeTimePoint,
  normalizeTimeRange,
  pairStartEndEvents,
  parseDuration,
  parseSmpteTimecode,
  parseSrt,
  parseSrtTime,
  shiftItems,
  summarizeTimeline,
  extractStateRanges
} from "@ares/core/time-mapping.js";

test("time-mapping subpath export resolves both default and named helpers", async () => {
  const imported = await import("@ares/core/time-mapping");

  assert.equal(typeof imported.normalizeTimeValue, "function");
  assert.equal(typeof imported.parseDuration, "function");
  assert.equal(typeof timeMapping.findBetween, "function");
  assert.equal(imported.default.parseDuration("1s"), 1000);
});

test("parsing helpers cover durations, SRT and SMPTE timecode", () => {
  assert.equal(parseDuration("1h 2m 3s 4ms"), 3723004);
  assert.equal(parseDuration("01:02:03.250"), 3723250);
  assert.equal(parseSrtTime("00:01:02,345"), 62345);
  assert.equal(formatSrtTime(62345), "00:01:02,345");
  assert.equal(parseSmpteTimecode("00:00:01:12", 25), 1480);
  assert.equal(formatSmpteTimecode(1000, 25), "00:00:01:00");
});

test("normalization, search, merge and summary work on mixed timeline data", () => {
  const segments = [
    { start: 0, end: 2000, track: "a" },
    { start: 1900, end: 3000, track: "a" },
    { start: 5000, duration: 1000, track: "a" },
    { at: 2500, type: "marker" }
  ];

  assert.deepEqual(normalizeTimePoint({ time: "00:00:02.500" }), { time: "00:00:02.500", at: 2500 });
  assert.deepEqual(normalizeTimeRange({ from: 1000, duration: 500 }), {
    from: 1000,
    duration: 500,
    start: 1000,
    end: 1500
  });

  assert.equal(findAt(segments, 2500).length, 1);
  assert.equal(findActiveAt(segments, 2100).length, 1);
  assert.equal(findBetween(segments, 1800, 2600).length, 3);

  const merged = mergeOverlappingRanges(segments.filter((item) => item.start !== undefined));
  assert.deepEqual(merged, [
    { start: 0, end: 3000, duration: 3000, track: "a" },
    { start: 5000, end: 6000, duration: 1000, track: "a" }
  ]);

  const gaps = findGaps(merged, { boundsRange: { start: 0, end: 7000 } });
  assert.deepEqual(gaps, [
    { start: 3000, end: 5000, duration: 2000 },
    { start: 6000, end: 7000, duration: 1000 }
  ]);

  assert.equal(getCoveredDuration(merged), 4000);
  assert.deepEqual(getTimelineBounds(segments), { start: 0, end: 6000, duration: 6000 });
  assert.deepEqual(summarizeTimeline(merged), {
    itemCount: 2,
    rangeCount: 2,
    pointCount: 0,
    bounds: { start: 0, end: 6000, duration: 6000 },
    totalDuration: 4000,
    coveredDuration: 4000,
    gapDuration: 2000,
    averageGap: 2000,
    trackCount: 1
  });
});

test("tracks, offsets and alignment helpers keep timelines comparable", () => {
  const trackItems = [
    { start: 0, end: 1000, track: "music" },
    { start: 900, end: 1500, track: "music" },
    { start: 0, end: 1200, track: "voice" }
  ];

  const conflicts = detectTrackConflicts(trackItems);
  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].track, "music");
  assert.deepEqual(conflicts[0].overlap, { start: 900, end: 1000, duration: 100 });

  const left = [{ at: 0 }, { at: 1000 }, { at: 2000 }];
  const right = [{ at: 100 }, { at: 1200 }, { at: 2300 }];
  const timeMap = buildTimeMap([
    [0, 100],
    [1000, 1200],
    [2000, 2300]
  ]);

  assert.equal(mapTimeBetweenTimelines(1500, timeMap), 1750);
  assert.equal(estimateOffset(left, [{ at: 100 }, { at: 1100 }, { at: 2100 }]), 100);
  assert.deepEqual(estimateDrift(left, right), { scale: 1.1, offset: 100 });
  assert.deepEqual(applyOffset([{ at: 0 }, { start: 1000, end: 1500 }], 250), [
    { at: 250 },
    { start: 1250, end: 1750 }
  ]);

  const alignment = alignTimelines(left, right);
  assert.equal(alignment.offset, 200);
  assert.equal(Math.round(alignment.drift.scale * 10) / 10, 1.1);
});

test("SRT parsing and formatting preserve text timeline structure", () => {
  const content = [
    "1",
    "00:00:01,000 --> 00:00:03,000",
    "Hello world",
    "",
    "2",
    "00:00:04,500 --> 00:00:05,000",
    "Bye"
  ].join("\n");

  const items = parseSrt(content);
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], {
    index: 1,
    start: 1000,
    end: 3000,
    duration: 2000,
    text: "Hello world",
    lines: ["Hello world"]
  });

  const serialized = formatSrt(items);
  assert.match(serialized, /00:00:01,000 --> 00:00:03,000/);
  assert.match(serialized, /Hello world/);
  assert.match(serialized, /00:00:04,500 --> 00:00:05,000/);
});

test("event pairing, state extraction and bucket aggregation support audit-style timelines", () => {
  const events = [
    { at: 0, id: "job-1", phase: "start", state: "idle" },
    { at: 1000, id: "job-1", phase: "end", state: "running" },
    { at: 1500, id: "job-2", phase: "start", state: "running" },
    { at: 2300, id: "job-2", phase: "end", state: "done" }
  ];

  const pairs = pairStartEndEvents(events);
  assert.equal(pairs.length, 2);
  assert.equal(pairs[0].duration, 1000);
  assert.equal(computeLatency(events[0], events[1]), 1000);

  const stateRanges = extractStateRanges(events, { end: 3000 });
  assert.deepEqual(stateRanges.map((item) => ({
    state: item.state,
    start: item.start,
    end: item.end
  })), [
    { state: "idle", start: 0, end: 1000 },
    { state: "running", start: 1000, end: 1500 },
    { state: "running", start: 1500, end: 2300 },
    { state: "done", start: 2300, end: 3000 }
  ]);

  const buckets = aggregateByBucket(events, 1000, (bucketItems) => bucketItems.length, {
    boundsRange: { start: 0, end: 3000 }
  });
  assert.deepEqual(buckets.map((bucket) => bucket.value), [1, 2, 1]);

  assert.deepEqual(shiftItems([{ at: 100 }, { start: 200, end: 400 }], 50), [
    { at: 150 },
    { start: 250, end: 450 }
  ]);
});
