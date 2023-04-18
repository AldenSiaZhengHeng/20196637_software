// This class function indicate the tracking flow that has been implemented
// The action such as ask for tracking number or refund ticket number, validation and return status had been implemented

const purchases = require('../model/purchase');
const refundTicket = require('../model/refund_ticket');

class userTrackingFlow{
    constructor(){
        this.nextintent;
        this.tracking_number;
    }

    // this function will clear the parameter once the tracking action completed in order to process the other tasks.
    clearintent(){
        this.nextintent = undefined;
        this.tracking_number = null;
    }

    
    // main flow for tracking action
    async userTrackingProcess(input, customer){
        const output = input;

        // Directly return response to customer due as the questions is unable to answer by it
        // specific intent that will trigger the alert notification module
        if(output.intent ==='additional_info'){
            output.intent = 'chatbot_confused'
            return output;
        }

        // continue the previous flow of the process
        if(this.nextintent){
            output.intent = this.nextintent;
            this.nextintent = undefined;
        }

        //extract the tracking or refund ticket number from the input message
        if(output.intent === 'tracking_package' || output.intent === 'tracking_refund'){
            if(output.entities){
                for(let i = 0; i < output.entities.length; i++){
                    switch(output.entities[i].entity){
                        case "number":
                            this.tracking_number = output.entities[i].utteranceText
                            break;
                    }
                }    
            }
        }

        // determine whether the user want to track package status
        if(output.intent == 'track.purchase'){
            console.log("track purchase package");
            this.nextintent = 'tracking_package';
            return output;
        }
        // determine whether the user want to track refund ticket status
        else if(output.intent == 'track.refund'){
            console.log("track refund process");
            this.nextintent = 'tracking_refund';
            return output;
        }
        // check the validation of the tracking number from input message and search in database.
        // if valid, return the information extracted
        else if(output.intent == 'tracking_package'){
            console.log('search in database')
            try{
                const result = await purchases
                .find({
                    trackingNumber:this.tracking_number
                })
                if(result.length > 0){
                    console.log('find in database')
                    console.log(result[0])
                    var response = 'Tracking Number: ' + "<strong>" + result[0].trackingNumber + "</strong>"+ '<br />Purchase item: ' + "<strong>" + result[0].item + "</strong>" +'<br />Shipped address: ' + "<strong>" + result[0].location + "</strong>" + '<br />Status: ' + "<strong>" + result[0].status + "</strong>";
                    output.answer = [response, 'Is there anything I can do for you?']
                    this.clearintent();
                    output.intent = 'end_tracking_flow';
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
        // check the validation of the refund ticket number from input message and search in database.
        // if valid, return the information extracted
        else if(output.intent == 'tracking_refund'){
            console.log('search in database')
            try{
                const result = await refundTicket
                .find({
                    RefundTicketId:this.tracking_number
                })
                if(result.length > 0){
                    console.log('find in database')
                    console.log(result[0])
                    var response = 'Refund Ticket: ' + "<strong>" + result[0].RefundTicketId + "</strong>" + '<br />Purchase item: ' + "<strong>" + result[0].item + "</strong>" +'<br />Reason: ' + "<strong>" + result[0].reason + "</strong>" + '<br />Status: ' + "<strong>" + result[0].status + "</strong>";
                    output.answer = [response, 'Is there anything I can do for you?']
                    this.clearintent();
                    output.intent = 'end_tracking_flow';
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
        // Directly return response to customer due as the questions is unable to answer by it
        // specific intent that will trigger the alert notification module
        else if(output.intent =='additional_info'){
            output.intent = 'chatbot_confused'
            return output;
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


}

module.exports = userTrackingFlow;