
// import 'dotenv/config';
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { 
//   StateGraph, 
//   MessagesAnnotation, 
//   START, 
//   END 
// } from "@langchain/langgraph";
// import { HumanMessage } from "@langchain/core/messages";


// const model = new ChatGoogleGenerativeAI({
//   model: "gemini-2.5-flash", // or "gemini-1.5-turbo"
//   apiKey: process.env.GOOGLE_API_KEY!, // Ensure this is set in your .env
// });


// async function callModel(state: typeof MessagesAnnotation.State) {
//   const response = await model.invoke(state.messages);
  
//   return { messages: [response] };



// }
// async function translator(state:typeof MessagesAnnotation.State) {
//   const lastMessage= state.messages[state.messages.length - 1];
//   const text = lastMessage?.content;

//   const prompt = `Translate the following text to French: ${text}`;
//   const response = await model.invoke([new HumanMessage(prompt)]);


//      return { messages: [response] };

    
//   }

//   // 1. The Logic Function (The Traffic Cop)
// function routeMessage(state: typeof MessagesAnnotation.State) {
//   const lastMessage = state.messages[state.messages.length - 1];
//   const text = (lastMessage?.content as string).toLowerCase();

//   // Simple logic: Does the message start with "translate"?
//   if (text.startsWith("translate")) {
//     return "translator"; // Go to the translator node
//   } 
  
//   return "agent"; // Otherwise, go to the general agent
// }

// const workflow = new StateGraph(MessagesAnnotation)
//   // Add our node
//   .addNode("agent", callModel)
//   .addNode("translator", translator)
  
//   // Add Edges (Connect the dots)
//   .addConditionalEdges(START, routeMessage)
//   .addEdge("agent", END)
//   .addEdge("translator", END);

// // 4. Compile it into a runnable application
// const app = workflow.compile();

// // 5. Run it
// async function main() {
//   const result = await app.invoke({
//     messages: [new HumanMessage("translate and  Explain quantum physics in one sentence.")]
//   });

//   // The result contains the final state (all messages)
//   const lastMessage = result.messages[result.messages.length - 1];
//   console.log("AI Response:", lastMessage?.content);
// }

// main().catch(console.error);




// memory implementation 
import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { 
  StateGraph, 
  MessagesAnnotation, 
  START, 
  END,
  MemorySaver // <--- NEW IMPORT
} from "@langchain/langgraph";
import { HumanMessage } from "@langchain/core/messages";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash", 
  apiKey: process.env.GOOGLE_API_KEY!,
});

// Standard Agent Node
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

// Build the Graph
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge(START, "agent")
  .addEdge("agent", END);

// --- MEMORY SETUP ---
const checkpointer = new MemorySaver(); // In-memory storage

const app = workflow.compile({ 
  checkpointer // <--- Attach memory here
});

async function main() {
  // Define a Thread ID (Like a conversation ID)
  const config = { configurable: { thread_id: "conversation-1" } };

  console.log("--- Turn 1: Introducing myself ---");
  const input1 = { messages: [new HumanMessage("Hi! My name is Zaman.")] };
  const result1 = await app.invoke(input1, config);
  console.log("AI:", result1.messages[result1.messages.length - 1]?.content);

  console.log("\n--- Turn 2: Testing Memory ---");
  // Notice: I am NOT telling it my name again.
  const input2 = { messages: [new HumanMessage("What is my name?")] };
  const result2 = await app.invoke(input2, config); // <--- Using SAME config
  console.log("AI:", result2.messages[result2.messages.length - 1]?.content);
}

main().catch(console.error);