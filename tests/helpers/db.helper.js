// ============================================
// Database Verification Helper (PostgreSQL)
// Direct DB state queries, consistency checks & test data cleanup
// ============================================

require('dotenv').config();
const { Pool } = require('pg');

let pool = null;

function isDbConfigured() {
    return Boolean(
        process.env.DATABASE_URL ||
        (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME)
    );
}

function getPool() {
    if (!isDbConfigured()) {
        return null;
    }
    if (!pool) {
        if (process.env.DATABASE_URL) {
            pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            });
        } else {
            pool = new Pool({
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT || '5432', 10),
                database: process.env.DB_NAME,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            });
        }
    }
    return pool;
}

/**
 * Execute a parameterized SQL query
 * @param {string} text - SQL Query text
 * @param {any[]} [params=[]] - Query parameters
 * @returns {Promise<{ rows: any[], rowCount: number }>}
 */
async function query(text, params = []) {
    const currentPool = getPool();
    if (!currentPool) {
        console.warn('⚠️ [DB Helper] Database is not configured in .env. Skipping direct DB query.');
        return { rows: [], rowCount: 0, skipped: true };
    }
    try {
        const start = Date.now();
        const res = await currentPool.query(text, params);
        const duration = Date.now() - start;
        return { rows: res.rows, rowCount: res.rowCount, duration, skipped: false };
    } catch (err) {
        console.error('❌ [DB Helper] Query error:', err.message);
        throw err;
    }
}

/**
 * Find record by ID in a given table
 */
async function findById(tableName, id, idColumn = 'id') {
    const result = await query(`SELECT * FROM ${tableName} WHERE ${idColumn} = $1 LIMIT 1`, [id]);
    return result.rows[0] || null;
}

/**
 * Clean up / delete test record by ID
 */
async function cleanUpById(tableName, id, idColumn = 'id') {
    return query(`DELETE FROM ${tableName} WHERE ${idColumn} = $1`, [id]);
}

/**
 * Close PostgreSQL pool connection
 */
async function closePool() {
    if (pool) {
        await pool.end();
        pool = null;
    }
}

module.exports = {
    isDbConfigured,
    query,
    findById,
    cleanUpById,
    closePool,
};
