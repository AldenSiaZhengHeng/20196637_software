const userMessages = require('../model/userMessage')


class chat_message {
    // constructor(){
        
    // }

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