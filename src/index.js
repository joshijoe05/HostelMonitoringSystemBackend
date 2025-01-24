require("dotenv").config({ path: "./.env" });
const connectToDB = require("./db/index");
const { app } = require("./app");

connectToDB()
    .then(() => {
        app.listen(
            process.env.PORT,
            () => console.log(`Server is running on port ${process.env.PORT}`)
        );
    })
    .catch((error) => {
        console.error('MONGO DB Connection Error', error);
    })