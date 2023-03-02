const e = require('express');
const mongoose = require('mongoose');
const purchases = require('./model/purchase');
const refundTicket = require('./model/refund_ticket');
const itemlist = require('./itemlist');
const { off } = require('./model/purchase');
const itemList = new itemlist();



class userIntent {
    constructor(){
        this.nextintent;
        this.previousintent;
        this.purchaseitem;
        this.trackingNumber;
        this.currentRequest;
        this.basket = [];
        this.item_number;
        this.item_broken = false;
        this.item_lost = false;
        this.item_delayed = false;
        this.details_reason = [];
        this.counter = 0;
        this.additional_item;
    }

    checkmode(input){
        if(input.intent == 'user.refund' || input.intent =='reason.item_broken'){
            this.currentRequest = 'refund_mode';
        }
        else if(input.intent == 'customer_purchase'){
            this.currentRequest = 'purchase_mode';
        }
        else if(input.intent == 'track.purchase' || input.intent == 'track.refund'){
            this.currentRequest = 'tracking_mode'
        }
    }

    async trackingProcess(input, customer){
        const output = input;

        if(this.nextintent){
            output.intent = this.nextintent;
            this.nextintent = undefined;
        }

        if(output.intent == 'track.purchase'){
            console.log("track purchase package");
            this.nextintent = 'tracking_package';
            return output;
        }
        else if(output.intent == 'track.refund'){
            console.log("track refund process");
            this.nextintent = 'tracking_refund';
            return output;
        }
        else if(output.intent == 'tracking_package'){
            console.log('search in database')
            try{
                const result = await purchases
                .find({
                    purchaseId:{$all:input.utterance}
                })
                if(result.length > 0){
                    console.log('find in database')
                    console.log(result[0])
                    var response = 'Tracking Number: ' + result[0].purchaseId + '<br />Purchase item: ' + result[0].item + '<br />Shipped address: ' + result[0].location + '<br />Status: ' + result[0].status;
                    output.answer = [response, 'Is there anything I can do for you?']
                    this.nextintent = undefined
                    return output;
                }else{
                    console.log("not found")
                    output.answer = 'There is no such tracking number in the record. Please make sure you enter the correct tracking number.'
                    this.nextintent = 'tracking_package';
                    return output;

                }
            }catch (error){
                output.answer = error
            }
        }
        else if(output.intent == 'tracking_refund'){
            console.log('search in database')
            try{
                const result = await refundTicket
                .find({
                    RefundTicketId:input.utterance
                })
                if(result.length > 0){
                    console.log('find in database')
                    console.log(result[0])
                    var response = 'Refund Ticket: ' + result[0].RefundTicketId + '<br />Purchase item: ' + result[0].item + '<br />Reason: ' + result[0].reason + '<br />Status: ' + result[0].status;
                    output.answer = [response, 'Is there anything I can do for you?']
                    this.nextintent = undefined
                    return output;
                }else{
                    console.log("not found")
                    output.answer = 'There is no such refund ticket in the record. Please make sure you enter the correct refund ID number.'
                    this.nextintent = 'tracking_package';
                    return output;

                }
            }catch (error){
                output.answer = error
            }
        }
        return output;

    }

    async otherTask(input, customer){
        const output = input;

        if(output.intent ==='customer.checkout'){
            
            if(this.basket.length > 0){
                console.log('customer checkout')
                let basket = {
                    purchaseId: this.makeid(10),
                    username: customer.username,
                    item: this.basket
                }
                const m = new purchases(basket);
                await m.save();
                this.nextintent = undefined;
                return output;

            }else if(this.basket.length == 0){
                console.log("the basket is empty");
                output.answer = 'There is no items added in the basket.'
                return output;
            }
        }
        

        if(output.intent === 'checkBasket'){
            console.log('basket will be show')
            output.answer = [output.answer, this.basket];
            return output;
        }
        return output;
    }

    async onPurchaseMode(input, customer){
        const output = input;

        if(output.intent === 'checkBasket'){
            console.log('basket will be show')
            output.answer = [output.answer, this.basket];
            return output;
        }

        if(this.nextintent){
            output.intent = this.nextintent;
            this.nextintent = undefined;
        }

        if(output.entities){
            for(let i = 0; i < output.entities.length; i++){
                switch(output.entities[i].entity){
                    case "number":
                        this.item_number = output.entities[i].utteranceText;
                }
            }
        }

        if(output.intent === 'customer_purchase'){
            console.log("customer add things to basket")
            // target_item = ouput.ent
            // const selected_id = output.answer.split(" ");
            // this.nextintent = 'purchase_continue';
            const chosen_item = itemList.getitem(this.item_number)

            // return response to customer if they enter unrecognized item number
            if(chosen_item == undefined){
                output.answer = 'There is no such item number/ items in the store. Please re-enter again.'
                return output;
            }
            this.additional_item = 'sim_card';
            output.answer = [output.answer, "Do you want to buy SIM card too?"]
            this.basket.push(chosen_item + " x 1")
            console.log(this.basket)
        }
        else if(output.intent === 'agreement'){
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
                output.answer = ["A phone cases will be added on.", "Is there anything I can do for you?"]
                this.additional_item = undefined;
                return output;
            }
            console.log("ask customer whether they want to continue or not");
        }
        else if(output.intent === 'disagreement'){
            if(this.additional_item == 'sim_card'){
                this.additional_item = 'phone_cases';
                output.answer = ["Alright, Do you want to buy phone cases?"];
                return output;
            }
            if(this.additional_item =='phone_cases'){
                output.answer = ["Alright, Is there anything I can do for you?"]
                this.nextintent = undefined;
                return output;
            }
            console.log("ask customer whether they want to continue or not");
        }
        else if(output.intent === 'customer.checkout'){
            if(this.basket != null){
                output.answer = 'Alright, can you please provide your address?'
                this.previousintent = 'customer.checkout';
                this.nextintent = undefined;
            }else if(this.basket = null){
                console.log("the basket is empty");
                output.answer = 'There is no items added in the basket.'
                return output;
            }
        }else if(this.previousintent == 'customer.checkout'){
            if(output.intent == 'UK_location'){
                if(this.basket != null){
                    console.log('customer checkout')
                    let purchaseId = this.makeid(10)
                    let basket = {
                        purchaseId: purchaseId,
                        username: customer.username,
                        item: this.basket,
                        location: output.utterance,
                        status: 'pending'
                    }
                    const m = new purchases(basket);
                    await m.save();
                    this.nextintent = undefined;
                    var successMsg = "Thank you for your patient. Your tracking number will be "+ purchaseId +"<br />Please keep this number with you"
                    output.answer = [successMsg];
                    this.basket = [];
                    this.previousintent = undefined;
                    this.currentRequest = undefined;
                    return output;
                }
            }
            else{
                console.log('User enter outside the uk region');
                output.answer = ["Sorry, currently we are not provide delivery service outside UK region", "Could you please provide other address or do you want me to find an human operator for you?"]
                this.counter += 1;
                return output;

            }
        }
        return output;
    }


    async onIntent(input, customer){
        const output = input;

        // directly return if the user request for operator
        if(output.intent === 'operator_request'){
            return output;
        }

        // continue the previous flow of the process
        if(this.nextintent){
            output.intent = this.nextintent;
            this.nextintent = undefined;
        }
        console.log('--------------------')
        console.log(output.intent)
        console.log((output.intent == 'user.tracking_number'))
        console.log('--------------------')


        // if the user utterance is ask for refund, the next action should be note down the tracking number

        if(output.intent == 'user.refund' || output.intent == 'reason.item_broken'){
            this.nextintent = 'user.tracking_number';
            this.currentRequest = 'refund_mode'
            if(this.previousintent != 'user.tracking_number' || this.previousintent == null){
                if(input.intent == 'reason.item_broken'){
                    this.item_broken = true;
                }
                else if(input.intent == 'reason.item_broken'){
                    this.item_broken = true;
                }
                else if(input.intent == 'reason.item_broken'){
                    this.item_broken = true;
                }
            }

        }
        else if(output.intent == 'user.tracking_number'){
            console.log("plan to find purchase id")
            // get tracking number from user
            if(output.utterance != null){
                console.log("Searching purchase id")
                const purchaseId = output.utterance;
                const purchase_detail = await purchases.findOne({purchaseId}).lean()
                console.log(purchase_detail)
                //if the tracking number is in the database, get the item list and return
                if(purchase_detail){
                    console.log("Success find the tracking number")
                    const item_list = purchase_detail.item;
                    this.trackingNumber = purchaseId;  
                    // output.answer = "The item is: " + item_list +"<br /> May I know the reason why you would like to refund?";
                    output.answer = ["Your purchase items are: " + item_list, "May I confirm with you that this is correct?"];
                    this.purchaseitem = item_list;
                    this.nextintent = undefined;
                    this.previousintent = 'user.tracking_number';
                    return output;
                }
                else if(!purchase_detail){
                    console.log("ask for tracking number again")
                    this.nextintent = 'user.tracking_number';
                    output.answer = "Sorry, the tracking number entered is invalid/ wrong. Please re-enter again."
                    return output;
                }
            }
        }else if(output.intent === 'agreement'){

            // if user has inform the specific reason
            if(this.item_broken == true || this.item_lost == true || this.item_delayed == true ){
                this.nextintent = 'user.reason';
                output.answer = "Thanks for confirmation. Can you provide more details on why your item is lost, broken, or delayed?"
                return output;
            }
            else{
                console.log("user agreement")
                this.nextintent = 'user.reason';
                output.answer = "Thanks for confirmation. Could you please provide the reason why you want to refund?"
                return output;
            }
        }else if(output.intent ==='disagreement'){
            console.log("disagreement");
            this.item_list = undefined;
            output.answer = "Sorry about that, the tracking number you have entered might be wrong or there is some problem."
        }else if(output.intent ==='user.reason'){
            const RefundTicketId = this.makeid(10);
            output.answer = "Thank you for providing the reason.<br /><br />Here is your refund Ticket: " +  RefundTicketId + "<br />Your refund request has been created. We will undergo your refund process. It will take 3-7 days to work on. Please be patient."
            console.log(output.utterance)
            const reason = output.utterance;
            const TrackingNumber = this.trackingNumber;
            const username = customer.username;
            const item = this.purchaseitem;
            const status = 'pending'
            try{
                console.log("create refund ticket")
                console.log(RefundTicketId)
                console.log(TrackingNumber)
                console.log(username)
                console.log(item)
                const register = await refundTicket.create({
                    RefundTicketId,
                    TrackingNumber,
                    username,
                    item,
                    reason,
                    status
                })
                console.log('Refund Ticket created successfully',register)
            } catch(error){
                if(error.code === 11000){
                    console.log({status:'error', error:'Refund Ticket has already been registered!'})
                }
                console.log(error)
            }
            this.item_broken = false;
            this.item_lost = false;
            this.item_delayed = false;            
            this.nextintent = undefined;
            this.currentRequest = undefined;
            return output;
        }

        return output;


    }   

    makeid(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
          result += characters.charAt(Math.floor(Math.random() * charactersLength));
          counter += 1;
        }
        return result;
    }

}

module.exports = userIntent;