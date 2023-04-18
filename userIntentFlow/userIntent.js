// This class will decide the conversation flow to enter either purchase, refund, FAQ, or tracking flow

const e = require('express');
const mongoose = require('mongoose');
const purchases = require('../model/purchase');
const itemlist = require('../item_list/itemlist');
const userRefundFlow = require('./userRefundFlow');
const userPurchaseFlow = require('./userPurchaseFlow');
const userTrackingFlow = require('./userTrackingFlow');



class userIntent{
    constructor(){
        this.user
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
        this.operator_alert = false;

        // set the counter to record the time that the chatbot unable to get the answer based on user intent
        this.counter = 0;
        this.additional_item;
        this.userRefundFlow = new userRefundFlow();
        this.userPurchaseFlow = new userPurchaseFlow();
        this.userTrackingFlow = new userTrackingFlow();
    }
    
    // this will check the intent whether the user is decided to enter which scenario set.
    checkmode(input){
        if(this.currentRequest == null){
            if(input.intent == 'user.refund' || input.intent =='reason.item_broken' || input.intent =='readon.item_delayed'){
                console.log("set refund mode")
                this.currentRequest = 'refund_mode';
            }
            else if(input.intent =='customer.want_purchase' ||input.intent == 'customer_purchase' || input.intent == 'add.item_1' || input.intent == 'add.item_2' || input.intent == 'add.item_3' ){
                console.log("set purchase mode")
                this.currentRequest = 'purchase_mode';
            }
            else if(input.intent == 'track.purchase' || input.intent == 'track.refund'){
                console.log("set tracking mode")
                this.currentRequest = 'tracking_mode'
            }
        }
    }

    // this function will sent the user message to tracking flow in order to complete the tracking action
    async trackingProcess(input, customer){
        if(input.intent == 'action.quit'){
            this.currentRequest = undefined;
            this.userTrackingFlow.clearintent();
            input.informMessage = true;
            input.quitMode = 'quit_tracking';
            return input;
        }

        // wait for the response from the flow
        var responses = await this.userTrackingFlow.userTrackingProcess(input,customer);

        // if detect end of the flow, set the current request to null in order to proceed other steps
        if(responses.intent == 'end_tracking_flow'){
            console.log("end tracking flow")
            this.currentRequest = undefined;
        }
        // if the intent is not recognized, triggered the notification alert variable
        // intent detection
        else if(responses.intent =='chatbot_confused'){
            console.log("chatbot is confusing")
            this.counter +=1;
            var count = this.counter
            if(count % 2 == 0){
                this.operator_alert = true;
            }
        }
        return responses;

    }

    // This function will process the FAQ questions
    async otherTask(input, customer){
        const output = input;
        console.log(output)
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

        // if the intent is not recognized, triggered the notification alert variable
        // intent detection
        if(output.intent =='None'){
            this.counter += 1;
            output.answer = "Sorry, I don't understand what you are saying. Can you please re-enter you questions in more details?"
            if(this.counter >= 2){
                this.operator_alert = true;
            }
            return output;
        }

        // if the intent is recognized as this specific intent, triggered the notification alert variable
        // intent detection
        // this intent indicated those complex questions that is unable to answer by chatbot clearly, hence, alert the human agents
        if(output.intent === 'additional_info'){
            this.counter +=1;
            if(this.counter >= 1){
                this.operator_alert = true;
            }
            return output;
        }
        
        // this will return the item that the user has added into the basket
        if(output.intent === 'checkBasket'){
            console.log('check basket in other task')
            console.log(this.basket)
            if(this.basket.length <= 0  ){
                output.answer = 'There is no item in the cart. Would you like to add something on it?'
                return output;
            }
            console.log('basket will be show')
            output.answer = [output.answer, this.basket];
            return output;
        }
        return output;
    }

    // this processed message will be sent through here if deteremine the user is performing purchase action.
    async onPurchaseMode(input, customer){
        // quit the current action
        if(input.intent == 'action.quit'){
            this.basket = [];
            this.currentRequest = undefined;
            this.userPurchaseFlow.clearparam();
            input.informMessage = true;
            input.quitMode = 'quit_purchase';
            return input;
        }
        var responses = await this.userPurchaseFlow.userPurchase(input, customer);

        if(responses.intent == 'end_purchase_flow'){
            console.log("end purchase flow")
            this.currentRequest = undefined;
        }
        else if(responses.intent =='chatbot_confused'){
            console.log("chatbot is confusing")
            this.counter +=1;
            if(this.counter >= 2){
                this.operator_alert = true;
            }
        }
        this.basket = responses.basket;
        return responses;
    }

    // this processed message will be sent through here if deteremine the user is performing refund action.
    async userRefund(input, customer){

        if(input.intent == 'action.quit'){
            this.currentRequest = undefined;
            this.userRefundFlow.clearparam();
            input.informMessage = true;
            input.quitMode = 'quit_refund';
            return input;
        }

        var responses = await this.userRefundFlow.userRefund(input,customer);

        if(responses.intent == 'end_refund_flow'){
            console.log("end refund flow")
            this.currentRequest = undefined;
        }
        else if(responses.intent =='chatbot_confused'){
            console.log("chatbot is confusing")
            this.counter +=1;
            if(this.counter >= 2){
                this.operator_alert = true;
            }
        }
        return responses;
    }   

    // create the id if for successful purchase or refund action to store the details into the database
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