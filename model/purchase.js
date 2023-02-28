const mongoose = require('mongoose')

const purchaseSchema = new mongoose.Schema(
    {
        purchaseId:{type: String, required:true, unique:true},
        username: { type: String, required: true},
        item:{type: Array, required:true},
    }, 
    {collection: 'purchases'}
)

const model = mongoose.model('purchaseSchema', purchaseSchema)

module.exports = model 
