// The chat_message contain the function to store the message from the conversation

const userMessages = require('../model/userMessage')


class chat_message {

    // main function to store chat message from operator sides.
    async _saveConversationChat (customer, operatorMessage){
        // console.log(operatorMessage)
        let messageAttributes = {
          username: customer.username,
          operatorMessage: operatorMessage.utterance,
          userType: 'admin',
          agentType: customer.agent
        },
        m = new userMessages(messageAttributes);
        await m.save();
    }

    // retrieve the previous message store in the database to human operator sides
    async retrieve_message(socket, customer){
        try{
            var username = customer.username;
            console.log(username)
            const message = await userMessages
                .find({
                    username:{$all:username}
                })
            console.log(message)
            console.log(message.length)
            console.log(message[0])
            for(let i=0; i<message.length; i++){
                var msg = {
                    customerId: customer.id,
                    message: message[i]
                }
                socket.emit('receive_old_message',msg)
            }
            console.log("retrieve message here")

        }catch(ex){

        }
    }
}

module.exports = chat_message;