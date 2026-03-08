/*

This file is responsible for setting up MySQL pool connection 

We use a pool instead of a single connection so that multiple requests 
can be handled concurrently without waiting for each other. 

mysql2 promise gives us async/await support out of the box- ensuring that 
every query returns a promise, so we can try/catch instead of callbacks 

*/

const mysql = require('mysql2/promise'); 
require('dotenv').config();

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'root@1203',
  database:           process.env.DB_NAME     || 'communitask',
  waitForConnections: true,   // queue requests when all connections are busy
  connectionLimit:    10,     // max simultaneous open connections
  queueLimit:         0,      // 0 = unlimited queue depth
}); 

/**
 Testing the connection once at startup so we get an immediate, clear error 
 rather than a cryptic failure on the first real request
 */

 async function testConnection() {
    try{ 
        const conn = await pool.getConnection();
        console.log('MySQL file connected successfully'); 
        conn.release(); 
    } catch (err) { 
        console.error('MySQL connection failed', err.message); 
        process.exit(1); 
    }
} 

module.exports = {pool, testConnection}; 


