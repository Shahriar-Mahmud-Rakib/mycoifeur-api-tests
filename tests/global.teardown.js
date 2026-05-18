const { Client } = require('pg');

const DB_CONFIG = {
    host: '52.220.54.42',
    port: 5432,
    database: 'mycoifeur_dev_db',
    user: 'mycoifeur_dev_user',
    password: 'gY2TDhhC3vBCeNN7SZQc',
};

async function globalTeardown() {
    console.log('\n=======================================');
    console.log('🧹 GLOBAL TEARDOWN: Cleaning up test data...');
    console.log('=======================================');
    
    const client = new Client(DB_CONFIG);
    try {
        // Only run cleanup if explicitly requested or running in CI
        if (process.env.CI !== 'true' && process.env.CLEAN_TEST_DATA !== 'true') {
            console.log('ℹ️  Skipping DB cleanup. Test data is preserved for manual DB inspection!');
            console.log('💡 Tip: Set CLEAN_TEST_DATA=true or CI=true environment variable to enable automatic cleanup.');
            return;
        }

        await client.connect();

        // Delete test users (e2e_user, e2e_salon, complex_user)
        // First delete from verification_logs to avoid foreign key conflicts
        const logResult = await client.query(`
            DELETE FROM verification_logs 
            WHERE user_id IN (
                SELECT id FROM users 
                WHERE email LIKE 'e2e_%' OR email LIKE 'complex_%'
            )
        `);
        console.log(`🧹 Deleted ${logResult.rowCount} verification logs for test users.`);

        const userResult = await client.query(`
            DELETE FROM users 
            WHERE email LIKE 'e2e_%' OR email LIKE 'complex_%'
        `);
        console.log(`🧹 Deleted ${userResult.rowCount} test users from database.`);
        
        console.log('✅ Global teardown completed successfully.');
    } catch (err) {
        console.error('❌ Error during global teardown cleanup:', err.message);
    } finally {
        // Ensure client is only ended if it was connected
        if (client._connected) {
            await client.end();
        }
    }
}

module.exports = globalTeardown;
