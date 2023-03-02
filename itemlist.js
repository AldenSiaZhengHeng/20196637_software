class itemlist{
    constructor(){
        this.item_list = {
            "1": "Iphone 14 pro",
            "2": "Samsung Galaxy S22",
            "3": "ROG phone"
        }

    }

    getitem(selected){
        const targeted = this.item_list[selected]
        console.log("get item here")
        console.log(targeted)
        return targeted
    }
}

module.exports = itemlist