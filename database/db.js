const mongoose = require('mongoose' )


// connect the mongodb database with specific url
const connectDB = async () => {
    try{
        // this will connect to the database of this project owner created
        // if you are want to connect to own database, please modify this url
        await mongoose.connect('mongodb+srv://aldensia0207:aldensia0207@chatbot-database.jzc8grd.mongodb.net/registered_admin', {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
    } catch (err) {
        console.log(err)
    }
}

module.exports = connectDB