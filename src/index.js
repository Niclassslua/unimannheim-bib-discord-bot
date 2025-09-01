// src/index.js
/**
 * Discord bot entrypoint.
 * - Periodically scrapes occupancy data for multiple library areas
 * - Renders a clean embed per area
 * - Updates pinned messages in a designated channel
 * - Optionally writes periodic snapshots to MySQL
 *
 * Secrets / configuration are read from environment variables (see .env.example).
 */
require('dotenv').config();

const { Client, GatewayIntentBits } = require('discord.js');
const {
    parseOccupancy,
    parseOpeningHours,
    parseLocationInfo,
    extractPercentageFromText
} = require('./scraper');
const { getPercentageDetail, buildEmbed } = require('./render');
const { insertBelegung } = require('./db');
const { setPresence } = require('./presence');

const DEBUG = process.env.DEBUG === 'true';

/**
 * Channel and message IDs can be set via environment variables for flexibility across servers.
 * Defaults are provided for quick local testing but you should prefer env-based configuration.
 */
const textChannelID = process.env.TEXT_CHANNEL_ID || '1202063251379068938';
const messageIDs = {
    A3: process.env.MESSAGE_A3 || '1202069658975600743',
    A5: process.env.MESSAGE_A5 || '1202070259079843881',
    Ehrenhof: process.env.MESSAGE_EHRENHOF || '1202070276180029501',
    Schneckenhof: process.env.MESSAGE_SCHNECKENHOF || '1202070296543100958'
};

// Shared occupancy overview page
const occupancyUrl =
    process.env.OCCUPANCY_URL ||
    'https://www.bib.uni-mannheim.de/standorte/freie-sitzplaetze/';

// Per-area pages (opening hours and location info)
const libraryUrls = {
    A3: 'https://www.bib.uni-mannheim.de/standorte/bb-a3/',
    A5: 'https://www.bib.uni-mannheim.de/standorte/bb-a5/',
    Ehrenhof: 'https://www.bib.uni-mannheim.de/standorte/bb-schloss-ehrenhof/',
    Schneckenhof: 'https://www.bib.uni-mannheim.de/standorte/bb-schloss-schneckenhof/'
};

// Create client with required intents. Keep the set minimal to what you actually need.
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ]
});

// Ephemeral runtime state
let actionCounter = 0;
const previousOccupancy = {};

/**
 * Bootstraps the bot once it's online:
 * - Kicks off the first update
 * - Schedules periodic updates (every 2.5 minutes)
 * - Rotates presence every 30 minutes
 */
client.once('ready', async () => {
    console.log('Bot logged in.');
    await doAction();
    setInterval(doAction, 150000); // 2.5 minutes
    setPresence(client);
    setInterval(() => setPresence(client), 1800000); // 30 minutes
});

/**
 * One update tick:
 * - Fetch occupancy overview
 * - For each area: fetch opening hours & info, compute stats and trend, render embed, edit message
 * - Every 4th tick: persist a snapshot to DB
 */
async function doAction() {
    try {
        const occupancy = await parseOccupancy(occupancyUrl);
        const channel = await client.channels.fetch(textChannelID);

        for (const [bib, messageId] of Object.entries(messageIDs)) {
            const libraryUrl = libraryUrls[bib];

            const [openingHours, locationInfo] = await Promise.all([
                parseOpeningHours(libraryUrl),
                parseLocationInfo(libraryUrl)
            ]);

            const content = occupancy.find((c) => c.aInfo?.some((a) => a.text.includes(bib)));
            if (!content) continue;

            const titleRaw = (content.title || '').replace(/\u00A0/g, ' ');
            if (DEBUG) console.log(`[DEBUG] Title for ${bib}:`, titleRaw);

            // Primary pattern: "NN % von MMM Arbeitsplätzen sind belegt"
            const match = titleRaw.match(/(\d{1,3})\s*%\s*von\s*(\d{1,4})\s*Arbeitsplätzen/);

            let totalSeats = '?';
            let occupiedSeats = 0;
            let perc = 0;

            if (match && match.length === 3) {
                perc = parseInt(match[1], 10);
                totalSeats = parseInt(match[2], 10);
                occupiedSeats = Math.round((perc / 100) * totalSeats);
            } else {
                // Fallback: extract at least the percentage value
                const fallbackPerc = extractPercentageFromText(titleRaw);
                if (fallbackPerc !== null) perc = fallbackPerc;

                if (typeof totalSeats === 'number' && perc && totalSeats !== '?') {
                    occupiedSeats = Math.round((perc / 100) * totalSeats);
                }
            }

            // Trend arrow (up / down / steady) based on last tick
            let arrow = '➡️';
            if (previousOccupancy[bib] !== undefined) {
                if (occupiedSeats > previousOccupancy[bib]) arrow = '⬆️';
                else if (occupiedSeats < previousOccupancy[bib]) arrow = '⬇️';
            }
            previousOccupancy[bib] = occupiedSeats;

            const [imageUrl, colorHex] = getPercentageDetail(perc);

            const embed = buildEmbed({
                bib,
                content,
                openingHours,
                locationInfo,
                occupiedSeats,
                totalSeats,
                perc,
                arrow,
                imageUrl,
                colorHex
            });

            try {
                const message = await channel.messages.fetch(messageId);
                await message.edit({ embeds: [embed] });
            } catch (err) {
                console.error(`[Discord] Failed to edit message for ${bib}:`, err?.message);
            }

            // Persist every 4th tick to reduce DB load while keeping a useful time series
            if (actionCounter % 4 === 0) {
                await insertBelegung(bib, perc, occupiedSeats);
            }
        }

        actionCounter += 1;
    } catch (err) {
        console.error('[doAction] Unexpected failure:', err?.message);
    }
}

// Use an environment-provided token. Never hardcode secrets in source code.
client.login(process.env.DISCORD_TOKEN);