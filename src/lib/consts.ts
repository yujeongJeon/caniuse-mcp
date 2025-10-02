export const DATA_SOURCES = {
    caniuse: 'https://raw.githubusercontent.com/Fyrd/caniuse/main/fulldata-json/data-2.0.json',
    mdn: 'https://unpkg.com/@mdn/browser-compat-data@latest/data.json',
}

export type SupportStatus =
    | 'supported' // y
    | 'not_supported' // n
    | 'partial' // a (almost)
    | 'prefixed' // x (needs prefix)
    | 'polyfill' // p
    | 'disabled' // d (disabled by default)
    | 'unknown' // u
