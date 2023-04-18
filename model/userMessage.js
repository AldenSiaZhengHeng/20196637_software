// This class is to create the user message table in the database to store all message from the conversation

const mongoose = require('mongoose')

// This will create the variables such as username, message, agent (martin, louis, david), agent type (handover strategies type), intent (recognize from input message), operator message, user type (admin or user) and response time from chatbot
const userMessageSchema = new mongoose.Schema(
    {
        username: { type: String, required: true},
        message: { type: String},
        agent: {type:String},
        agentType:{type:String},
        agentMessage: {type:Array},
        intent:{type:String},
        operatorMessage:{type:String},
        userType:{type:String},
        response_time:{type:String}
    }, 
    {collection: 'userMessages',timestamps:true}
)

const model = mongoose.model('userMessageSchema', userMessageSchema)

module.exports = model 
