// src/db.js
/**
 * Database access module (MySQL, using mysql2/promise).
 * Exposes a shared connection pool and a single write helper for occupancy snapshots.
 */
const mysql = require('mysql2/promise');

const DEBUG = process.env.DEBUG === 'true';

/**
 * Connection pool created once and reused across calls.
 * Ensure corresponding env vars are set in `.env`.
 */
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});

/**
 * Inserts a single occupancy snapshot for a given library area.
 * @param {string} bib - Area name (e.g., 'A3')
 * @param {number} percentage - Occupied percentage (0–100)
 * @param {number} occupied - Absolute occupied seat count
 */
async function insertBelegung(bib, percentage, occupied) {
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