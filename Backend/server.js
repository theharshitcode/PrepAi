require('dotenv').config();
const app = require('./src/app');  // ye missing tha
const PORT = process.env.PORT || 3000;
const connectDB = require('./src/config/database');

connectDB();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});