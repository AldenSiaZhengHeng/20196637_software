// This file contain the function to handle and process human operator message

const AppConstants = require('./appConstants.js');
const CustomerStore = require('./customerStore.js');
const ChatConnectionHandler = require('./chatConnectionHandler.js');
const chat_message = require('./chat_message.js')
const e = require('express');

// Custom error type for a problem relating to the customer's mode
class CustomerModeError extends Error {
  constructor (message) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Handles the connection to an individual operator
class OperatorConnectionHandler extends ChatConnectionHandler {
  constructor (socket, messageRouter, onDisconnect, customerStore) {
    super(socket, messageRouter, onDisconnect);
    this.customerStore = customerStore;
    this.messageRouter = messageRouter;
    this.init(socket.id);
    this.attachHandlers();
    this.retrieveExisitingID();
    this.getMessage();
    this.chat_message = new chat_message();
    // this.deleteDisconnectID();
  }

  init (operatorId) {
    console.log('An operator joined: ', operatorId);
  }

  // delete disconnected customer id
  deleteDisconnectID(){
    this.socket.on('delete_disconnect_id', (customerId) => {
      console.log("delete ID: " + customerId )
      this.customerStore.deleteCustomer(customerId);
    })
  }

  // get exisiting customer id that is still active
  retrieveExisitingID(){
    this.socket.on('retrieve_existing_id', (message) => {
      var customerIDDetails = this.customerStore.getAllCustomer()
      var string = JSON.stringify(customerIDDetails);
      var objectiveValue = JSON.parse(string);
      console.log(typeof objectiveValue);
      for(var attributename in customerIDDetails){
        console.log("retrieve exisiting id")
        var check = JSON.parse(objectiveValue[attributename])
        console.log(check)
        if(check.username != null){
          this.messageRouter.give(check)

        }
      }      
    })
  }

  // retrieve active user message if the page accidentally reload
  getMessage(){
    this.socket.on('getMessage', (message) =>{
      var customerData = this.customerStore.getAllCustomer()
      var string = JSON.stringify(customerData);
      var objectiveValue = JSON.parse(string);
      for(var customer in customerData){
        var customer_details = JSON.parse(objectiveValue[customer])
        console.log(customer_details)
        if(customer_details.username != null){
          console.log("go to get message")
          this.chat_message.retrieve_message(this.socket, customer_details)

          // this.socket.emit('testing','check socket path')
        }
      }
      // console.log(customer.username)
      // console.log(message)
      console.log("getMessage here")
    })
  }

    // retrieve old message that either activate or non-activate user to evaluate the handover moment
    getHistroyMessage(){
      this.socket.on('getMessage', (message) =>{
        var customerData = this.customerStore.getAllCustomer()
        var string = JSON.stringify(customerData);
        var objectiveValue = JSON.parse(string);
        for(var customer in customerData){
          var customer_details = JSON.parse(objectiveValue[customer])
          console.log(customer_details)
          if(customer_details.username != null){
            console.log("go to get message")
            this.chat_message.retrieve_message(this.socket, customer_details)
  
            // this.socket.emit('testing','check socket path')
          }
        }
        // console.log(customer.username)
        // console.log(message)
        console.log("getMessage here")
      })
    }
  

  // Attach event handlers and begin handling connections
  attachHandlers () {
    this.socket.on(AppConstants.EVENT_OPERATOR_MESSAGE, (message) => {
      console.log('Received operator message:', message);
      this._gotOperatorInput(message);
      
    });
    
    this.socket.on(AppConstants.EVENT_DISCONNECT, () => {
      console.log('operator disconnected');
      this.onDisconnect();
    });

    this.socket.on('retrieve_existing_name', async (message)=>{
      // console.log("hi")
      var result  = await this.chat_message.run()
      if(result.length>0){
        for(var i = 0; i<result.length; i++){
          this.socket.emit('old customer name',result[i])
          this.chat_message.retrieve_history_message(this.socket, result[i])
        }
      }
    })
  }




  // Called on receipt of input from the operator
  _gotOperatorInput (message) {
    // Operator messages take the form of an object with customerId and utterance properties
    var { customerId, utterance } = message;
    console.log('Got operator input: ', message);
    // Look up the customer referenced in the operator's message
    this.router.customerStore
      .getOrCreateCustomer(customerId)
      .then(customer => {
        // Check if we're in agent or human mode
        // If in agent mode, ignore the input
        console.log('Got customer: ', JSON.stringify(customer));

        // Handover keyword detection to allow human operator to take control from the chatbot
        if(utterance =='handover' || utterance =='takeover'){
          customer.mode = CustomerStore.MODE_OPERATOR;
          console.log('activate')
          this.router.customerStore.setCustomer(customerId, customer)     
          this.router._OperatorRequestHandle(customerId, customer);
          this.chat_message._saveConversationChat(customer, message)
          message.agent = customer.agent;
          return this.router._relayOperatorMessage(message);
        }
        // if the user select the guidance method, set the handover method as guidance so there will not be any interruption to the chatbot
        else if(customer.agent =='chatbot-guide'){
          customer.mode = CustomerStore.MODE_OPERATOR_GUIDE;
          this.router.customerStore.setCustomer(customerId, customer)
        }
        // keyword to return the control back to the chatbot
        else if(utterance == 'return') {
          customer.mode = CustomerStore.MODE_AGENT;
          console.log('return to chatbot')
          this.router.customerStore.setCustomer(customerId, customer)
          this.chat_message._saveConversationChat(customer, message)
          return this.router._relayOperatorMessage(message);
        }
          // This indicate the operator only able to answer user when handover occur
        else if (customer.mode === CustomerStore.MODE_AGENT) {
          console.log("activate is fake here")
          return Promise.reject(
            new CustomerModeError('Cannot respond to customer until they have been escalated.')
          );
        }
        
        
        // Otherwise, relay it to all operators
        return this.router._relayOperatorMessage(message)
          // And send it to the appropriate customer
          .then(() => {
            this.chat_message._saveConversationChat(customer, message)
            const customerConnection = this.router.customerConnections[customerId];
            if(customer.mode === CustomerStore.MODE_OPERATOR_GUIDE){
              console.log("guidance")
              utterance = '<span>----------------------------------<br />' + 'Guidance from Operator<br />' + '----------------------------------</span>' + 'Operator: ' + utterance + '<br /><span>Please don\'t reply to this message.</span>'
            }
            return customerConnection._respondToCustomer(utterance);
          });
      })
      .catch(error => {
        console.log('Error handling operator input: ', error);
        return this._sendErrorToOperator(error);
      });
  }

  // error handling method and will send the error message to the human operator side
  _sendErrorToOperator (error) {
    console.log('Sending error to operator');
    this.socket.emit(AppConstants.EVENT_SYSTEM_ERROR, {
      type: error.name,
      message: error.message
    });
  }
}

module.exports = OperatorConnectionHandler;
