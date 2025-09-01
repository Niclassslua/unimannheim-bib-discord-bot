// src/presence.js
/**
 * Presence rotation for the bot. Keeps things light and fun while remaining informative.
 */
const { ActivityType } = require('discord.js');

/**
 * Sets a random presence from a curated list. Call periodically to rotate.
 * @param {import('discord.js').Client} client
 */
function setPresence(client) {
    const entries = [
        { text: 'in der Bib essen', value: ActivityType.Playing },
        { text: 'Leuten die laut telefonieren', value: ActivityType.Listening },
        { text: 'Fussballspiel in der Bib', value: ActivityType.Watching },
        { text: 'Füße auf den Tisch legen', value: ActivityType.Playing },
        { text: 'Clash of Clans in der Bib', value: ActivityType.Playing },
        { text: 'ins Handy statt zu lernen', value: ActivityType.Watching }
    ];

    const picked = entries[Math.floor(Math.random() * entries.length)];
    client.user.setPresence({
        activities: [{ name: picked.text, type: picked.value }]
    });
}

module.exports = { setPresence };