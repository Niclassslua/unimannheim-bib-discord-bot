// src/render.js
/**
 * Embed creation utilities to render a clean, informative Discord message.
 */
const { EmbedBuilder } = require('discord.js');

/**
 * Returns a tuple [imageUrl, colorHex] based on occupancy percentage.
 * < 90%: green, 90–99%: orange, 100%: red
 * @param {number} percentages
 * @returns {[string, string]}
 */
function getPercentageDetail(percentages) {
    if (percentages < 90) {
        return ['https://i.imgur.com/zjYpulv.png', '00de00'];
    } else if (percentages >= 90 && percentages < 100) {
        return ['https://i.imgur.com/Qyoa3lH.png', 'de8d00'];
    } else {
        return ['https://i.imgur.com/xILYBDa.png', 'de0000'];
    }
}

/**
 * Builds a Discord Embed for a single library area.
 * @param {{
 *  bib: string,
 *  content: { aInfo: Array<{text:string, href:string}>, statusText: string },
 *  openingHours: Record<string,string>|null,
 *  locationInfo: string|null,
 *  occupiedSeats: number,
 *  totalSeats: number|'?',
 *  perc: number,
 *  arrow: string,
 *  imageUrl: string,
 *  colorHex: string
 * }} params
 * @returns {EmbedBuilder}
 */
function buildEmbed(params) {
    const {
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
    } = params;

    const placeName = content?.aInfo?.[0]?.text || bib;
    const linkPath = content?.aInfo?.[0]?.href || '';

    // Compose opening hours into a readable block (preserve row order as provided).
    let hoursStr = '';
    if (openingHours) {
        for (const [day, times] of Object.entries(openingHours)) {
            hoursStr += `${day}: ${times}\n`;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`Aktueller Status ${placeName}`)
        .addFields(
            {
                name: '🕔  **Öffnungszeiten**',
                value: hoursStr || '*Keine Öffnungszeiten verfügbar.*',
                inline: false
            },
            {
                name: '🪑  **Arbeitsplätze**',
                value: `${occupiedSeats} belegt, ${
                    typeof totalSeats === 'number' ? totalSeats - occupiedSeats : '?'
                } frei ${arrow}`
            },
            { name: '🔴️  **Belegt**', value: `${perc}%` }
        )
        .addFields({
            name: '🗓️  **Stand**',
            value: `${(content?.statusText || '').replace(/^Stand:\s*/, '')}`
        })
        .setColor(colorHex)
        .setThumbnail(imageUrl)
        .setTimestamp()
        .setURL(linkPath ? `https://www.bib.uni-mannheim.de${linkPath}` : null)
        .setFooter({
            text: 'Made by NiclasssLua',
            iconURL: 'https://avatars.githubusercontent.com/u/78554432'
        });

    if (locationInfo) {
        embed.addFields({ name: '📌️  **Info**', value: locationInfo, inline: false });
    }

    return embed;
}

module.exports = {
    getPercentageDetail,
    buildEmbed
};