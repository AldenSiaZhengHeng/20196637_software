// The user input message will be process in here with threshold 0.6
// After process, the result will be return in order to proceed next stage
const { NlpManager } = require("node-nlp");

class chatbot {
  constructor(){
    this.manager = new NlpManager({ 
      languages: ["en"], 
      threshold:0.6
    });
    this.manager.load()
  }

  // function to process the input message to return corresponding message
  async getAnswer(user_utterance) {
    if(user_utterance != null){
      const response = await this.manager.process("en", user_utterance);
      return response;
    }
    return null;
  
  };
  
}


module.exports = chatbot