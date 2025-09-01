// src/scraper.js
/**
 * HTML scrapers for the University Library pages.
 * - parseOccupancy: reads the shared "available seats" table
 * - parseOpeningHours: reads the opening-hours table from an individual location page
 * - parseLocationInfo: extracts a concise info text from the location page
 */
const axios = require('axios');
const cheerio = require('cheerio');

const DEBUG = process.env.DEBUG === 'true';

/**
 * Default headers to mimic a regular browser and avoid naïve bot blocking.
 * Adjust sparingly; stable headers help avoid frequent detection changes.
 */
const DEFAULT_HEADERS = {
    'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
    Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'de,de-DE;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    'Accept-Encoding': 'gzip, deflate, br',
    Connection: 'keep-alive'
};

/**
 * Extracts a percentage (integer 0–100) from text, e.g. "Belegt: 42 %"
 * @param {string} text
 * @returns {number|null}
 */
function extractPercentageFromText(text) {
    if (!text) return null;
    const cleaned = text.replace(/\u00A0/g, ' '); // normalize non-breaking spaces
    const m = cleaned.match(/(\d{1,3})\s*%/);
    return m ? parseInt(m[1], 10) : null;
}

/**
 * Scrapes the shared "available seats" page containing all locations.
 * Returns an array of objects with title, aInfo (links/text per location) and statusText.
 * @param {string} url
 * @param {Record<string,string>} [headers]
 */
async function parseOccupancy(url, headers = DEFAULT_HEADERS) {
    try {
        const response = await axios.get(url, { headers, timeout: 15000 });
        const $ = cheerio.load(response.data);
        const results = [];

        // Example: "Stand: 02.04.25, 00:30 Uhr"
        const statusText = $('div.available-seats-table > p')
            .filter(function () {
                return $(this).text().trim().startsWith('Stand: ');
            })
            .text()
            .trim();

        $('div.available-seats-table-status').each((_, div) => {
            const td = $(div).parent('td');
            const tdText = td.text().trim().replace('image/svg+xml', ''); // sanitize stray text
            const nextTd = td.next('td');

            const aInfo = [];
            nextTd.find('a').each((__, a) => {
                const aText = $(a).text().trim();
                const aHref = $(a).attr('href');
                const pText = $(a).next('div').find('p').text().trim();
                aInfo.push({ text: aText, href: aHref, pText });
            });

            results.push({
                title: td.attr('title'), // e.g. "0 % von 360 Arbeitsplätzen sind belegt"
                percentages: tdText,
                aInfo,
                statusText
            });
        });

        if (DEBUG) console.log('[DEBUG] Occupancy results:', results);
        return results;
    } catch (error) {
        console.error('Failed to parse occupancy page:', error?.message);
        return [];
    }
}

/**
 * Scrapes opening hours from an individual location page.
 * The page structure: a "textmedia" content block containing a table with day/time rows.
 * @param {string} libraryUrl
 * @param {Record<string,string>} [headers]
 * @returns {Promise<Record<string,string>|null>}
 */
async function parseOpeningHours(libraryUrl, headers = DEFAULT_HEADERS) {
    try {
        const response = await axios.get(libraryUrl, { headers, timeout: 15000 });
        const $ = cheerio.load(response.data);

        // Opening hours are in a content block whose ID usually starts with "c280"
        const container = $('div.content-type-textmedia[id^="c280"]');
        if (!container.length) return null;

        const table = container.find('table.contenttable').first();
        if (!table.length) return null;

        const hours = {};
        table.find('tbody tr').each((_, tr) => {
            const tds = $(tr).find('td');
            if (tds.length >= 2) {
                const dayType = $(tds[0]).text().trim();
                const timeText = $(tds[1]).text().trim();
                hours[dayType] = timeText;
            }
        });

        if (DEBUG) console.log(`[DEBUG] Opening hours for ${libraryUrl}:`, hours);
        return hours;
    } catch (error) {
        console.error(`Failed to parse opening hours for ${libraryUrl}:`, error?.message);
        return null;
    }
}

/**
 * Scrapes a concise location info text from the location page.
 * Specifically reads from element #c375632 .icon-box-text and removes "Weitere Infos".
 * @param {string} libraryUrl
 * @param {Record<string,string>} [headers]
 * @returns {Promise<string|null>}
 */
async function parseLocationInfo(libraryUrl, headers = DEFAULT_HEADERS) {
    try {
        const response = await axios.get(libraryUrl, { headers, timeout: 15000 });
        const $ = cheerio.load(response.data);

        const container = $('#c375632 .icon-box-text');
        if (!container.length) return null;

        let infoText = container.text().trim();
        infoText = infoText.replace(/Weitere Infos\s*/i, '').trim();
        if (DEBUG) console.log(`[DEBUG] Location Info for ${libraryUrl}:`, infoText);

        return infoText || null;
    } catch (error) {
        console.error(`Failed to parse location info for ${libraryUrl}:`, error?.message);
        return null;
    }
}

module.exports = {
    parseOccupancy,
    parseOpeningHours,
    parseLocationInfo,
    extractPercentageFromText
};