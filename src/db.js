// src/db.js
/**
 * Database access module (MySQL, using mysql2/promise).
 * Exposes a shared connection pool and a single write helper for occupancy snapshots.
 */
const mysql = require('mysql2/promise');

const DEBUG = process.env.DEBUG === 'true';
const USE_DB = process.env.USE_DB === 'true';

let pool = null;

/**
 * Create connection pool only if DB usage is enabled.
 */
if (USE_DB) {
    pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });
}

/**
 * Inserts a single occupancy snapshot for a given library area.
 * No-op if USE_DB=false.
 * @param {string} bib - Area name (e.g., 'A3')
 * @param {number} percentage - Occupied percentage (0–100)
 * @param {number} occupied - Absolute occupied seat count
 */
async function insertBelegung(bib, percentage, occupied) {
    if (!USE_DB) {
        if (DEBUG) console.log('[DB] Skipped insert (USE_DB=false)');
        return;
    }
    try {
        if (DEBUG) {
            console.log(`[DB] Insert ${bib}: ${percentage}% / ${occupied} seats`);
        }
        await pool.execute(
            'INSERT INTO belegung (bib, percentage, occupied) VALUES (?, ?, ?)',
            [bib, percentage, occupied]
        );
    } catch (err) {
        console.error('[SQL] Insert failed:', err?.message);
    }
}

module.exports = { pool, insertBelegung };
