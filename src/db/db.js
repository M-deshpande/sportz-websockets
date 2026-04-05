import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async() => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.DB_URL}`);
        console.log("Connected to MongoDB");
        console.log("Using URL:", process.env.DB_URL);
        // console.log(`MongoDB Connection: ${connectionInstance.connection.host}`);
    }
    catch(error){
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

export default connectDB;