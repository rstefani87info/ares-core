const DEFAULT_BOUNDS = "[)";
const DEFAULT_POINT_KEYS = ["at", "time", "timestamp", "ts", "date"];
const DEFAULT_START_KEYS = ["start", "from", "begin", "in"];
const DEFAULT_END_KEYS = ["end", "to", "until", "out"];
const DEFAULT_DURATION_KEYS = ["duration", "length", "len"];
const DEFAULT_TRACK_KEYS = ["track", "lane", "channel", "layer"];
const TIME_UNIT_TO_MS = Object.freeze({
    ms: 1,
    millisecond: 1,
    milliseconds: 1,
    s: 1000,
    sec: 1000,
    second: 1000,
    seconds: 1000,
    m: 60 * 1000,
    min: 60 * 1000,
    minute: 60 * 1000,
    minutes: 60 * 1000,
    h: 60 * 60 * 1000,
    hr: 60 * 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
});

function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
}

function hasOwn(object, key) {
    return object != null && Object.prototype.hasOwnProperty.call(object, key);
}

function ensureArray(value) {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
}

function cloneItem(item) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
        return { ...item };
    }

    return item;
}

function toUnitFactor(unit = "ms") {
    const factor = TIME_UNIT_TO_MS[String(unit).toLowerCase()];
    if (!factor) {
        throw new TypeError(`Unsupported time unit "${unit}"`);
    }

    return factor;
}

export function convertTimeUnit(value, fromUnit = "ms", toUnit = "ms") {
    if (!isFiniteNumber(value)) {
        throw new TypeError("convertTimeUnit(value) expects a finite number");
    }

    const fromFactor = toUnitFactor(fromUnit);
    const toFactor = toUnitFactor(toUnit);
    return (value * fromFactor) / toFactor;
}

function normalizeNumericValue(value, options = {}) {
    if (!isFiniteNumber(value)) {
        throw new TypeError("Expected a finite numeric time value");
    }

    return convertTimeUnit(value, options.unit ?? "ms", "ms");
}

function padInt(value, digits = 2) {
    return String(Math.trunc(Math.abs(value))).padStart(digits, "0");
}

function formatFraction(milliseconds, digits = 3) {
    if (digits <= 0) return "";
    return String(Math.trunc(Math.abs(milliseconds))).padStart(3, "0").slice(0, digits);
}

function splitBounds(bounds = DEFAULT_BOUNDS) {
    const normalizedBounds = typeof bounds === "string" && bounds.length === 2 ? bounds : DEFAULT_BOUNDS;
    return {
        startInclusive: normalizedBounds[0] === "[",
        endInclusive: normalizedBounds[1] === "]"
    };
}

function compareBoundary(left, right, leftIncluded, rightIncluded, tolerance = 0) {
    if (left < right - tolerance) return true;
    if (Math.abs(left - right) <= tolerance) {
        return leftIncluded && rightIncluded;
    }

    return false;
}

function resolveAccessor(item, accessor, fallbackKeys = []) {
    if (typeof accessor === "function") {
        return accessor(item);
    }

    const keys = typeof accessor === "string" ? [accessor] : fallbackKeys;
    for (const key of keys) {
        if (hasOwn(item, key) && item[key] !== undefined && item[key] !== null) {
            return item[key];
        }
    }

    return undefined;
}

function looksLikeIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}(?:[T\s].*)?$/.test(value.trim());
}

function parseColonDuration(value) {
    const normalized = String(value).trim().replace(",", ".");
    const sign = normalized.startsWith("-") ? -1 : 1;
    const unsigned = normalized.replace(/^[+-]/, "");
    const parts = unsigned.split(":");

    if (parts.length < 2 || parts.length > 3) {
        throw new TypeError(`Invalid colon duration "${value}"`);
    }

    const parsedParts = parts.map((part) => Number(part));
    if (parsedParts.some((part) => Number.isNaN(part))) {
        throw new TypeError(`Invalid colon duration "${value}"`);
    }

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (parts.length === 2) {
        minutes = parsedParts[0];
        seconds = parsedParts[1];
    } else {
        hours = parsedParts[0];
        minutes = parsedParts[1];
        seconds = parsedParts[2];
    }

    return sign * Math.round((((hours * 60) + minutes) * 60 + seconds) * 1000);
}

export function parseClockTime(value) {
    if (isFiniteNumber(value)) return Math.trunc(value);
    if (value instanceof Date) {
        return (((value.getHours() * 60) + value.getMinutes()) * 60 + value.getSeconds()) * 1000 + value.getMilliseconds();
    }

    const match = /^([+-])?(\d{1,3}):([0-5]\d)(?::([0-5]\d)([.,]\d{1,3})?)?$/.exec(String(value).trim());
    if (!match) {
        throw new TypeError(`Invalid clock time "${value}"`);
    }

    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3]);
    const seconds = Number(match[4] ?? 0);
    const milliseconds = Number(`0${(match[5] ?? "").replace(",", ".")}`) * 1000;
    return sign * Math.round((((hours * 60) + minutes) * 60 + seconds) * 1000 + milliseconds);
}

export function formatClockTime(value, options = {}) {
    const totalMs = normalizeTimeValue(value, options);
    const sign = totalMs < 0 ? "-" : "";
    const absoluteMs = Math.abs(totalMs);
    const hours = Math.floor(absoluteMs / 3600000);
    const minutes = Math.floor((absoluteMs % 3600000) / 60000);
    const seconds = Math.floor((absoluteMs % 60000) / 1000);
    const milliseconds = absoluteMs % 1000;
    const includeSeconds = options.includeSeconds !== false;
    const includeMilliseconds = options.includeMilliseconds === true;

    let output = `${sign}${padInt(hours, options.padHours ?? 2)}:${padInt(minutes, 2)}`;
    if (includeSeconds) {
        output += `:${padInt(seconds, 2)}`;
    }
    if (includeMilliseconds) {
        output += `.${formatFraction(milliseconds, 3)}`;
    }

    return output;
}

export function parseDuration(value, options = {}) {
    if (isFiniteNumber(value)) return normalizeNumericValue(value, options);
    if (value == null) return 0;
    if (value instanceof Date) return value.getTime();

    const text = String(value).trim();
    if (!text) return 0;

    if (/^[+-]?\d+(?:\.\d+)?$/.test(text)) {
        return normalizeNumericValue(Number(text), options);
    }

    if (/^P/i.test(text)) {
        const isoMatch = /^([+-])?P(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)$/i.exec(text);
        if (!isoMatch) {
            throw new TypeError(`Unsupported ISO duration "${value}"`);
        }

        const sign = isoMatch[1] === "-" ? -1 : 1;
        const hours = Number(isoMatch[2] ?? 0);
        const minutes = Number(isoMatch[3] ?? 0);
        const seconds = Number(isoMatch[4] ?? 0);
        return sign * Math.round((((hours * 60) + minutes) * 60 + seconds) * 1000);
    }

    if (text.includes(":")) {
        return parseColonDuration(text);
    }

    const regex = /([+-]?\d+(?:\.\d+)?)\s*(ms|milliseconds?|s|sec|seconds?|m|min|minutes?|h|hr|hours?|d|days?)/gi;
    let match = null;
    let total = 0;
    let found = false;
    while ((match = regex.exec(text)) !== null) {
        found = true;
        total += convertTimeUnit(Number(match[1]), match[2], "ms");
    }

    if (found) {
        return Math.round(total);
    }

    throw new TypeError(`Unsupported duration "${value}"`);
}

export function formatDuration(value, options = {}) {
    const totalMs = Math.round(normalizeTimeValue(value, options));
    const sign = totalMs < 0 ? "-" : "";
    const absoluteMs = Math.abs(totalMs);
    const style = options.style ?? "clock";

    if (style === "long") {
        const days = Math.floor(absoluteMs / 86400000);
        const hours = Math.floor((absoluteMs % 86400000) / 3600000);
        const minutes = Math.floor((absoluteMs % 3600000) / 60000);
        const seconds = Math.floor((absoluteMs % 60000) / 1000);
        const milliseconds = absoluteMs % 1000;
        const parts = [];
        if (days) parts.push(`${days}d`);
        if (hours) parts.push(`${hours}h`);
        if (minutes) parts.push(`${minutes}m`);
        if (seconds) parts.push(`${seconds}s`);
        if (milliseconds || parts.length === 0) parts.push(`${milliseconds}ms`);
        return `${sign}${parts.join(" ")}`;
    }

    return formatClockTime(absoluteMs, {
        includeSeconds: true,
        includeMilliseconds: options.includeMilliseconds === true || absoluteMs % 1000 !== 0,
        padHours: options.padHours ?? 2
    }).replace(/^/, sign);
}

export function parseSrtTime(value) {
    const match = /^(\d{2,3}):([0-5]\d):([0-5]\d),(\d{3})$/.exec(String(value).trim());
    if (!match) {
        throw new TypeError(`Invalid SRT time "${value}"`);
    }

    return (((Number(match[1]) * 60) + Number(match[2])) * 60 + Number(match[3])) * 1000 + Number(match[4]);
}

export function formatSrtTime(value) {
    const totalMs = Math.round(normalizeTimeValue(value));
    const absoluteMs = Math.abs(totalMs);
    const hours = Math.floor(absoluteMs / 3600000);
    const minutes = Math.floor((absoluteMs % 3600000) / 60000);
    const seconds = Math.floor((absoluteMs % 60000) / 1000);
    const milliseconds = absoluteMs % 1000;
    return `${totalMs < 0 ? "-" : ""}${padInt(hours, 2)}:${padInt(minutes, 2)}:${padInt(seconds, 2)},${formatFraction(milliseconds, 3)}`;
}

export function parseSmpteTimecode(value, fps = 25) {
    const match = /^([+-])?(\d{2,3}):([0-5]\d):([0-5]\d):(\d{2})$/.exec(String(value).trim());
    if (!match) {
        throw new TypeError(`Invalid SMPTE timecode "${value}"`);
    }

    if (!isFiniteNumber(fps) || fps <= 0) {
        throw new TypeError("parseSmpteTimecode(value, fps) expects fps > 0");
    }

    const sign = match[1] === "-" ? -1 : 1;
    const hours = Number(match[2]);
    const minutes = Number(match[3]);
    const seconds = Number(match[4]);
    const frames = Number(match[5]);
    const frameMs = 1000 / fps;
    return sign * Math.round((((hours * 60) + minutes) * 60 + seconds) * 1000 + (frames * frameMs));
}

export function formatSmpteTimecode(value, fps = 25, options = {}) {
    const totalFrames = options.input === "frames"
        ? Math.round(value)
        : msToFrames(normalizeTimeValue(value), fps, options.rounding ?? "round");
    const sign = totalFrames < 0 ? "-" : "";
    const absoluteFrames = Math.abs(totalFrames);
    const framesPerHour = fps * 3600;
    const framesPerMinute = fps * 60;
    const hours = Math.floor(absoluteFrames / framesPerHour);
    const minutes = Math.floor((absoluteFrames % framesPerHour) / framesPerMinute);
    const seconds = Math.floor((absoluteFrames % framesPerMinute) / fps);
    const frames = absoluteFrames % fps;
    return `${sign}${padInt(hours, 2)}:${padInt(minutes, 2)}:${padInt(seconds, 2)}:${padInt(frames, 2)}`;
}

export function parseTimecode(value, options = {}) {
    if (options.format === "srt") return parseSrtTime(value);
    if (options.format === "smpte") return parseSmpteTimecode(value, options.fps ?? 25);
    if (/^\d{2,3}:\d{2}:\d{2},\d{3}$/.test(String(value).trim())) return parseSrtTime(value);
    if (/^\d{2,3}:\d{2}:\d{2}:\d{2}$/.test(String(value).trim())) return parseSmpteTimecode(value, options.fps ?? 25);
    return parseDuration(value, options);
}

export function formatTimecode(value, options = {}) {
    if (options.format === "srt") return formatSrtTime(value);
    if (options.format === "smpte") return formatSmpteTimecode(value, options.fps ?? 25, options);
    return formatDuration(value, options);
}

export function msToFrames(ms, fps = 25, rounding = "round") {
    if (!isFiniteNumber(fps) || fps <= 0) {
        throw new TypeError("msToFrames(ms, fps) expects fps > 0");
    }

    const frameValue = normalizeTimeValue(ms) * fps / 1000;
    if (rounding === "floor") return Math.floor(frameValue);
    if (rounding === "ceil") return Math.ceil(frameValue);
    return Math.round(frameValue);
}

export function framesToMs(frames, fps = 25) {
    if (!isFiniteNumber(frames)) {
        throw new TypeError("framesToMs(frames, fps) expects a finite frame count");
    }

    return Math.round((frames * 1000) / fps);
}

export function samplesToMs(samples, sampleRate = 44100) {
    if (!isFiniteNumber(samples) || !isFiniteNumber(sampleRate) || sampleRate <= 0) {
        throw new TypeError("samplesToMs(samples, sampleRate) expects finite values and sampleRate > 0");
    }

    return Math.round((samples * 1000) / sampleRate);
}

export function msToSamples(ms, sampleRate = 44100) {
    if (!isFiniteNumber(sampleRate) || sampleRate <= 0) {
        throw new TypeError("msToSamples(ms, sampleRate) expects sampleRate > 0");
    }

    return Math.round(normalizeTimeValue(ms) * sampleRate / 1000);
}

export function snapToFrame(value, fps = 25, rounding = "round") {
    return framesToMs(msToFrames(value, fps, rounding), fps);
}

export function normalizeTimeValue(value, options = {}) {
    if (value == null) return 0;
    if (isFiniteNumber(value)) return normalizeNumericValue(value, options);
    if (value instanceof Date) return value.getTime();

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return 0;
        if (looksLikeIsoDate(trimmed)) {
            const parsedDate = Date.parse(trimmed);
            if (!Number.isNaN(parsedDate)) return parsedDate;
        }
        if (options.format === "smpte" || /^\d{2,3}:\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
            return parseSmpteTimecode(trimmed, options.fps ?? 25);
        }
        return parseDuration(trimmed, options);
    }

    throw new TypeError(`Unsupported time value "${value}"`);
}

function resolveAt(item, options = {}) {
    const value = resolveAccessor(item, options.getAt, options.pointKeys ?? DEFAULT_POINT_KEYS);
    return value === undefined ? undefined : normalizeTimeValue(value, options);
}

function resolveStart(item, options = {}) {
    const value = resolveAccessor(item, options.getStart, options.startKeys ?? DEFAULT_START_KEYS);
    return value === undefined ? undefined : normalizeTimeValue(value, options);
}

function resolveEnd(item, options = {}) {
    const value = resolveAccessor(item, options.getEnd, options.endKeys ?? DEFAULT_END_KEYS);
    return value === undefined ? undefined : normalizeTimeValue(value, options);
}

function resolveDuration(item, options = {}) {
    const value = resolveAccessor(item, options.getDuration, options.durationKeys ?? DEFAULT_DURATION_KEYS);
    return value === undefined ? undefined : normalizeTimeValue(value, options);
}

function resolveTrack(item, options = {}) {
    return resolveAccessor(item, options.getTrack, options.trackKeys ?? DEFAULT_TRACK_KEYS);
}

function getItemReferenceTime(item, options = {}) {
    if (item != null && typeof item === "object") {
        const at = resolveAt(item, options);
        if (at !== undefined) return at;
        const start = resolveStart(item, options);
        if (start !== undefined) return start;
    }

    return normalizeTimeValue(item, options);
}

export function normalizeTimePoint(item, options = {}) {
    if (item == null) {
        throw new TypeError("normalizeTimePoint(item) expects a value");
    }

    if (typeof item !== "object" || Array.isArray(item) || item instanceof Date) {
        return { at: normalizeTimeValue(item, options) };
    }

    const at = resolveAt(item, options);
    if (at === undefined) {
        const range = normalizeTimeRange(item, { ...options, allowPointLikeRange: true });
        return { ...range, at: range.start };
    }

    return { ...cloneItem(item), at };
}

export function coerceStartEndDuration(item, options = {}) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
        throw new TypeError("coerceStartEndDuration(item) expects an object");
    }

    const at = resolveAt(item, options);
    let start = resolveStart(item, options);
    let end = resolveEnd(item, options);
    let duration = resolveDuration(item, options);

    if (start === undefined && at !== undefined) {
        start = at;
    }
    if (end === undefined && duration !== undefined && start !== undefined) {
        end = start + duration;
    }
    if (start === undefined && end !== undefined && duration !== undefined) {
        start = end - duration;
    }
    if (start !== undefined && end !== undefined && duration === undefined) {
        duration = end - start;
    }

    if (start === undefined && end === undefined && options.allowPointLikeRange && at !== undefined) {
        start = at;
        end = at;
        duration = 0;
    }

    if (start === undefined || end === undefined) {
        throw new TypeError("Timed range requires resolvable start/end or start/duration values");
    }

    if (end < start) {
        throw new RangeError(`Timed range end (${end}) cannot be before start (${start})`);
    }

    return { start, end, duration: duration ?? end - start };
}

export function normalizeTimeRange(item, options = {}) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) {
        const point = normalizeTimeValue(item, options);
        return { start: point, end: point, duration: 0 };
    }

    const normalized = coerceStartEndDuration(item, options);
    return { ...cloneItem(item), ...normalized };
}

export function normalizeTimedItems(items, options = {}) {
    return ensureArray(items).map((item) => {
        try {
            return normalizeTimeRange(item, options);
        } catch {
            return normalizeTimePoint(item, options);
        }
    });
}

export function normalizeTrackItems(items, options = {}) {
    return ensureArray(items).map((item) => {
        const normalized = hasOwn(item, "at")
            || resolveAt(item, options) !== undefined
            ? normalizeTimePoint(item, options)
            : normalizeTimeRange(item, { ...options, allowPointLikeRange: true });
        return {
            ...normalized,
            track: resolveTrack(item, options) ?? normalized.track ?? options.defaultTrack ?? "default"
        };
    });
}

function compareByPrimarySecondary(aPrimary, bPrimary, aSecondary, bSecondary) {
    if (aPrimary !== bPrimary) return aPrimary - bPrimary;
    return aSecondary - bSecondary;
}

export function sortByTime(items, options = {}) {
    return [...ensureArray(items)].sort((left, right) =>
        compareByPrimarySecondary(
            getItemReferenceTime(left, options),
            getItemReferenceTime(right, options),
            resolveEnd(left, options) ?? resolveAt(left, options) ?? resolveStart(left, options) ?? 0,
            resolveEnd(right, options) ?? resolveAt(right, options) ?? resolveStart(right, options) ?? 0
        )
    );
}

export function sortByStart(items, options = {}) {
    return [...ensureArray(items)].sort((left, right) =>
        compareByPrimarySecondary(
            normalizeTimeRange(left, { ...options, allowPointLikeRange: true }).start,
            normalizeTimeRange(right, { ...options, allowPointLikeRange: true }).start,
            normalizeTimeRange(left, { ...options, allowPointLikeRange: true }).end,
            normalizeTimeRange(right, { ...options, allowPointLikeRange: true }).end
        )
    );
}

export function sortByEnd(items, options = {}) {
    return [...ensureArray(items)].sort((left, right) =>
        compareByPrimarySecondary(
            normalizeTimeRange(left, { ...options, allowPointLikeRange: true }).end,
            normalizeTimeRange(right, { ...options, allowPointLikeRange: true }).end,
            normalizeTimeRange(left, { ...options, allowPointLikeRange: true }).start,
            normalizeTimeRange(right, { ...options, allowPointLikeRange: true }).start
        )
    );
}

export function ensureSorted(items, options = {}) {
    const sorted = sortByTime(items, options);
    if (options.inPlace === true && Array.isArray(items)) {
        items.splice(0, items.length, ...sorted);
        return items;
    }

    return sorted;
}

export function indexByTrack(items, options = {}) {
    return normalizeTrackItems(items, options).reduce((accumulator, item) => {
        const key = item.track ?? options.defaultTrack ?? "default";
        if (!accumulator[key]) accumulator[key] = [];
        accumulator[key].push(item);
        return accumulator;
    }, {});
}

export function createTrack(name, options = {}) {
    return {
        name,
        items: [],
        ...cloneItem(options)
    };
}

function containsTime(range, time, options = {}) {
    const { startInclusive, endInclusive } = splitBounds(options.bounds);
    const tolerance = options.tolerance ?? 0;
    return compareBoundary(range.start, time, startInclusive, true, tolerance)
        && compareBoundary(time, range.end, true, endInclusive, tolerance);
}

export function overlaps(left, right, options = {}) {
    const a = normalizeTimeRange(left, { ...options, allowPointLikeRange: true });
    const b = normalizeTimeRange(right, { ...options, allowPointLikeRange: true });
    const { startInclusive, endInclusive } = splitBounds(options.bounds);
    const tolerance = options.tolerance ?? 0;
    return compareBoundary(a.start, b.end, startInclusive, endInclusive, tolerance)
        && compareBoundary(b.start, a.end, startInclusive, endInclusive, tolerance);
}

export function touches(left, right, options = {}) {
    const a = normalizeTimeRange(left, { ...options, allowPointLikeRange: true });
    const b = normalizeTimeRange(right, { ...options, allowPointLikeRange: true });
    const tolerance = options.tolerance ?? 0;
    return Math.abs(a.end - b.start) <= tolerance || Math.abs(b.end - a.start) <= tolerance;
}

export function contains(range, target, options = {}) {
    const source = normalizeTimeRange(range, { ...options, allowPointLikeRange: true });

    if (typeof target === "object" && target !== null && (resolveStart(target, options) !== undefined || resolveEnd(target, options) !== undefined)) {
        const candidate = normalizeTimeRange(target, { ...options, allowPointLikeRange: true });
        const tolerance = options.tolerance ?? 0;
        return candidate.start >= source.start - tolerance && candidate.end <= source.end + tolerance;
    }

    return containsTime(source, normalizeTimeValue(target, options), options);
}

export function gapBetween(left, right, options = {}) {
    const [first, second] = sortByStart([left, right], { ...options, allowPointLikeRange: true }).map((item) =>
        normalizeTimeRange(item, { ...options, allowPointLikeRange: true })
    );

    return Math.max(0, second.start - first.end);
}

export function intersection(left, right, options = {}) {
    if (!overlaps(left, right, options)) return null;
    const a = normalizeTimeRange(left, { ...options, allowPointLikeRange: true });
    const b = normalizeTimeRange(right, { ...options, allowPointLikeRange: true });
    const start = Math.max(a.start, b.start);
    const end = Math.min(a.end, b.end);
    return { start, end, duration: Math.max(0, end - start) };
}

export function union(left, right, options = {}) {
    const a = normalizeTimeRange(left, { ...options, allowPointLikeRange: true });
    const b = normalizeTimeRange(right, { ...options, allowPointLikeRange: true });
    if (!overlaps(a, b, options) && !touches(a, b, options) && options.allowDisjoint !== true) {
        return null;
    }

    const start = Math.min(a.start, b.start);
    const end = Math.max(a.end, b.end);
    return { start, end, duration: end - start };
}

export function subtractRange(source, excluded, options = {}) {
    const base = normalizeTimeRange(source, { ...options, allowPointLikeRange: true });
    const removed = normalizeTimeRange(excluded, { ...options, allowPointLikeRange: true });
    const common = intersection(base, removed, options);
    if (!common) return [base];

    const result = [];
    if (common.start > base.start) {
        result.push({ start: base.start, end: common.start, duration: common.start - base.start });
    }
    if (common.end < base.end) {
        result.push({ start: common.end, end: base.end, duration: base.end - common.end });
    }
    return result;
}

export function splitRange(range, splitPoints, options = {}) {
    const source = normalizeTimeRange(range, { ...options, allowPointLikeRange: true });
    const points = [...new Set(ensureArray(splitPoints).map((value) => normalizeTimeValue(value, options)))]
        .filter((value) => value > source.start && value < source.end)
        .sort((a, b) => a - b);

    const boundaries = [source.start, ...points, source.end];
    const chunks = [];
    for (let index = 0; index < boundaries.length - 1; index += 1) {
        const start = boundaries[index];
        const end = boundaries[index + 1];
        chunks.push({ start, end, duration: end - start });
    }
    return chunks;
}

export function findAt(items, time, options = {}) {
    const target = normalizeTimeValue(time, options);
    const tolerance = options.tolerance ?? 0;
    return ensureArray(items).filter((item) => {
        const at = resolveAt(item, options);
        return at !== undefined && Math.abs(at - target) <= tolerance;
    });
}

export function findActiveAt(items, time, options = {}) {
    const target = normalizeTimeValue(time, options);
    return ensureArray(items).filter((item) => {
        try {
            return containsTime(normalizeTimeRange(item, { ...options, allowPointLikeRange: true }), target, options);
        } catch {
            return false;
        }
    });
}

export function findBetween(items, start, end, options = {}) {
    const window = normalizeTimeRange({ start, end }, options);
    return ensureArray(items).filter((item) => {
        try {
            return overlaps(item, window, options);
        } catch {
            const point = resolveAt(item, options);
            return point !== undefined && contains(window, point, options);
        }
    });
}

export function findOverlapping(items, range, options = {}) {
    return ensureArray(items).filter((item) => {
        try {
            return overlaps(item, range, options);
        } catch {
            return false;
        }
    });
}

export function findNearest(items, time, options = {}) {
    const target = normalizeTimeValue(time, options);
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const item of ensureArray(items)) {
        const distance = Math.abs(getItemReferenceTime(item, options) - target);
        if (distance < nearestDistance) {
            nearest = item;
            nearestDistance = distance;
        }
    }

    return nearest;
}

export function findPrevious(items, time, options = {}) {
    const target = normalizeTimeValue(time, options);
    return sortByTime(items, options)
        .filter((item) => getItemReferenceTime(item, options) < target)
        .at(-1) ?? null;
}

export function findNext(items, time, options = {}) {
    const target = normalizeTimeValue(time, options);
    return sortByTime(items, options)
        .find((item) => getItemReferenceTime(item, options) > target) ?? null;
}

export function shiftTime(value, delta, options = {}) {
    return normalizeTimeValue(value, options) + normalizeTimeValue(delta, options);
}

export function scaleTime(value, factor, options = {}) {
    if (!isFiniteNumber(factor)) {
        throw new TypeError("scaleTime(value, factor) expects a finite factor");
    }

    const origin = normalizeTimeValue(options.origin ?? 0, options);
    const numericValue = normalizeTimeValue(value, options);
    return origin + ((numericValue - origin) * factor);
}

function mapTimedItem(item, mapper, options = {}) {
    if (item == null || typeof item !== "object" || Array.isArray(item) || item instanceof Date) {
        return mapper({ at: normalizeTimeValue(item, options) });
    }

    const clone = { ...item };
    const at = resolveAt(item, options);
    const start = resolveStart(item, options);
    const end = resolveEnd(item, options);
    const duration = resolveDuration(item, options);
    return mapper({ clone, at, start, end, duration });
}

export function shiftItems(items, delta, options = {}) {
    const offset = normalizeTimeValue(delta, options);
    return ensureArray(items).map((item) => mapTimedItem(item, ({ clone, at, start, end }) => {
        if (!clone) return { at: at + offset };
        if (at !== undefined) clone.at = at + offset;
        if (start !== undefined) clone.start = start + offset;
        if (end !== undefined) clone.end = end + offset;
        return clone;
    }, options));
}

export function scaleItems(items, factor, options = {}) {
    return ensureArray(items).map((item) => mapTimedItem(item, ({ clone, at, start, end }) => {
        if (!clone) return { at: scaleTime(at, factor, options) };
        if (at !== undefined) clone.at = scaleTime(at, factor, options);
        if (start !== undefined) clone.start = scaleTime(start, factor, options);
        if (end !== undefined) clone.end = scaleTime(end, factor, options);
        if (clone.start !== undefined && clone.end !== undefined) {
            clone.duration = clone.end - clone.start;
        }
        return clone;
    }, options));
}

export function quantizeTime(value, step, options = {}) {
    const numericValue = normalizeTimeValue(value, options);
    const normalizedStep = Math.abs(normalizeTimeValue(step, options));
    if (normalizedStep === 0) return numericValue;
    const mode = options.mode ?? "round";
    const ratio = numericValue / normalizedStep;
    const quantizedRatio = mode === "floor"
        ? Math.floor(ratio)
        : mode === "ceil"
            ? Math.ceil(ratio)
            : Math.round(ratio);
    return quantizedRatio * normalizedStep;
}

export function quantizeItems(items, step, options = {}) {
    return ensureArray(items).map((item) => mapTimedItem(item, ({ clone, at, start, end }) => {
        if (!clone) return { at: quantizeTime(at, step, options) };
        if (at !== undefined) clone.at = quantizeTime(at, step, options);
        if (start !== undefined) clone.start = quantizeTime(start, step, options);
        if (end !== undefined) clone.end = quantizeTime(end, step, options);
        if (clone.start !== undefined && clone.end !== undefined) {
            clone.duration = clone.end - clone.start;
        }
        return clone;
    }, options));
}

export function trimRange(item, bounds, options = {}) {
    const result = intersection(item, bounds, options);
    return result ? { ...normalizeTimeRange(item, { ...options, allowPointLikeRange: true }), ...result } : null;
}

export function clipItems(items, bounds, options = {}) {
    return ensureArray(items).flatMap((item) => {
        const at = resolveAt(item, options);
        if (at !== undefined) {
            return contains(bounds, at, options) ? [cloneItem(item)] : [];
        }

        const trimmed = trimRange(item, bounds, options);
        if (!trimmed) return [];
        const original = cloneItem(item);
        if (original && typeof original === "object") {
            return [{ ...original, ...trimmed }];
        }
        return [trimmed];
    });
}

export function offsetFromAnchor(items, anchor, options = {}) {
    const normalizedAnchor = normalizeTimeValue(anchor, options);
    return shiftItems(items, -normalizedAnchor, options);
}

function mergeRangesInternal(items, shouldMerge, options = {}) {
    const sorted = sortByStart(items, options).map((item) => normalizeTimeRange(item, { ...options, allowPointLikeRange: true }));
    const merged = [];
    for (const item of sorted) {
        const previous = merged.at(-1);
        if (!previous) {
            merged.push({ ...item });
            continue;
        }

        if (shouldMerge(previous, item)) {
            previous.end = Math.max(previous.end, item.end);
            previous.duration = previous.end - previous.start;
            if (options.keepSources === true) {
                previous.sources = [...(previous.sources ?? [{ ...previous }]), item];
            }
            continue;
        }

        merged.push({ ...item });
    }
    return merged;
}

export function mergeAdjacentRanges(items, options = {}) {
    const gapTolerance = options.gapTolerance ?? 0;
    const shouldMatchTrack = options.matchTrack !== false;
    return mergeRangesInternal(items, (previous, item) =>
        gapBetween(previous, item, options) <= gapTolerance
        && (!shouldMatchTrack
            || (resolveTrack(previous, options) ?? previous.track ?? "default") === (resolveTrack(item, options) ?? item.track ?? "default"))
    , options);
}

export function mergeOverlappingRanges(items, options = {}) {
    const gapTolerance = options.gapTolerance ?? 0;
    const shouldMatchTrack = options.matchTrack !== false;
    return mergeRangesInternal(items, (previous, item) =>
        (overlaps(previous, item, options) || gapBetween(previous, item, options) <= gapTolerance)
        && (!shouldMatchTrack
            || (resolveTrack(previous, options) ?? previous.track ?? "default") === (resolveTrack(item, options) ?? item.track ?? "default"))
    , options);
}

export function dedupeTimedItems(items, options = {}) {
    const seen = new Set();
    const result = [];
    for (const item of ensureArray(items)) {
        const normalized = (() => {
            try {
                return normalizeTimeRange(item, { ...options, allowPointLikeRange: true });
            } catch {
                return normalizeTimePoint(item, options);
            }
        })();
        const key = options.keySelector
            ? options.keySelector(item, normalized)
            : JSON.stringify({
                track: resolveTrack(item, options) ?? normalized.track ?? null,
                at: normalized.at ?? null,
                start: normalized.start ?? null,
                end: normalized.end ?? null,
                type: item?.type ?? item?.kind ?? null,
                label: item?.label ?? null
            });
        if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
        }
    }
    return result;
}

export function getTimelineBounds(items, options = {}) {
    const normalizedItems = ensureArray(items);
    if (normalizedItems.length === 0) return null;

    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = Number.NEGATIVE_INFINITY;

    for (const item of normalizedItems) {
        try {
            const range = normalizeTimeRange(item, { ...options, allowPointLikeRange: true });
            minStart = Math.min(minStart, range.start);
            maxEnd = Math.max(maxEnd, range.end);
        } catch {
            const point = normalizeTimePoint(item, options);
            minStart = Math.min(minStart, point.at);
            maxEnd = Math.max(maxEnd, point.at);
        }
    }

    return { start: minStart, end: maxEnd, duration: Math.max(0, maxEnd - minStart) };
}

export function getTotalDuration(items, options = {}) {
    return ensureArray(items).reduce((total, item) => {
        try {
            return total + normalizeTimeRange(item, { ...options, allowPointLikeRange: true }).duration;
        } catch {
            return total;
        }
    }, 0);
}

export function findGaps(items, options = {}) {
    const bounds = options.boundsRange
        ? normalizeTimeRange(options.boundsRange, { ...options, allowPointLikeRange: true })
        : getTimelineBounds(items, options);
    if (!bounds) return [];

    const merged = mergeOverlappingRanges(
        clipItems(items, bounds, options).map((item) => normalizeTimeRange(item, { ...options, allowPointLikeRange: true })),
        options
    );

    const gaps = [];
    let cursor = bounds.start;
    for (const item of merged) {
        if (item.start > cursor) {
            gaps.push({ start: cursor, end: item.start, duration: item.start - cursor });
        }
        cursor = Math.max(cursor, item.end);
    }
    if (cursor < bounds.end) {
        gaps.push({ start: cursor, end: bounds.end, duration: bounds.end - cursor });
    }
    return gaps;
}

export function getCoveredDuration(items, options = {}) {
    return mergeOverlappingRanges(items, options)
        .reduce((total, item) => total + item.duration, 0);
}

export function getGapDuration(items, options = {}) {
    return findGaps(items, options).reduce((total, gap) => total + gap.duration, 0);
}

export function getAverageGap(items, options = {}) {
    const gaps = findGaps(items, options);
    if (gaps.length === 0) return 0;
    return getGapDuration(items, options) / gaps.length;
}

export function summarizeTimeline(items, options = {}) {
    const bounds = getTimelineBounds(items, options);
    const gaps = findGaps(items, options);
    const tracks = groupIntoTracks(items, options);
    return {
        itemCount: ensureArray(items).length,
        rangeCount: ensureArray(items).filter((item) => {
            try {
                normalizeTimeRange(item, { ...options, allowPointLikeRange: true });
                return true;
            } catch {
                return false;
            }
        }).length,
        pointCount: ensureArray(items).filter((item) => resolveAt(item, options) !== undefined).length,
        bounds,
        totalDuration: getTotalDuration(items, options),
        coveredDuration: getCoveredDuration(items, options),
        gapDuration: gaps.reduce((total, gap) => total + gap.duration, 0),
        averageGap: gaps.length ? gaps.reduce((total, gap) => total + gap.duration, 0) / gaps.length : 0,
        trackCount: Object.keys(tracks).length
    };
}

export function bucketize(items, bucketSize, options = {}) {
    const normalizedBucketSize = Math.abs(normalizeTimeValue(bucketSize, options));
    if (normalizedBucketSize === 0) {
        throw new RangeError("bucketSize must be greater than zero");
    }

    const bounds = options.boundsRange
        ? normalizeTimeRange(options.boundsRange, { ...options, allowPointLikeRange: true })
        : getTimelineBounds(items, options);
    if (!bounds) return [];

    const buckets = [];
    for (let start = bounds.start; start < bounds.end; start += normalizedBucketSize) {
        const end = Math.min(bounds.end, start + normalizedBucketSize);
        const range = { start, end };
        buckets.push({
            index: buckets.length,
            start,
            end,
            duration: end - start,
            items: findBetween(items, range.start, range.end, options)
        });
    }
    return buckets;
}

export function aggregateByBucket(items, bucketSize, reducer, options = {}) {
    if (typeof reducer !== "function") {
        throw new TypeError("aggregateByBucket(items, bucketSize, reducer) expects a reducer function");
    }

    return bucketize(items, bucketSize, options).map((bucket) => ({
        ...bucket,
        value: reducer(bucket.items, bucket)
    }));
}

export function chunkTimeline(items, windowSize, options = {}) {
    return bucketize(items, windowSize, options);
}

export function windowTimeline(items, windowSize, step = windowSize, options = {}) {
    const normalizedWindowSize = Math.abs(normalizeTimeValue(windowSize, options));
    const normalizedStep = Math.abs(normalizeTimeValue(step, options));
    if (normalizedWindowSize === 0 || normalizedStep === 0) {
        throw new RangeError("windowSize and step must be greater than zero");
    }

    const bounds = options.boundsRange
        ? normalizeTimeRange(options.boundsRange, { ...options, allowPointLikeRange: true })
        : getTimelineBounds(items, options);
    if (!bounds) return [];

    const windows = [];
    for (let start = bounds.start; start < bounds.end; start += normalizedStep) {
        const end = Math.min(bounds.end, start + normalizedWindowSize);
        windows.push({
            index: windows.length,
            start,
            end,
            duration: end - start,
            items: findBetween(items, start, end, options)
        });
        if (end === bounds.end) break;
    }
    return windows;
}

export function groupIntoTracks(items, options = {}) {
    return ensureArray(items).reduce((tracks, item) => {
        const key = resolveTrack(item, options) ?? options.defaultTrack ?? "default";
        if (!tracks[key]) tracks[key] = [];
        tracks[key].push(item);
        return tracks;
    }, {});
}

export function flattenTracks(tracks, options = {}) {
    if (Array.isArray(tracks)) {
        return tracks.flatMap((track) => track?.items ?? []);
    }

    return Object.entries(tracks ?? {}).flatMap(([trackName, items]) =>
        ensureArray(items).map((item) => ({ ...(typeof item === "object" ? item : { at: item }), track: item?.track ?? trackName ?? options.defaultTrack ?? "default" }))
    );
}

export function getTrackBounds(items, options = {}) {
    return Object.fromEntries(
        Object.entries(groupIntoTracks(items, options)).map(([track, trackItems]) => [track, getTimelineBounds(trackItems, options)])
    );
}

export function detectTrackConflicts(items, options = {}) {
    const conflicts = [];
    const tracks = groupIntoTracks(items, options);
    for (const [track, trackItems] of Object.entries(tracks)) {
        const sorted = sortByStart(trackItems, options);
        for (let index = 0; index < sorted.length - 1; index += 1) {
            const current = sorted[index];
            const next = sorted[index + 1];
            if (overlaps(current, next, options)) {
                conflicts.push({ track, left: current, right: next, overlap: intersection(current, next, options) });
            }
        }
    }
    return conflicts;
}

export function computeLatency(startEvent, endEvent, options = {}) {
    const startTime = typeof startEvent === "object" ? getItemReferenceTime(startEvent, options) : normalizeTimeValue(startEvent, options);
    const endTime = typeof endEvent === "object" ? getItemReferenceTime(endEvent, options) : normalizeTimeValue(endEvent, options);
    return endTime - startTime;
}

export function pairStartEndEvents(events, options = {}) {
    const typeKey = options.typeKey ?? "phase";
    const startValues = new Set(ensureArray(options.startValues ?? ["start", "begin", "open"]));
    const endValues = new Set(ensureArray(options.endValues ?? ["end", "finish", "close"]));
    const correlationKey = options.correlationKey ?? "id";
    const pending = new Map();
    const pairs = [];

    for (const event of sortByTime(events, options)) {
        const phase = event?.[typeKey];
        const correlationId = event?.[correlationKey] ?? "__default__";
        if (startValues.has(phase)) {
            if (!pending.has(correlationId)) pending.set(correlationId, []);
            pending.get(correlationId).push(event);
            continue;
        }
        if (endValues.has(phase) && pending.has(correlationId) && pending.get(correlationId).length > 0) {
            const startEvent = pending.get(correlationId).shift();
            const start = getItemReferenceTime(startEvent, options);
            const end = getItemReferenceTime(event, options);
            pairs.push({
                correlationId,
                start,
                end,
                duration: end - start,
                startEvent,
                endEvent: event
            });
        }
    }

    return pairs;
}

export function extractStateRanges(events, options = {}) {
    const sorted = sortByTime(events, options);
    const stateKey = options.stateKey ?? "state";
    const ranges = [];
    for (let index = 0; index < sorted.length; index += 1) {
        const current = sorted[index];
        const next = sorted[index + 1];
        const start = getItemReferenceTime(current, options);
        const end = next ? getItemReferenceTime(next, options) : normalizeTimeValue(options.end ?? start, options);
        ranges.push({
            start,
            end,
            duration: Math.max(0, end - start),
            state: current?.[stateKey],
            source: current
        });
    }
    return ranges;
}

export function parseSrt(content, options = {}) {
    const normalizedText = String(content ?? "").replace(/\r/g, "").trim();
    if (!normalizedText) return [];

    return normalizedText.split(/\n{2,}/).map((block, index) => {
        const lines = block.split("\n");
        const maybeIndex = /^\d+$/.test(lines[0]?.trim()) ? Number(lines.shift().trim()) : index + 1;
        const timeline = lines.shift();
        const match = /^(.+?)\s*-->\s*(.+)$/.exec(timeline ?? "");
        if (!match) {
            throw new TypeError(`Invalid SRT block timeline "${timeline}"`);
        }

        const start = parseSrtTime(match[1].trim());
        const end = parseSrtTime(match[2].trim().split(/\s+/)[0]);
        const textLines = lines;
        return {
            index: maybeIndex,
            start,
            end,
            duration: end - start,
            text: textLines.join("\n"),
            lines: textLines,
            ...cloneItem(options.itemDefaults)
        };
    });
}

export function formatSrt(items) {
    return sortByStart(items).map((item, index) => {
        const range = normalizeTimeRange(item, { allowPointLikeRange: true });
        const text = item?.text ?? ensureArray(item?.lines).join("\n");
        return [
            item?.index ?? index + 1,
            `${formatSrtTime(range.start)} --> ${formatSrtTime(range.end)}`,
            text ?? ""
        ].join("\n");
    }).join("\n\n");
}

function normalizeControlPoint(point, options = {}) {
    if (Array.isArray(point) && point.length >= 2) {
        return {
            source: normalizeTimeValue(point[0], options),
            target: normalizeTimeValue(point[1], options)
        };
    }

    const source = resolveAccessor(point, options.getSource, ["source", "from", "left", "x"]);
    const target = resolveAccessor(point, options.getTarget, ["target", "to", "right", "y"]);
    return {
        source: normalizeTimeValue(source, options),
        target: normalizeTimeValue(target, options)
    };
}

export function buildTimeMap(controlPoints, options = {}) {
    const points = ensureArray(controlPoints)
        .map((point) => normalizeControlPoint(point, options))
        .sort((left, right) => left.source - right.source);

    if (points.length === 0) {
        return { points: [], offset: 0, scale: 1 };
    }

    if (points.length === 1) {
        return {
            points,
            offset: points[0].target - points[0].source,
            scale: 1
        };
    }

    const first = points[0];
    const last = points.at(-1);
    const scale = last.source === first.source ? 1 : (last.target - first.target) / (last.source - first.source);
    const offset = first.target - (first.source * scale);
    return { points, offset, scale };
}

export function mapTimeBetweenTimelines(value, mapping, options = {}) {
    const numericValue = normalizeTimeValue(value, options);
    const timeMap = Array.isArray(mapping) ? buildTimeMap(mapping, options) : mapping;
    const points = ensureArray(timeMap?.points);

    if (points.length === 0) {
        return numericValue;
    }
    if (points.length === 1) {
        return numericValue + (timeMap.offset ?? (points[0].target - points[0].source));
    }

    for (let index = 0; index < points.length - 1; index += 1) {
        const current = points[index];
        const next = points[index + 1];
        if (numericValue >= current.source && numericValue <= next.source) {
            const span = next.source - current.source;
            if (span === 0) return current.target;
            const ratio = (numericValue - current.source) / span;
            return current.target + ((next.target - current.target) * ratio);
        }
    }

    if (options.extrapolate === false) {
        return numericValue < points[0].source ? points[0].target : points.at(-1).target;
    }

    return (timeMap.scale ?? 1) * numericValue + (timeMap.offset ?? 0);
}

export function estimateOffset(left, right, options = {}) {
    const leftItems = ensureArray(left);
    const rightItems = ensureArray(right);
    const sampleCount = Math.min(leftItems.length, rightItems.length);
    if (sampleCount === 0) return 0;

    let total = 0;
    for (let index = 0; index < sampleCount; index += 1) {
        total += getItemReferenceTime(rightItems[index], options) - getItemReferenceTime(leftItems[index], options);
    }

    return total / sampleCount;
}

export function estimateDrift(left, right, options = {}) {
    const leftItems = ensureArray(left);
    const rightItems = ensureArray(right);
    const sampleCount = Math.min(leftItems.length, rightItems.length);
    if (sampleCount < 2) return { scale: 1, offset: estimateOffset(leftItems, rightItems, options) };

    const firstLeft = getItemReferenceTime(leftItems[0], options);
    const lastLeft = getItemReferenceTime(leftItems[sampleCount - 1], options);
    const firstRight = getItemReferenceTime(rightItems[0], options);
    const lastRight = getItemReferenceTime(rightItems[sampleCount - 1], options);
    const scale = lastLeft === firstLeft ? 1 : (lastRight - firstRight) / (lastLeft - firstLeft);
    const offset = firstRight - (firstLeft * scale);
    return { scale, offset };
}

export function applyOffset(items, offset, options = {}) {
    return shiftItems(items, offset, options);
}

export function applyDriftCorrection(items, driftModel, options = {}) {
    const scale = driftModel?.scale ?? 1;
    const offset = driftModel?.offset ?? 0;
    return shiftItems(scaleItems(items, scale, options), offset, options);
}

export function alignTimelines(left, right, options = {}) {
    const offset = estimateOffset(left, right, options);
    const drift = estimateDrift(left, right, options);
    const points = ensureArray(left).map((item, index) => {
        if (index >= ensureArray(right).length) return null;
        return {
            source: getItemReferenceTime(item, options),
            target: getItemReferenceTime(ensureArray(right)[index], options)
        };
    }).filter(Boolean);

    return {
        offset,
        drift,
        timeMap: buildTimeMap(points, options)
    };
}

const timeMapping = {
    TIME_UNIT_TO_MS,
    convertTimeUnit,
    parseClockTime,
    formatClockTime,
    parseDuration,
    formatDuration,
    parseSrtTime,
    formatSrtTime,
    parseSmpteTimecode,
    formatSmpteTimecode,
    parseTimecode,
    formatTimecode,
    msToFrames,
    framesToMs,
    samplesToMs,
    msToSamples,
    snapToFrame,
    normalizeTimeValue,
    normalizeTimePoint,
    normalizeTimeRange,
    normalizeTimedItems,
    normalizeTrackItems,
    coerceStartEndDuration,
    sortByTime,
    sortByStart,
    sortByEnd,
    ensureSorted,
    indexByTrack,
    createTrack,
    overlaps,
    touches,
    contains,
    gapBetween,
    intersection,
    union,
    subtractRange,
    splitRange,
    findAt,
    findActiveAt,
    findBetween,
    findOverlapping,
    findNearest,
    findPrevious,
    findNext,
    shiftTime,
    shiftItems,
    scaleTime,
    scaleItems,
    quantizeTime,
    quantizeItems,
    trimRange,
    clipItems,
    offsetFromAnchor,
    mergeAdjacentRanges,
    mergeOverlappingRanges,
    dedupeTimedItems,
    getTimelineBounds,
    getTotalDuration,
    findGaps,
    getCoveredDuration,
    getGapDuration,
    getAverageGap,
    summarizeTimeline,
    bucketize,
    aggregateByBucket,
    chunkTimeline,
    windowTimeline,
    groupIntoTracks,
    flattenTracks,
    getTrackBounds,
    detectTrackConflicts,
    computeLatency,
    pairStartEndEvents,
    extractStateRanges,
    parseSrt,
    formatSrt,
    buildTimeMap,
    mapTimeBetweenTimelines,
    estimateOffset,
    estimateDrift,
    applyOffset,
    applyDriftCorrection,
    alignTimelines
};

export default timeMapping;
