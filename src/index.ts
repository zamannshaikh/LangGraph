
import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { 
  StateGraph, 
  MessagesAnnotation, 
  START, 
  END 
} from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

// 1. Initialize the Google Gemini Model
const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash", // or "gemini-1.5-turbo"
  apiKey: process.env.GOOGLE_API_KEY!, // Ensure this is set in your .env
});

// 2. Define the Node (The Worker)
// This function takes the current state, calls the model, and returns the new message.
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  
  // We return an object that matches the structure of our State.
  // LangGraph merges this into the existing state (appending the message).
  return { messages: [response] };
}

// 3. Build the Graph
// MessagesAnnotation is a pre-built state helper that handles a list of messages for us.
const workflow = new StateGraph(MessagesAnnotation)
  // Add our node
  .addNode("agent", callModel)
  
  // Add Edges (Connect the dots)
  .addEdge(START, "agent") // Start -> Agent
  .addEdge("agent", END);  // Agent -> End

// 4. Compile it into a runnable application
const app = workflow.compile();

// 5. Run it
async function main() {
  const result = await app.invoke({
    messages: [new HumanMessage("Explain quantum physics in one sentence.")]
  });

  // The result contains the final state (all messages)
  const lastMessage = result.messages[result.messages.length - 1];
  console.log("AI Response:", lastMessage?.content);
}

main().catch(console.error);