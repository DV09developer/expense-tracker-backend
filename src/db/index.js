import dns from "dns";
import { DB_NAME } from "../constants.js";

dns.setServers([
    "8.8.8.8",
    "1.1.1.1"
]);
import mongoose from "mongoose";

const connect_db = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected to MongoDB successfully");
        console.log(`mongo DB connected !! DB HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    } 
};

export default connect_db;