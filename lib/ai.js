const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY || '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',
    organization: 'org-70Ca8yRzbztAXwgVRmFI8Z7J',
    //apiKey: process.env.OPENAI_API_KEY || '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',
    //organization: 'org-1Oifmpst7Y9IkloUhYQq9Ga6',
  });
  const openai = new OpenAIApi(configuration);

  async function runCompletion(prompt) {
    try {
      const completion = await openai.createCompletion({
        model: process.env.MODEL_USED_BY_GPT || 'text-curie-001',
        prompt: prompt,
      });
  
      console.log(completion.data.choices);
      return completion.data.choices;
    } catch (error) {
      console.error('Error occurred during API call:', error);
      // Handle the error as needed
      throw error;
    }
  }

  async function runImageCompletion (payload) {
    const completionNew = await openai.createImage({
      prompt: payload.prompt,
      n: 1,
      size: '512x512'
    });
    return completionNew.data.data
  }

module.exports = {
    runCompletion,
    runImageCompletion
}