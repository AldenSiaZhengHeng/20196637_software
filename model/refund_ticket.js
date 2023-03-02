const mongoose = require('mongoose')

const refundTicketSchema = new mongoose.Schema(
    {
        RefundTicketId:{type: String, required:true, unique:true},
        TrackingNumber:{type: String, required:true},
        username: { type: String, required: true},
        item:{type: Array, required:true},
        reason:{type: String, required:true},
        status:{type:String, required:true}
    },
    {collection: 'refundTicket',timestamps:true}
)

const model = mongoose.model('refundTicketsSchema', refundTicketSchema)

module.exports = model 
