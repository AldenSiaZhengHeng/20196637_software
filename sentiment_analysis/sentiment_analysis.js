const { PorterStemmer, SentimentAnalyzer, WordTokenizer } = require("natural")
const { removeStopwords } = require("stopword");

// Sentiment analysis class
// The user's input message will be pass to here and pre-processing and analyze by sentiment analyzer to get the sentiment result and send back to human operator
class sentiment_analysis{
    constructor(){
        // Set the language identify
        this.analyzer = new SentimentAnalyzer("English", PorterStemmer, "afinn");
        this.tokenizer = new WordTokenizer();
    } 

    // main function to determine the emotion from the input message
    getSentiment(user_utterance){
        console.log("User utterance:" + user_utterance);
        const filteredText = user_utterance
            .replace("n't", " not")
            .replace("'s", " is")
            .replace("'re", " are")
            .replace("'ve", " have")
            .replace("'d", " would")
            .replace("'ll", " will")
            .replace("'m", " am")
            .replace(/[^a-zA-Z\s]+/g, "");    
    
        console.log(`filteredText = ${filteredText}`);

        // tokenize the word
        const tokens = this.tokenizer.tokenize(filteredText);
        console.log(`tokens = ${tokens}`);
    
        // filter the word
        const filteredTokens = removeStopwords(tokens).map((token) =>
            token.toLowerCase()
        );
        console.log(`filteredTokens = ${filteredTokens}`);
    
        // calculate the score with bayes theorem
        const score = this.analyzer.getSentiment(filteredTokens);
        console.log(`score = ${score}/5`);
    
        const percent = Math.round((score / 5) * 100);
        console.log(`percent = ${percent}`);
    
        if (score > 0) {
            console.log( percent, "sentiment: positive ");
            var result = {score:percent, feeling: "positive"};
            return result;
        } else if (score < 0) {
            console.log( percent, "sentiment: negative ");
            var result = {score:percent, feeling: "negative"};
            return result;
        } else {
            console.log( percent, "sentiment: neutral ");
            var result = {score:percent, feeling: "neutral"};
            return result;
        }
        
    }
}

module.exports = sentiment_analysis
