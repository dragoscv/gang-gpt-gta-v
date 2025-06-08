#!/usr/bin/env node
const RedisServer = require('redis-server');
const path = require('path');

// Start Redis server on port 4832
const server = new RedisServer({
    port: 4832,
    password: 'redis_dev_password'
});

server.open((err) => {
    if (err) {
        console.error('Failed to start Redis server:', err);
        process.exit(1);
    }
    console.log('Redis server started on port 4832');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down Redis server...');
    server.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down Redis server...');
    server.close();
    process.exit(0);
});
