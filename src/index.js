require("dotenv").config({ path: "./.env" });
const connectToDB = require("./db/index");
const { connectToRedis } = require("./config/redis");
const { app } = require("./app");

connectToDB()
    .then(() => {
        connectToRedis().then(() => console.log("Connected to Redis")).catch(error => console.log(`Error connecting to redis ${error}`));
        app.listen(
            process.env.PORT,
            () => console.log(`Server is running on port ${process.env.PORT}`)
        );
    })
    .catch((error) => {
        console.error('MONGO DB Connection Error', error);
    })