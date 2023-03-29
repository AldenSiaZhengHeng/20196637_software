const AppConstants = require('./appConstants.js');
const CustomerStore = require('./customerStore.js');
const CustomerConnectionHandler = require('./customerConnectionHandler.js');
const OperatorConnectionHandler = require('./operatorConnectionHandler.js');
const chatbot = require('./chatbot.js');
const Sentiment_analysis = require('./sentiment_analysis.js');

const e = require('express');
const mongoose = require('mongoose')
const User = require('./model/user')
const userIntent = require('./userIntentFlow/userIntent');
const userRefundFlow = require('./userIntentFlow/userRefundFlow');
const userMessages = require('./model/userMessage')

const { response } = require('express');


// Routes messages between connected customers, operators and Dialogflow agent
class MessageRouter {
  constructor ({ request, customerStore, dialogflowClient, projectId, customerRoom, operatorRoom }) {
    this.request = request;
    // Dialogflow client instance
    this.client = dialogflowClient;
    // Dialogflow project id
    this.projectId = projectId;
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
    // console.log(obj)
    // console.log(typeof obj)
    // console.log('customer username here')
    // if(obj['username'] !== null){
    //   console.log(obj['username'])
    // }
    // }
    // var username = obj.username

    // if(obj['username'] !== null) {
      const status = disconnected
      ? AppConstants.EVENT_CUSTOMER_DISCONNECTED
      : AppConstants.EVENT_CUSTOMER_CONNECTED;
      if(obj['username'] !== null) {
        if(status === AppConstants.EVENT_CUSTOMER_DISCONNECTED){
          await this._saveConversationChat(status, obj, status, 0);
        }
      }
      this.operatorRoom.emit(status, {id: customerId, username: obj['username'], agent:obj['agent']});
      // console.log("hey I'm micket mouse")
      // console.log(this.customerStore.getAllCustomer())
      // console.log("hey I'm micket mouse")
      // We're using Socket.io for our chat, which provides a synchronous API. However, in case
      // you want to swich it out for an async call, this method returns a promise.
      return Promise.resolve();
    // }
    // else{
    //   return Promise.resolve();
    // }

  }

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

  async _checkUtterance(response, customer, customerId){
    var chatbot_responses = response;
    console.log("check utterance")
    // if(this.userDatabase[customerId].currentRequest == undefined){
    //   this.userDatabase[customerId].checkmode(response);
    // }
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

  async _routeCustomer (utterance, customer, customerId){
    // console.log("checking is sending to operator or not")
    // console.log(utterance)
    // console.log(customer)

    // sending customer messsage first to operator
    await this._sendUtteranceToOperator(utterance, customer);

    // determine the time that the chatbot get the answer
    const startTime = new Date().getTime(); // start timer
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
   
    // if (customer.agent === 'work-together') {

    //   // the operator request is not used in this mode as the operator is work with chatbot
    //   // if (this._checkOperatorMode(response)) {
    //   //   return this._switchToOperator(customerId, customer, response);
    //   // }
    //   chatbot_responses = await this._checkUtterance(response, customer, customerId);
    //   console.log("--------");
    //   console.log(chatbot_responses);
    //   var chatbot_suggestion_wrapper = {
    //     customer: customer,
    //     customerId: customerId,
    //     responses: chatbot_responses
    //   };

    //   // send the chatbot answer to operator and let operator to decide the next action
    //   this.operatorRoom.emit('chatbot_suggestion', chatbot_suggestion_wrapper);
    //   console.log("------------------");
    //   console.log(chatbot_responses);
    //   console.log(this.userDatabase);
    //   // If not in operator mode, just grab the agent's response
    //   const speech = chatbot_responses.answer;

    //   // return nothing as this will be chatbot work with human operator
    //   return null;
    // }

    // Check handover action
    if (customer.mode == CustomerStore.MODE_AGENT || customer.mode === CustomerStore.MODE_OPERATOR_GUIDE) {
      // If the agent indicated that the customer should be switched to operator
      // mode, do so
      if (this._checkOperatorMode(response)) {
        console.log("check operator mode");
        return this._switchToOperator(customerId, customer, response, responseTime);
      }

      chatbot_responses = await this._checkUtterance(response, customer, customerId);
      await this._saveConversationChat(utterance, customer, chatbot_responses, responseTime);

      // to send again the flow that will be perform by user after quit the current flow
      var notify = this.userDatabase[customerId].currentRequest;

      if(chatbot_responses.informMessage === true){
        this.informMessage = chatbot_responses.informMessage
        notify = chatbot_responses.quitMode;
      }

      console.log("------------------");
      console.log(chatbot_responses)
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


      // Send alert to operator that the customer might need help
      if(this.userDatabase[customerId].operator_alert == true){
        let message = {
          customer: customer,
          customerId: customerId,
          response: 'chatbot_confused'
        }
        this.operatorRoom.emit('customer_alert', message)
        this.userDatabase[customerId].operator_alert = false;
      }
      // console.log(chatbot_responses);
      // console.log(this.userDatabase);
      // If not in operator mode, just grab the agent's response
      const speech_1 = chatbot_responses.answer;

      // Send the chatbotagent's response to the operator so they see both sides
      // of the conversation.
      this._sendUtteranceToOperator(speech_1, customer, true);

      // Return the agent's response so it can be sent to the customer down the chain
      return chatbot_responses;
    } else if (customer.mode === CustomerStore.MODE_OPERATOR) {
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

  _checkOperatorMode(response){
    console.log("i'm here")
    var checked = response.intent;
    let operatorMode = false;

    if (checked === AppConstants.CONTEXT_OPERATOR_REQUEST) {
      console.log("now is operator mode")
      operatorMode = true;
    }
    return operatorMode;
  }

  // Examines the context from the Dialogflow response and returns a boolean
  // indicating whether the agent placed the customer in operator mode
  // _checkOperatorMode (apiResponse) {
  //   console.log('I\'m here')
  //   let contexts = apiResponse.queryResult.outputContexts;
  //   let operatorMode = false;
  //   console.log(contexts)
  //   for (const context of contexts) {
  //     // The context name is returned as a long string, including the project ID, separated
  //     // by / characters. To get the context name defined in Dialogflow, we should take the
  //     // final portion.
  //     const parts = context.name.split('/');
  //     const name = parts[parts.length - 1];
  //     console.log('xxxxxxxxxxxxxxxxxxxxxxxxx')
  //     console.log(context)
  //     console.log('-------------------------')
  //     console.log(parts)
  //     console.log('-------------------------')
  //     console.log(name)
  //     console.log('xxxxxxxxxxxxxxxxxxxxxxxxx')
  //     if (name === AppConstants.CONTEXT_OPERATOR_REQUEST) {
  //       console.log("now is operator mode")
  //       operatorMode = true;
  //       break;
  //     }
  //   }
  //   return operatorMode;
  // }

  _OperatorRequestHandle(customerId, customer){
    console.log('operator request handover')
    this.customerStore.setCustomer(customerId,customer)
    if(customer.agent == 'chatbot-show'){
      const output = [AppConstants.REQUESTED_OPERATOR_GREETING]
      return this.customerConnections[customerId]._respondToCustomer(output);
    }
    else if(customer.agent =='chatbot-hidden'){
      return false;
    }
  }

  // _OperatorRequestHandle_hidden(customerId, customer){
  //   console.log('operator request control in hidden mode')
  //   this.customerStore.setCustomer(customerId, customer)
  //   return this.customerConnections
  // }

  _switchToOperator(customerId, customer, response, responseTime){
    console.log('Handover customer to operator mode');
    customer.mode = CustomerStore.MODE_OPERATOR;
    return this.customerStore
      .setCustomer(customerId, customer)
      .then(this._notifyOperatorOfSwitch(customerId, customer))
      .then(() => {
        // We return an array of two responses: the last utterance from the Dialogflow agent,
        // and a mock "human" response introducing the operator.
        const output = [ response.answer, AppConstants.OPERATOR_GREETING ];
        // Also send everything to the operator so they can see how the agent responded
        this._sendUtteranceToOperator(output, customer, true);
        this._saveConversationChat(response.utterance, customer, response, responseTime)
        const responses = {
          answer: output
        }
        return responses;
      });
  }

  // Place the customer in operator mode by updating the stored customer data,
  // and generate an introductory "human" response to send to the user.
  // _switchToOperator (customerId, customer, response) {
  //   console.log('Handover customer to operator mode');
  //   customer.mode = CustomerStore.MODE_OPERATOR;
  //   return this.customerStore
  //     .setCustomer(customerId, customer)
  //     .then(this._notifyOperatorOfSwitch(customerId, customer))
  //     .then(() => {
  //       // We return an array of two responses: the last utterance from the Dialogflow agent,
  //       // and a mock "human" response introducing the operator.
  //       const output = [ response.queryResult.fulfillmentText, AppConstants.OPERATOR_GREETING ];
  //       // Also send everything to the operator so they can see how the agent responded
  //       this._sendUtteranceToOperator(output, customer, true);
  //       return output;
  //     });
  // }

  _OperatorInterrupt (customerId, customer) {
    console.log('Handover to operator mode');
    customer.mode = CustomerStore.MODE_OPERATOR;
    return this.customerStore
      .setCustomer(customerId, customer)
      .then(() => {
        // We return an array of two responses: the last utterance from the Dialogflow agent,
        // and a mock "human" response introducing the operator.
        // Also send everything to the operator so they can see how the agent responded
        this._sendUtteranceToOperator('success', customer, true);
      });
  }

  // Inform the operator channel that a customer has been switched to operator mode
  _notifyOperatorOfSwitch (customerId) {
    this.operatorRoom.emit(AppConstants.EVENT_OPERATOR_REQUESTED, customerId);
    // We're using Socket.io for our chat, which provides a synchronous API. However, in case
    // you want to swich it out for an async call, this method returns a promise.
    return Promise.resolve();
  }

}


module.exports = MessageRouter;


  // Given details of a customer and their utterance, decide what to do.
  // _routeCustomer (utterance, customer, customerId) {
  //   // If this is the first time we've seen this customer,
  //   // we should trigger the default welcome intent.
  //   if (customer.isNew) {
  //     console.log(customer)
  //     return this._sendEventToAgent(customer);
  //   }

  //   // Since all customer messages should show up in the operator chat,
  //   // we now send this utterance to all operators
  //   console.log("checking is sending to operator or not")
  //   console.log(utterance)
  //   console.log(customer)
  //   return this._sendUtteranceToOperator(utterance, customer)
  //     // .then(() => {
  //     //   this._sendUtteranceToRasa(utterance, customer, function(response){
  //     //     console.log(response)
  //     //   }); 
  //     // })
  //     .then(() => {
  //       // So all of our logs end up in Dialogflow (for use in training and history),
  //       // we'll always send the utterance to the agent - even if the customer is in operator mode.
  //       return this._sendUtteranceToAgent(utterance, customer);
  //     })
  //     .then(responses => {
  //       const response = responses[0];
  //       console.log('xxxxxxxxxxxxxxxxxxxxxxxxx')
  //       console.log(response)
  //       console.log('xxxxxxxxxxxxxxxxxxxxxxxxx')
  //       // If the customer is in agent mode, we'll forward the agent's response to the customer.
  //       // If not, just discard the agent's response.
  //       console.log('yyyyyyyyyyyyyyyyyyyyyyyyy')
  //       console.log(customer.mode)
  //       console.log('yyyyyyyyyyyyyyyyyyyyyyyyy')
  //       console.log(CustomerStore.MODE_AGENT)
  //       console.log('zzzzzzzzzzzzzzzzzzzzzzzzzzz')

  //       // Check when it is operator mode
  //       // if(customer.mode === CustomerStore.MODE_OPERATOR){
  //       //   console.log('hello is me mario')
  //       //   console.log(response)
  //       //   this._sendUtteranceToOperator(utterance, customer, true);
  //       // }
        
  //       if (customer.mode === CustomerStore.MODE_AGENT) {
  //         // If the agent indicated that the customer should be switched to operator
  //         // mode, do so
  //         if (this._checkOperatorMode(response)) {
  //           return this._switchToOperator(customerId, customer, response);
  //         }
  //         // If not in operator mode, just grab the agent's response
  //         const speech = response.queryResult.fulfillmentText;
  //         // Send the agent's response to the operator so they see both sides
  //         // of the conversation.
  //         this._sendUtteranceToOperator(speech, customer, true);
  //         // Return the agent's response so it can be sent to the customer down the chain
  //         return speech;
  //       }
  //     });
  // }

  // Uses the Dialogflow client to send a 'WELCOME' event to the agent, starting the conversation.
  // _sendEventToAgent (customer) {
  //   console.log('Sending WELCOME event to agent');
  //   return this.client.detectIntent({
  //     // Use the customer ID as Dialogflow's session ID
  //     session: this.client.sessionPath(this.projectId, customer.id),
  //     queryInput: {
  //       event: {
  //         name: 'WELCOME',
  //         languageCode: 'en'
  //       }
  //     }
  //   });
  // }

  // _sendUtteranceToRasa (utterance, customer, callback) {
  //   this.request.post(
  //     'http://0.0.0.0:5005/webhooks/rest/webhook',
  //     {
  //       json:{
  //         "message": utterance,
  //         "sender": customer.id,
  //       }
  //     },
  //     function (error, response, body) {
  //       if (!error && response.statusCode == 200) {
  //         console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeee');
  //         console.log(body);
  //         console.log('eeeeeeeeeeeeeeeeeeeeeeeeeeee');
  //         return callback(body);
  //       }
  //     }
  //   )
  // }


  // Sends an utterance to Dialogflow and returns a promise with API response.
  // _sendUtteranceToAgent (utterance, customer) {
  //   console.log('Sending utterance to agent');
  //   console.log(customer.id)
  //   return this.client.detectIntent({
  //     // Use the customer ID as Dialogflow's session ID
  //     session: this.client.sessionPath(this.projectId, customer.id),
  //     queryInput: {
  //       text: {
  //         text: utterance,
  //         languageCode: 'en'
  //       }
  //     }
  //   });
  // }
