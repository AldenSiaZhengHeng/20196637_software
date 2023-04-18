// This file contain the function to handle the customer connection and process the input message in server sides

const AppConstants = require('./appConstants.js');
const ChatConnectionHandler = require('./chatConnectionHandler.js');

// Handles the connection to an individual customer
class CustomerConnectionHandler extends ChatConnectionHandler {
  constructor (socket, messageRouter, onDisconnect) {
    super(socket, messageRouter, onDisconnect);
    // In this sample, we use the socket's unique id as a customer id.
    this.init(socket.id);
    this.attachHandlers();
  }
  
  // the store customer id function might be able to put here
  // this part might need to changing to send welcome event to customer then send connection status to operator
  init (customerId) {
    console.log('A customer joined: ', this.socket.id);

    // if it is new customer, create a json object for it to prepare to store the username and agent selected.
    // or else retrieve the information of the corresponding customer based on the socket.id
    this.router.customerStore.getOrCreateCustomer(customerId)
      .then(customer => {
        // If the customer is new, send the welcome intent and
        if (customer.isNew) {
          return this.router._welcomeEventToCustomer(customer, customerId)
            .then(responses => {
              const response = responses.answer;
              this._respondToCustomer(response, this.socket);
            });
        }
        // If known, do nothing - they just reconnected after a network interruption
      })
      .catch(error => {
        // Log this unspecified error to the console and
        // inform the customer there has been a problem
        console.log('Error after customer connection: ', error);
        this._sendErrorToCustomer(error);
      });
  }

  // main function to decide the action based on the specific key that emitted by the socket
  attachHandlers () {
    
    // save the username and agent selected to the json object that have been creaeted when the customer page is loaded.
    this.socket.on('customer-details', (data) =>{
      this.router.customerStore.pushToExisitingStore(this.socket.id, data);
      this.router._sendConnectionStatusToOperator(this.socket.id)
    });

    // get the input message from user and send to the message router for further process
    this.socket.on(AppConstants.EVENT_CUSTOMER_MESSAGE, (message) => {
      console.log('Received customer message: ', message);
      this._gotCustomerInput(message);
    });

    // inform the human operator if the customer disconnect
    this.socket.on(AppConstants.EVENT_DISCONNECT, () => {
      console.log('Customer disconnected');
      this.router._sendConnectionStatusToOperator(this.socket.id, true);
      this.onDisconnect() ;
    });
  }

  // Called on receipt of input from the customer
  _gotCustomerInput (utterance) {
    // Look up this customer
    this.router.customerStore
      .getOrCreateCustomer(this.socket.id)
        .then(customer => {
          // process customer message in messageRouter
          return this.router._routeCustomer(utterance, customer, this.socket.id);
        })
        .then(response => {
          // Send any response back to the customer
          if (response) {
            console.log("return response to customer")
            return this._respondToCustomer(response.answer, this.socket);
          }
        })
      .catch(error => {
        // Log this unspecified error to the console and
        // inform the customer there has been a problem
        console.log('Error after customer input: ', error);
        this._sendErrorToCustomer(error);
      });
  }

  // Send a message or an array of messages that response by chatbot or human agent back to the customer
  _respondToCustomer (response) {
    console.log('Sending response to customer:', response);
    if (Array.isArray(response)) {
      response.forEach(message => {
        this.socket.emit(AppConstants.EVENT_CUSTOMER_MESSAGE, message);
      });
      return;
    }
    this.socket.emit(AppConstants.EVENT_CUSTOMER_MESSAGE, response);
    // We're using Socket.io for our chat, which provides a synchronous API. However, in case
    // you want to swich it out for an async call, this method returns a promise.
    return Promise.resolve();
  }

  _sendErrorToCustomer () {
    // Immediately notifies customer of error
    console.log('Sending error to customer');
    this.socket.emit(AppConstants.EVENT_SYSTEM_ERROR, {
      type: 'Error',
      message: 'There was a problem.'
    });
  }
}

module.exports = CustomerConnectionHandler;
