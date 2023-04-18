// This class is to create the admin user table in the database

const mongoose = require('mongoose')

// The table will store the username and password for the admin
const UserSchema = new mongoose.Schema(
    {
    username: { type: String, required: true, unique: true},
    password: { type: String, required: true}
    }, 
    {collection: 'users',timestamps:true}
)

const model = mongoose.model('UserSchema', UserSchema)

module.exports = model 