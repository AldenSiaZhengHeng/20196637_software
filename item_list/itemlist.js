// This class contain all the product sold in this hybrid chatbot system

class itemlist{
    constructor(){
        this.item_list = {
            "1": "Iphone 14 pro",
            "2": "Samsung Galaxy S22",
            "3": "ASUS ROG phone 6",
            "iphone":"Iphone 14 pro",
            "samsung":"Samsung Galaxy S22",
            "rog": "ASUS ROG phone 6"
        }

    }

    // This function will return the corresponding item that match to the specific value extracted by chatbot model.
    getitem(selected){
        const targeted = this.item_list[selected]
        // console.log("get item here")
        // console.log(targeted)
        return targeted
    }
}

module.exports = itemlist