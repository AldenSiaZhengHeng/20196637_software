// This file content basic information to trigger the socket service to emit the information by specific variable

module.exports = {
  EVENT_CUSTOMER_CONNECTED: 'customer connected',
  EVENT_CUSTOMER_DISCONNECTED: 'customer disconnected',
  EVENT_CUSTOMER_MESSAGE: 'customer message',
  EVENT_OPERATOR_MESSAGE: 'operator message',
  EVENT_OPERATOR_REQUESTED: 'operator requested',
  EVENT_SYSTEM_ERROR: 'system error',
  EVENT_DISCONNECT: 'disconnect',

  CONTEXT_OPERATOR_REQUEST: 'operator_request',

  REQUESTED_OPERATOR_GREETING: `Hello, I'm your customer service agent. How can I help you?`,
  OPERATOR_GREETING: "A human operator has been requested, plesae wait patiently and someone will get in touch with you soon."

};
