const e = require('express');
const mongoose = require('mongoose');
const purchases = require('../model/purchase');
const refundTicket = require('../model/refund_ticket');
const itemlist = require('../itemlist');
const userRefundFlow = require('./userRefundFlow');
const userPurchaseFlow = require('./userPurchaseFlow');
const userTrackingFlow = require('./userTrackingFlow');
const itemList = new itemlist();



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

    setCurrentRequest(currentRequest){
        this.currentRequest = currentRequest;
    }

    getCurrentRequest(){
        return this.currentRequest
    }

    checkmode(input){
        if(this.currentRequest == null){
            if(input.intent == 'user.refund' || input.intent =='reason.item_broken'){
                console.log("set refund mode")
                this.currentRequest = 'refund_mode';
            }
            else if(input.intent == 'customer_purchase' || input.intent == 'add.item_1' || input.intent == 'add.item_2' || input.intent == 'add.item_3' ){
                console.log("set purchase mode")
                this.currentRequest = 'purchase_mode';
            }
            else if(input.intent == 'track.purchase' || input.intent == 'track.refund'){
                console.log("set tracking mode")
                this.currentRequest = 'tracking_mode'
            }
        }
    }

    async trackingProcess(input, customer){
        if(input.intent == 'action.quit'){
            this.currentRequest = undefined;
            this.userTrackingFlow.clearintent();
            return input;
        }

        var responses = await this.userTrackingFlow.userTrackingProcess(input,customer);
        console.log(responses)
        console.log('-------')
        if(responses.intent == 'end_tracking_flow'){
            console.log("end tracking flow")
            this.currentRequest = undefined;
        }
        else if(responses.intent =='chatbot_confused'){
            console.log("chatbot is confusing")
            this.counter +=1;
            if(this.counter >= 2){
                this.operator_alert = true;
                this.counter = 0;
            }
        }
        return responses;

    }

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


        if(output.intent =='None'){
            this.counter += 1;
            output.answer = "Sorry, I don't understand what you are saying. Can you please re-enter you questions in more details?"
            if(this.counter >= 2){
                this.operator_alert = true;
                this.counter = 0;
            }
            return output;
        }
        

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

    async onPurchaseMode(input, customer){
        // warn human operator about this customer has kept making chatbot confused
        if(input.intent == 'action.quit'){
            this.basket = [];
            this.currentRequest = undefined;
            this.userPurchaseFlow.clearparam();
            return input;
        }
        var responses = await this.userPurchaseFlow.userPurchase(input, customer);
        // console.log(responses)
        if(responses.intent == 'end_purchase_flow'){
            console.log("end purchase flow")
            this.currentRequest = undefined;
        }
        else if(responses.intent =='chatbot_confused'){
            console.log("chatbot is confusing")
            this.counter +=1;
            if(this.counter >= 2){
                this.operator_alert = true;
                this.counter = 0;
            }
        }
        this.basket = responses.basket;
        return responses;
    }


    async userRefund(input, customer){

        if(input.intent == 'action.quit'){
            this.currentRequest = undefined;
            this.userRefundFlow.clearparam();
            return input;
        }

        var responses = await this.userRefundFlow.userRefund(input,customer);
        console.log(responses)
        if(responses.intent == 'end_refund_flow'){
            console.log("end refund flow")
            this.currentRequest = undefined;
        }
        else if(responses.intent =='chatbot_confused'){
            console.log("chatbot is confusing")
            this.counter +=1;
            if(this.counter >= 2){
                this.operator_alert = true;
                this.counter = 0;
            }
        }
        return responses;
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