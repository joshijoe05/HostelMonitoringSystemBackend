const { createClient } = require('redis');
require("dotenv").config();

const client = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: 'redis-10264.c212.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 10264
    }
});

const connectToRedis = async () => {
    try {
        await client.connect();
        client.on('error', (err) => console.log('Redis Client Error', err));
    }
    catch (error) {
        console.log(error);
    }
}

module.exports = { client, connectToRedis };
