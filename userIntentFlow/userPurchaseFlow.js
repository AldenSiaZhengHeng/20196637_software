// This class function indicated the purchase flow that has been implemented
// The action about purchase request such as add item, remove item, checkout, enter shipping address and return tracking number have been implemented

const purchases = require('../model/purchase');
const itemlist = require('../item_list/itemlist');
const itemList = new itemlist();


class userPurchaseFlow{
    constructor(){
        this.basket = [];
        this.item_number = [];
        this.purchaseitem;
        this.nextintent;
        this.additional_item;
        this.previousintent;
        this.item_count = 0;
        this.item = [];
        this.amount = 0;
        this.current_item;
        this.chosen_item = [];
    }

    // this function will clear the parameter once the purchase action completed in order to process the other tasks.
    clearparam(){
        this.item_number = [];
        this.item = [];
        this.current_item = null;
        this.basket = [];
        this.nextintent = undefined;
        this.previousintent = undefined;
    }

    // This function will help to remove the item 1-by-1
    removeItemOnce(arr, value) {
        // console.log(arr)
        // console.log(value)

        var index = arr.indexOf(value);

        // console.log(index)
        if (index > -1) {
          arr.splice(index, 1);
        }

        console.log(arr)
        return arr;
    }

    // this is the main flow which will proceed the action based on the detected intent that related to purchase action
    async userPurchase(input, customer){
        const output = input;

        // Directly return response to customer due as the questions is unable to answer by it
        // specific intent that will trigger the alert notification module
        if(output.intent ==='additional_info'){
            output.intent = 'chatbot_confused'
            return output;
        }
        
        // return item added in the cart to customer
        if(output.intent === 'checkBasket'){
            if(!this.basket.length){
                output.answer = 'There is no item in the cart. Would you like to add something on it?'
                return output;
            }
            console.log('basket will be show')
            output.answer = [output.answer, this.basket];
            return output;
        }

        // clear the cart when user requested
        if(output.intent ==='basket.clean'){
            this.basket = [];
            output.basket = this.basket;
            return output;
        }
        
        // guide the flow to make sure it will proceed to next step in purchase flow
        // ex: add item -> checkout -> shipping address -> get tracking number
        if(this.nextintent){
            output.intent = this.nextintent;
            this.nextintent = undefined;
        }

        // directly add item when user had indicated the item clearly
        if(output.intent ==='customer.want_purchase'){
            this.nextintent = 'add.item_1';
            return output;
        }


        // extract the target entities and decide the action
        if(output.entities){
            for(let i = 0; i < output.entities.length; i++){
                switch(output.entities[i].entity){
                    case "number":
                        // this.item.push(output.entities[i].entity)
                        console.log(this.item_number)
                        console.log("detect number")
                        this.item_number.push(output.entities[i].utteranceText);
                        break;
                    
                    case "iphone":
                        console.log("detect iphone")
                        this.item.push(output.entities[i].entity)
                        console.log(this.item)
                        console.log(this.item.length)
                        // this.item = output.entities[i].entity
                        break;

                    case "samsung":
                        console.log("detect samsung")
                        this.item.push(output.entities[i].entity)
                        console.log(this.item)
                        // this.item = output.entities[i].entity
                        break;
                    
                    case "rog":
                        console.log("detect rog")
                        this.item.push(output.entities[i].entity)
                        console.log(this.item)
                        break;
                        // this.item = output.entities[i].entity
                }
            }
        }

        // function to handle if the user add mulitple item in one times
        if(output.intent === 'multiple_item.amount'){
            console.log('user enter the multiple item amount')
            for(let i = 0; i<this.basket.length; i++){
                console.log('enter the loop')
                var current = this.basket[i].split("-")
                if(current[0].trim() === this.chosen_item[0]){
                    console.log('enter here')
                    current[1] = parseInt(current[1].trim()) + parseInt(this.item_number);
                    this.basket[i] = this.chosen_item[0] + ' - ' + current[1]
                    this.chosen_item.shift();
                    console.log(this.chosen_item)
                    if(this.chosen_item.length > 0){
                        this.nextintent = 'multiple_item.amount';
                        output.answer = ['Please enter the amount that you would like to purchase for ' + this.chosen_item[0]]
                        this.item_number = [];
                    }
                    else{
                        output.answer = ['Your cart:<br />' + this.basket, "Is there anything I can do for you?"]
                        this.chosen_item = [];
                        this.item_number = [];
                    }
                    return output
                }
            }
            if(Array.isArray(this.chosen_item)){
                this.basket.push(this.chosen_item[0] + ' - ' + this.item_number)
            }
            this.chosen_item.shift();
            console.log(this.chosen_item)
            console.log(this.basket)
            output.basket = this.basket
            if(this.chosen_item.length > 0){
                this.nextintent = 'multiple_item.amount';
                output.answer = ['Please enter the amount that you would like to purchase for ' + this.chosen_item[0]]
                this.item_number = [];
            }
            else{
                output.answer = ['Your cart:<br />' + this.basket, "Is there anything I can do for you?"]
                this.chosen_item = [];
                this.item_number = [];
            }
            return output
        }

        // detect the item that the user would like to add to the cart and ask the user to enter the amount for it
        if(output.intent == 'customer_purchase'){
            console.log(this.item_number)
            if(this.item_number.length > 1){
                console.log('array item list')
                for(let i = 0; i<this.item_number.length; i++){
                    let item = itemList.getitem(this.item_number[i])
  
                    this.chosen_item.push(item)
                }
                this.nextintent = 'multiple_item.amount';
                output.answer = ['Please enter the amount that you would like to purchase for ' + this.chosen_item[0]]
                this.item_number = [];
            }
            else if(this.item_number.length = 1){
                console.log("1 item only")
                this.chosen_item = itemList.getitem(this.item_number)
                console.log(this.chosen_item)
                this.nextintent = 'item.amount';
                output.answer = ['Please enter the amount that you would like to purchase for ' + this.chosen_item]
                this.current_item = this.chosen_item;
                this.item_number = [];
            }

            if(this.chosen_item == undefined || !this.chosen_item.length){
                output.answer = 'There is no such item number/ items in the store. Please re-enter again.'
                return output;
            }
            return output;
        }
        // same function as above customer purchase item but with specific item mentioned
        else if(output.intent == 'add.item_1' || output.intent == 'add.item_2' || output.intent == 'add.item_3'){
            console.log("hello there")
            console.log(this.item)
            if(this.item.length == 0){
                output.answer = 'There is no such item number/ items in the store. Please re-enter again.'
                return output;
            }

            if(this.item.length > 1){
                console.log('array item list')
                for(let i = 0; i<this.item.length; i++){
                    let item = itemList.getitem(this.item[i])
                    // if(this.chosen_item.includes(item)){
                    //     continue;
                    // }
                    this.chosen_item.push(item)
                }
                this.nextintent = 'multiple_item.amount';
                output.answer = ['Please enter the amount that you would like to purchase for ' + this.chosen_item[0]]
                this.item = [];
                this.item_number = [];
            }
            else {
                console.log("1 item only")
                this.chosen_item = itemList.getitem(this.item)
                console.log(this.chosen_item)
                this.nextintent = 'item.amount';
                
                output.answer = ['Please enter the amount that you would like to purchase for ' + this.chosen_item]
                this.current_item = this.chosen_item;
                this.item = [];
                this.item_number = [];
            }

            return output;
        }
        // detect the amount of the item that user entered for the item would like to add into the cart
        else if(output.intent == 'item.amount'){
            console.log('user enter the amount')
            console.log(this.item_number)
            console.log(this.chosen_item)
            for(let i = 0; i<this.basket.length; i++){
                console.log('enter the loop')
                var current = this.basket[i].split("-")
                if(current[0].trim() === this.chosen_item){
                    console.log('enter here')
                    current[1] = parseInt(current[1].trim()) + parseInt(this.item_number);
                    this.basket[i] = this.chosen_item + ' - ' + current[1]
                    output.answer = ['Your cart:<br />' + this.basket, 'Is there anything I can do for you?']
                    this.chosen_item = [];
                    this.item_number = [];
                    return output
                }
            }
            if(this.item_number){
                this.basket.push(this.current_item + ' - ' + this.item_number)
            }
            output.answer = ['Your cart:<br />' + this.basket, 'Is there anything I can do for you?']
            console.log(this.basket)
            output.basket = this.basket
            this.item_number = [];
            this.chosen_item = [];
            return output
        }
        // function to remove the item from cart with specific amount mentioned by user
        else if(output.intent === 'remove.item_amount'){
            var original_length = this.basket.length;
            var remove_item;
            for(let i = 0; i<this.basket.length; i++){
                var current = this.basket[i].split("-")
                console.log(this.chosen_item)
                console.log(this.chosen_item[i])
                console.log(this.item_number)
                if(this.chosen_item[0] == current[0].trim()){
                    console.log('enter here')
                    current[1] = parseInt(current[1].trim()) - parseInt(this.item_number);
                    if(current[1] > 0){
                        this.basket[i] = this.chosen_item[0] + ' - ' + current[1].toString()
                        break;
                    }
                    else{
                        remove_item = this.chosen_item[i];
                        console.log(this.basket)
                        this.basket.splice(i,1)
                        break;
                    }
                }

            }
            this.chosen_item.shift();
            console.log(this.chosen_item.length)
            if(this.chosen_item.length > 0){
                this.nextintent = 'remove.item_amount';
                output.answer = ['Please enter the amount that you would like to remove for ' + this.chosen_item[0]]
                output.basket = this.basket;
                this.item_number = []
                return output;
            }

            if(this.basket.length <= 0){
                output.answer = 'All item has been ad from the cart!'
            }else if(this.basket.length < original_length){
                output.answer = ["Item " + a_item + " has been removed as the amount to remove is larger than the amount in the basket.", "Your cart: <br />" + this.basket, "Is there anything I can do for you?"]
            }
            else{
                output.answer = ["Your cart: <br />" + this.basket, "Is there anything I can do for you?"]
            }
            
            this.item_number = []
            output.basket = this.basket;
            return output;
        }
        
        // determine whether the user is request to remove the item from cart.
        // once detected, ask for the amount to remove. 
        else if(output.intent === 'remove.item' || output.intent === 'remove.item_1' || output.intent === 'remove.item_2' || output.intent === 'remove.item_3'){
            if(this.basket.length){
                if(this.item.length){
                    this.chosen_item = [];
                    console.log("enter item length")
                    console.log(this.item)
                    console.log(this.item.length)
                    this.nextintent = 'remove.item_amount'
                    for(let i = 0; i<this.item.length; i++){
                        this.chosen_item.push(itemList.getitem(this.item[i]))
                    }
                    console.log(this.basket)
                    console.log(this.chosen_item)
                    this.item = []
                    this.item_number = []
                    output.answer = 'Please enter the amount you want to remove for ' + this.chosen_item[0];
                    return output;

                }
                else if(this.item_number.length){
                    console.log("enter item number length")
                    this.chosen_item = [];
                    this.nextintent = 'remove.item_amount'
                    for(let i = 0; i<this.item_number.length; i++){
                        this.chosen_item.push(itemList.getitem(this.item_number[i]))
                        // this.basket.push(chosen_item + " x 1")
                    }
                    console.log(this.basket)
                    console.log(this.chosen_item)
                    this.item = []
                    this.item_number = []
                    output.answer = 'Please enter the amount you want to remove for ' + this.chosen_item[0];
                    return output;
                }
                output["basket"] = this.basket;
                return output;
            }else{
                output.answer = 'Your cart is empty!'
                return output;
            }
        }
        // detect whether user would like to checkout
        else if(output.intent === 'customer.checkout'){
            console.log("customer checkout")
            if(this.basket.length>0){
                output.answer = ['Your cart:<br />' + this.basket,'Do you want to add Sim card?']
                this.additional_item = 'sim_card';
                // output.answer = 'Alright, can you please provide your address?'
                this.previousintent = 'customer.checkout';
                this.nextintent = undefined;
                return output;
            }else if(!this.basket.length){
                console.log("the basket is empty");
                output.answer = 'There is no items added in the basket.'
                return output;
            }
        }
        // ask whether user would like to add sim card and phone case or not before entering shipping address
        else if(output.intent =='agreement'){
            if(this.additional_item == 'sim_card'){
                console.log("add sim card")
                this.additional_item = 'phone_cases';
                this.basket.push("Sim Card x 1")
                output.answer = ["Sim card will be added on", "Do you want to buy phone cases too?"];
                return output;
            }
            if(this.additional_item =='phone_cases'){
                console.log("add phone case")
                this.basket.push("Phone case x 1")
                output.answer = ["A phone cases will be added on.", "Can you provide the address?"]
                this.additional_item = undefined;
                this.previousintent = 'customer.address';
                return output;
            }
            return output;
        }
        else if(output.intent === 'disagreement'){
            if(this.additional_item == 'sim_card'){
                this.additional_item = 'phone_cases';
                output.answer = ["Alright, Do you want to buy phone cases?"];
                return output;
            }
            if(this.additional_item =='phone_cases'){
                output.answer = ["Alright, Can you provide the address?"]
                this.nextintent = undefined;
                this.previousintent = 'customer.address'
                return output;
            }    
            if(this.basket != null || this.basket.length > 0){
                output.answer = ["Alright, you can ask me any questions at anytime when you want to do so.","However, I have found that you have added item to your cart. You can ask for 'check out' to me if you want to complete your purchasing action."];
                this.nextintent = undefined;
                return output;
            }  
            return output;  
        }
        // Ask the user to enter the shipping address and determine whether it is available within UK Region
        // after that return the tracking number
        else if(this.previousintent == 'customer.address'){
            console.log("customer provide location")
            if(output.intent == 'UK_location'){
                if(this.basket.length > 0){
                    console.log('customer checkout')
                    let purchaseId = this.makeid(20)
                    let basket = {
                        trackingNumber: purchaseId,
                        username: customer.username,
                        item: this.basket,
                        location: output.utterance,
                        status: 'pending'
                    }
                    try{
                        const m = new purchases(basket);
                        await m.save();
                    } catch(e){
                        output.answer = [e];
                        return output;
                    }
                    var successMsg = "Thank you for your patient. Your tracking number will be "+ "<strong>" + purchaseId + "</strong>"  +"<br />Please keep this number with you"
                    output.answer = [successMsg, "Is there anything I can do for you?"];
                    this.clearparam();
                    output.intent = 'end_purchase_flow';
                    // this.currentRequest = undefined;
                    return output;
                }
            }
            else{
                console.log('User enter outside the uk region');
                output.answer = ["Sorry, currently we are not provide delivery service outside UK region", "Could you please provide other address or do you want me to find an human operator for you?"]
                output.intent = 'chatbot_confused';
                return output;
            }
        }
        // handle unrecognized intent
        // intent detection
        else if(output.answer == undefined){
            output.answer = ['Sorry, I can\'t recognize what you are saying. Can you state your answer clearly or more details?', 'Please make sure that your asked questions is under the purchase flow, if you want to quit, please type any command like "quit, leave"']
            output.intent = 'chatbot_confused';
            return output;
        }
        return output;
    }

    // function to generate tracking number
    makeid(length) {
        let result = '';
        const characters = '0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }
}

module.exports = userPurchaseFlow;