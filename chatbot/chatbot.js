const { NlpManager } = require("node-nlp");
const { NerManager } = require('node-nlp');

class chatbot {
  constructor(){
    this.manager = new NlpManager({ 
      languages: ["en"], 
      threshold:0.6
    });
    this.manager.load()
  }

  async getAnswer(user_utterance) {
    if(user_utterance != null){
      const response = await this.manager.process("en", user_utterance);
      return response;
    }
    return null;
  
  };
  
}


module.exports = chatbot



// const { NlpManager, ConversationContext } = require('node-nlp');

// const manager = new NlpManager({ languages: ['en'] });
// const context = new ConversationContext();

// manager.addDocument('en', 'Hello my email is %name%', 'greeting.hello');
// manager.addDocument('en', 'I have to go', 'greeting.bye');
// manager.addDocument('en', 'asdadadasds','agent.frustuated');

// manager.addNamedEntityText('name','trim');


// manager.addAnswer('en', 'greeting.hello', 'Hey there, {{name}}!');
// manager.addAnswer('en', 'greeting.bye', 'Till next time, {{email}}!');
// manager.addAnswer('en', 'agent.frustuated', 'can you state your question more clearly?');


// manager.train()
//     // .then(result => manager.process('en', 'asdadadassdaasds', context))
//   .then(result => manager.process('en', 'Hello my email is alden', context))
// //   .then(result => manager.process('en', 'I have to go', context))
//   .then(result => console.log(result.answer));
// const { NlpManager, ConversationContext } = require('node-nlp');
// const nlp = new NlpManager({ languages: ['en'] });
// const message = "i hate you";

// nlp.addDocument('en',"I love this product", "positive");
// nlp.addDocument('en',"This product is terrible", "negative");
// nlp.addDocument('en',"I'm neutral about this product", "neutral");
// nlp.addDocument('en',"Fuck you", "negative"); // Train the model

// nlp.train()
//     .then(result => nlp.classify(message))
//     .then(result => console.log(result))

// const message = "I love this product";
// const classification = nlp.classify(message);
// console.log(classification);
// Output: { sentiment: 'positive', score: 0.98 }
