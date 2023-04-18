// This class is to create the purchase table in the database
const mongoose = require('mongoose')

// The table will store the refund ticket id, tracking number, username, item, reason and status when the refund request done
const refundTicketSchema = new mongoose.Schema(
    {
        RefundTicketId:{type: String, required:true, unique:true},
        TrackingNumber:{type: String, required:true},
        username: { type: String, required: true},
        item:{type: Array, required:true},
        reason:{type: Array, required:true},
        status:{type:String, required:true}
    },
    {collection: 'refundTicket',timestamps:true}
)

const model = mongoose.model('refundTicketsSchema', refundTicketSchema)

module.exports = model 
