// This class is to create the purchase table in the database

const mongoose = require('mongoose')

// The table will store the tracking number, username, item, shipping location and status
const purchaseSchema = new mongoose.Schema(
    {
        trackingNumber:{type: String, required:true, unique:true},
        username: { type: String, required: true},
        item:{type: Array, required:true},
        location:{type:String, required:true},
        status:{type:String,required:true}

    }, 
    {collection: 'purchases',timestamps:true}
)

const model = mongoose.model('purchaseSchema', purchaseSchema)

module.exports = model 
