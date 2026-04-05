const dotenv = require('dotenv');
dotenv.config();

if(!process.env.MONGO_URI){
    console.error("MONGO_URI is not defined in the environment variables.");
    process.exit(1);
}
if(!process.env.PORT){
    console.error("PORT is not defined in the environment variables.");
    process.exit(1);
}
if(!process.env.JWT_SECRET){
    console.error("JWT_SECRET is not defined in the environment variables.");
    process.exit(1);
}
if(!process.env.GROQ_API_KEY){
    console.error("GROQ_API_KEY is not defined in the environment variables.");
    process.exit(1);
}   
if(!process.env.JWT_REFRESH_SECRET){
    console.error("JWT_REFRESH_SECRET is not defined in the environment variables.");
    process.exit(1);
}

if(!process.env.RAZORPAY_KEY_ID){
    console.error("RAZORPAY_KEY_ID is not defined in the environment variables.");
    process.exit(1);
}
if(!process.env.RAZORPAY_KEY_SECRET){
    console.error("RAZORPAY_KEY_SECRET is not defined in the environment variables.");
    process.exit(1);
}



module.exports = {
    MONGO_URI: process.env.MONGO_URI,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET
};