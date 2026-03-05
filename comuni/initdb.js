// initDb.js — run this once to create your tables

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function init() {
  try {
    // Connect to MySQL server (not specifying DB yet)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true, // needed to run many queries in schema.sql
    });

    // Read schema.sql file
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await connection.query(schema);

    console.log('✅ Database schema executed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error running schema:', err);
    process.exit(1);
  }
}

init();