const refundTicket = require('../model/refund_ticket');
const purchases = require('../model/purchase');


class userRefundFlow{
    constructor(){
        this.nextintent;
        this.item_broken = false;
        this.item_delayed = false;
        this.details_reason = [];
        this.predicted_intent;
    }

    async userRefund(input, customer){
        const output = input;

        // directly return if the user request for operator
        if(output.intent === 'operator_request'){
            return output;
        }

        // continue the previous flow of the process
        if(this.nextintent){
            // if(output.intent == 'reason.item_broken' || output.inten == 'reason.item_delayed'){
            //     if(this.previousintent != 'user.tracking_number' || this.previousintent == null){  
                    
            //     }

            // }
            this.predicted_intent = input.intent;
            output.intent = this.nextintent;
            this.nextintent = undefined;
        }

        console.log('--------------------')
        console.log(output.intent)
        console.log(this.predicted_intent)
        console.log((output.intent == 'user.tracking_number'))
        console.log('--------------------')


        // if the user utterance is ask for refund, the next action should be note down the tracking number

        if(output.intent == 'user.refund' || output.intent == 'reason.item_broken' || output.intent =='reason.item_delayed'){
            this.nextintent = 'user.tracking_number';
            this.currentRequest = 'refund_mode'
            if(this.previousintent != 'user.tracking_number' || this.previousintent == null){
                if(input.intent == 'reason.item_broken'){
                    output.answer="I'm so sorry to hear about this, may I ask for the purchase ID that you want to refund?";
                    this.item_broken = true;
                    this.details_reason.push(output.utterance);
                }
                else if(input.intent == 'reason.item_delayed'){
                    this.item_delayed = true;
                    this.details_reason.push(output.utterance);
                }
            }
            return output;
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
                    output.intent = 'chatbot_confused'
                    return output;
                }
            }
        }else if(output.intent === 'agreement'){

            // if user has inform the specific reason
            if(this.item_broken == true || this.item_delayed == true ){
                this.nextintent = 'additional_reason';
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
            output.intent = 'chatbot_confused';
            return output;
        }
        else if(output.intent ==='user.reason'){
            if(this.predicted_intent =='reason.item_broken' || this.predicted_intent == 'reason.item_delayed'){
                console.log("enter additional reason")
                output.answer = 'Can you please describe or add more information about it?'
                this.details_reason.push(output.utterance);
                this.nextintent = 'additional_reason';
                return output;
            }
            else{
                output.answer = 'It seems like the reason provided by your is unacceptable. You can either call human agent or provide a new reason.'
                this.nextintent = 'user.reason';
                output.intent = 'chatbot_confused';
                return output;
            }
        }
        else if(output.intent == 'additional_reason'){
            const RefundTicketId = this.makeid(10);
            output.answer = "Thank you for providing the reason.<br /><br />Here is your refund Ticket: " +  RefundTicketId + "<br />Your refund request has been created. We will undergo your refund process. It will take 3-7 days to work on. Please be patient."
            console.log(output.utterance)
            this.details_reason.push(output.utterance)
            const reason = this.details_reason;
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
                    output.answer = 'There is something wrong when created refund ticket! Please try again later.';
                    console.log({status:'error', error:'Refund Ticket has already been registered!'})
                }
                output.answer = 'There is something wrong when created refund ticket! Please try again later.';
                console.log(error)
            }
            this.item_broken = false;
            this.item_lost = false;
            this.item_delayed = false;            
            this.nextintent = undefined;
            this.currentRequest = undefined;
            this.predicted_intent = undefined;
            output.intent = 'end_refund_flow';
            return output;
        
        }
        else if(output.intent =='additional_info'){
            output.intent = 'chatbot_confused'
            return output;
        }
        else if(output.answer == undefined){
            output.answer = ['Sorry, I can\'t recognize what you are saying. Can you state your answer clearly or more details?', 'Please make sure that your asked questions is under the refund flow, if you want to quit, please type any command like "quit, leave"']
            output.intent = 'chatbot_confused';
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

module.exports = userRefundFlow;