const mongoose = require('mongoose')

const userMessageSchema = new mongoose.Schema(
    {
        username: { type: String, required: true},
        message: { type: String},
        agent: {type:String},
        agentMessage: {type:Array},
        intent:{type:String},
        operatorMessage:{type:String},
        userType:{type:String}
    }, 
    {collection: 'userMessages'}
)

const model = mongoose.model('userMessageSchema', userMessageSchema)

module.exports = model 
