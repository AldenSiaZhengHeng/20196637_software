// The messageRouter file will process the message flow between user, server and human operator. It will route the user and human operator message and chatbot response to correct path

const AppConstants = require('./appConstants.js');
const CustomerStore = require('./customerStore.js');
const CustomerConnectionHandler = require('./customerConnectionHandler.js');
const OperatorConnectionHandler = require('./operatorConnectionHandler.js');
const chatbot = require('../chatbot/chatbot.js');
const Sentiment_analysis = require('../sentiment_analysis/sentiment_analysis.js');

const e = require('express');
const mongoose = require('mongoose')
const User = require('../model/user')
const userIntent = require('../userIntentFlow/userIntent');
const userRefundFlow = require('../userIntentFlow/userRefundFlow');
const userMessages = require('../model/userMessage')
const { response } = require('express');


// Routes messages between connected customers, operators and chatbot agent
class MessageRouter {
  constructor ({ request, customerStore, customerRoom, operatorRoom }) {
    this.request = request;
    // An object that handles customer data persistence
    this.customerStore = customerStore;
    // Socket.io rooms for customers and operators
    this.customerRoom = customerRoom;
    this.operatorRoom = operatorRoom;
    // All active connections to customers or operators
    this.customerConnections = {};
    this.operatorConnections = {};
    this.chatbot = new chatbot();
    this.sentiment = new Sentiment_analysis();
    this.userRefundFlow = new userRefundFlow();
    this.userDatabase = {};
    this.informMessage = true;
  }

  // Attach event handlers and begin handling connections
  handleConnections () {
    this.customerRoom.on('connection', this._handleCustomerConnection.bind(this));
    this.operatorRoom.on('connection', this._handleOperatorConnection.bind(this));
  }

  // trigger the event handlers to inform the human operator about the new customer connection 
  give(customerID){
    this.operatorRoom.emit('customer connected',customerID)
  }

  // Creates an object that stores a customer connection and has
  // the ability to delete itself when the customer disconnects
  _handleCustomerConnection (socket) {
    const onDisconnect = () => {
      delete this.customerConnections[socket.id];
      delete this.userDatabase[socket.id]
    };
    this.customerConnections[socket.id] = new CustomerConnectionHandler(socket, this, onDisconnect);
  }

  // Same as above, but for operator connections
  _handleOperatorConnection (socket) {
    const onDisconnect = () => {
      delete this.customerConnections[socket.id];
    };
    this.operatorConnections[socket.id] = new OperatorConnectionHandler(socket, this, onDisconnect, this.customerStore);
  }

  // Notifies all operators of a customer's connection changing
  async _sendConnectionStatusToOperator (customerId, disconnected) {
    console.log('Sending customer id to any operators');

    // retrieve username of the particular socket id
    // console.log('customer username here')
    // console.log(customerId)
    var obj = this.customerStore.retrieve(customerId)
    console.log(obj)

    const status = disconnected
    ? AppConstants.EVENT_CUSTOMER_DISCONNECTED
    : AppConstants.EVENT_CUSTOMER_CONNECTED;
    if(obj['username'] !== null) {
      if(status === AppConstants.EVENT_CUSTOMER_DISCONNECTED){
        await this._saveConversationChat(status, obj, status, 0);
      }
    }
    this.operatorRoom.emit(status, {id: customerId, username: obj['username'], agent:obj['agent']});

    // We're using Socket.io for our chat, which provides a synchronous API. However, in case
    // you want to swich it out for an async call, this method returns a promise.
    return Promise.resolve();

  }

  // return the welcome intent message back to the new customer
  async _welcomeEventToCustomer(customer, customerId){
    if(customer.isNew){
      // console.log("zxxcxcsads")
      // console.log(customer)
      this.userDatabase[customerId] = new userIntent();
      // console.log(this.userDatabase)
      console.log("here is welcome event")
      var response = await this.chatbot.getAnswer("Welcome event");
      response.answer = [response.answers[0].answer, response.answers[1].answer]
      // console.log(response)
      return response;
    }
  }

  // this function will check the utterance entered by the user to determine the action that the customer would like to perform (purchase, refund, track or faq)
  async _checkUtterance(response, customer, customerId){
    var chatbot_responses = response;
    console.log("check utterance")
    this.userDatabase[customerId].checkmode(response);


    // Check the conversational flow is refund or purchase action
    if(this.userDatabase[customerId].currentRequest == 'refund_mode'){
      console.log("user want to refund")
      chatbot_responses = await this.userDatabase[customerId].userRefund(response,customer);
    }
    else if (this.userDatabase[customerId].currentRequest == 'purchase_mode'){
      console.log("user buy item")
      chatbot_responses = await this.userDatabase[customerId].onPurchaseMode(response,customer);

    }
    else if (this.userDatabase[customerId].currentRequest == 'tracking_mode'){
      console.log("user track item")
      chatbot_responses = await this.userDatabase[customerId].trackingProcess(response,customer);

    }    
    else{
      console.log("perform other tasks");
      chatbot_responses = await this.userDatabase[customerId].otherTask(response,customer);
    }
    console.log("responses")
    console.log(chatbot_responses)
    return chatbot_responses;
  }

  // this function will save the user input message and chatbot message into database
  async _saveConversationChat (utterance, customer, responses, response_time){
    var messageAttributes ={};
    if(responses === AppConstants.EVENT_CUSTOMER_DISCONNECTED){
      messageAttributes = {
        username: customer.username,
        message: utterance,
        agent: customer.agent,
        userType: 'disconnect',
        response_time: response_time
      }
    }
    else if(responses ==undefined){
      messageAttributes = {
        username: customer.username,
        message: utterance,
        agent: customer.agent,
        userType: 'user',
        response_time: response_time
      }
    }else{
      messageAttributes = {
        username: customer.username,
        message: utterance,
        agent: customer.agent,
        agentMessage: [responses.answer],
        intent:responses.intent,
        userType: 'user',
        response_time: response_time
      }
    }
    const m = new userMessages(messageAttributes);
    await m.save();
  }

  // The main function to route, process and transfer the message from customer
  async _routeCustomer (utterance, customer, customerId){

    // sending customer messsage first to operator
    await this._sendUtteranceToOperator(utterance, customer);

    // determine the time that the chatbot get the answer to response to customer
    const startTime = new Date().getTime(); // start timer

    // receive respond from the chatbot model trained
    const response = await this.chatbot.getAnswer(utterance);

    const endTime = new Date().getTime(); // end timer
    const responseTime = endTime - startTime + " ms";
    console.log('xxxxxxxxxxxxxxxxxxxxxxxxx');
    console.log(`Response: ${response.answer} | Response Time: ${responseTime} ms`);
    console.log('xxxxxxxxxxxxxxxxxxxxxxxxx');

    // Sending the sentiment analysis result to operator page
    const sentiment_result = this.sentiment.getSentiment(utterance);
    var chatbot_responses = response;
    let customer_sentiment = {
      id: customerId,
      sentiment: sentiment_result,
      username: customer.username
    };
    this.operatorRoom.emit('customer_feelings', customer_sentiment);

    //the chatbot will be handle users' input message at the beginning and response back to them.
    // Once handover occur, this section will be ignore
    if (customer.mode == CustomerStore.MODE_AGENT || customer.mode === CustomerStore.MODE_OPERATOR_GUIDE) 
    {
      // If the agent indicated that the customer should be switched to operator mode, do so
      if (this._checkOperatorMode(response)) {
        console.log("check operator mode");
        return this._switchToOperator(customerId, customer, response, responseTime);
      }

      // check whether user want to perform purchase, refund, tracking or faq action
      chatbot_responses = await this._checkUtterance(response, customer, customerId);

      // save the user message and chatbot response
      await this._saveConversationChat(utterance, customer, chatbot_responses, responseTime);

      // obtain notificaton when the system detect the user is entering one of the scenario created at the beginning in order to inform human operator about it
      var notify = this.userDatabase[customerId].currentRequest;
      if(chatbot_responses.informMessage === true){
        this.informMessage = chatbot_responses.informMessage
        notify = chatbot_responses.quitMode;
      }

      // send a notification when the user is entering one of the scenario implemented (purchase, refund, track, faq), so the human operator could prepare before handover occur.
      if(this.informMessage){
        if(this.userDatabase[customerId].currentRequest){
          let information = {
            customer: customer,
            customerId: customerId,
            response: notify
          }
          this.operatorRoom.emit('customer_alert', information)
          this.informMessage = false;
        }
        else{
          let information = {
            customer: customer,
            customerId: customerId,
            response: notify
          }
          this.operatorRoom.emit('customer_alert', information)
          // this.informMessage = false;
        }
      }


      // Send alert message to operator that the customer might need help
      if(this.userDatabase[customerId].operator_alert == true){
        let message = {
          customer: customer,
          customerId: customerId,
          response: 'chatbot_confused',
          intent: chatbot_responses.utterance,
          count: this.userDatabase[customerId].counter
          // entity: chatbot_response.entity
        }
        console.log("count " + this.userDatabase[customerId].counter)
        this.operatorRoom.emit('customer_alert', message)
        this.userDatabase[customerId].operator_alert = false;
      }

      // If not in operator mode, just grab the agent's response
      const speech_1 = chatbot_responses.answer;

      // Send the chatbotagent's response to the operator so they see both sides
      // of the conversation.
      this._sendUtteranceToOperator(speech_1, customer, true);

      // Return the agent's response so it can be sent to the customer down the chain
      return chatbot_responses;
    } 
    // if the operator has take over the control from chatbot, save the user message and return nothing since the human operator will reply but not chatbot
    else if (customer.mode === CustomerStore.MODE_OPERATOR) 
    {
      await this._saveConversationChat(utterance, customer, undefined);
    }
  }

  // Send an utterance, or an array of utterances, to the operator channel so that
  // every operator receives it.
  _sendUtteranceToOperator (utterance, customer, isAgentResponse) {
    console.log('Sending utterance to any operators');
    if (Array.isArray(utterance)) {
      utterance.forEach(message => {
        this.operatorRoom.emit(AppConstants.EVENT_CUSTOMER_MESSAGE,
          this._operatorMessageObject(customer.id, message, isAgentResponse));
      });
    } else {
      this.operatorRoom.emit(AppConstants.EVENT_CUSTOMER_MESSAGE,
        this._operatorMessageObject(customer.id, utterance, isAgentResponse));
    }
    // We're using Socket.io for our chat, which provides a synchronous API. However, in case
    // you want to swich it out for an async call, this method returns a promise.
    return Promise.resolve();
  }

  // If one operator sends a message to a customer, share it with all connected operators
  _relayOperatorMessage (message) {
    this.operatorRoom.emit(AppConstants.EVENT_OPERATOR_MESSAGE, message);
    if(message.agent =='chatbot-show'){
      if(message.utterance ==='handover' || message.utterance ==='takeover'){
        message.utterance = AppConstants.REQUESTED_OPERATOR_GREETING;
        this.operatorRoom.emit(AppConstants.EVENT_OPERATOR_MESSAGE, message)
      }
    }
    else if(message.utterance ==='return'){
      message.utterance =  'Return Control back to chatbot';
      this.operatorRoom.emit(AppConstants.EVENT_OPERATOR_MESSAGE, message)
    }
   
    // We're using Socket.io for our chat, which provides a synchronous API. However, in case
    // you want to swich it out for an async call, this method returns a promise.
    return Promise.resolve();
  }

  // Factory method to create message objects in the format expected by the operator client
  _operatorMessageObject (customerId, utterance, isAgentResponse) {
    return {
      customerId: customerId,
      utterance: utterance,
      isAgentResponse: isAgentResponse || false
    };
  }

  // check whether there is directly require for human agent for help by the user
  // if yes set the operator mode from false to true in order to trigger the switching between chatbot to human operator
  _checkOperatorMode(response){
    var checked = response.intent;
    let operatorMode = false;

    if (checked === AppConstants.CONTEXT_OPERATOR_REQUEST) {
      operatorMode = true;
    }
    return operatorMode;
  }

  // This function allow update the control to the human operator when he or she decide to interrupt the chatbot from human operator side instead of user requests
  _OperatorRequestHandle(customerId, customer){
    console.log('operator request handover')
    this.customerStore.setCustomer(customerId,customer)

    // if the handover method is explicit, it will sent an inform message to user
    if(customer.agent == 'chatbot-show'){
      const output = [AppConstants.REQUESTED_OPERATOR_GREETING]
      return this.customerConnections[customerId]._respondToCustomer(output);
    }
    // if the handover method is implicit, return nothing
    else if(customer.agent =='chatbot-hidden'){
      return false;
    }
  }

  // if the user request to swithc to human operator by themselves, transfer the control from chatbot to human operator and send alert notification about it
  _switchToOperator(customerId, customer, response, responseTime){
    console.log('Handover customer to operator mode');
    customer.mode = CustomerStore.MODE_OPERATOR;
    return this.customerStore
      .setCustomer(customerId, customer)
      .then(this._notifyOperatorOfSwitch(customerId, customer))
      .then(() => {
        // We return an array of two responses: the last utterance from the Dialogflow agent,
        // and a mock "human" response introducing the operator.
        const output = [ response.answer ];
        // Also send everything to the operator so they can see how the agent responded
        this._sendUtteranceToOperator(output, customer, true);
        this._saveConversationChat(response.utterance, customer, response, responseTime)
        const responses = {
          answer: output
        }
        return responses;
      });
  }


  // Inform the operator channel that a customer has been switched to operator mode
  _notifyOperatorOfSwitch (customerId, customer) {
    this.operatorRoom.emit(AppConstants.EVENT_OPERATOR_REQUESTED, customerId);
    let msg ={
      customer: customer,
      customerId: customerId,
      response: 'human_request'
    }
    this.operatorRoom.emit('customer_alert',msg);
    // We're using Socket.io for our chat, which provides a synchronous API. However, in case
    // you want to swich it out for an async call, this method returns a promise.
    return Promise.resolve();
  }

}


module.exports = MessageRouter;
