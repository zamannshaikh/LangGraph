
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
// import 'dotenv/config';
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { 
//   StateGraph, 
//   MessagesAnnotation, 
//   START, 
//   END,
//   MemorySaver // <--- NEW IMPORT
// } from "@langchain/langgraph";
// import { HumanMessage } from "@langchain/core/messages";

// const model = new ChatGoogleGenerativeAI({
//   model: "gemini-2.5-flash", 
//   apiKey: process.env.GOOGLE_API_KEY!,
// });

// // Standard Agent Node
// async function callModel(state: typeof MessagesAnnotation.State) {
//   const response = await model.invoke(state.messages);
//   return { messages: [response] };
// }

// // Build the Graph
// const workflow = new StateGraph(MessagesAnnotation)
//   .addNode("agent", callModel)
//   .addEdge(START, "agent")
//   .addEdge("agent", END);

// // --- MEMORY SETUP ---
// const checkpointer = new MemorySaver(); // In-memory storage

// const app = workflow.compile({ 
//   checkpointer // <--- Attach memory here
// });

// async function main() {
//   // Define a Thread ID (Like a conversation ID)
//   const config = { configurable: { thread_id: "conversation-1" } };

//   console.log("--- Turn 1: Introducing myself ---");
//   const input1 = { messages: [new HumanMessage("Hi! My name is Zaman.")] };
//   const result1 = await app.invoke(input1, config);
//   console.log("AI:", result1.messages[result1.messages.length - 1]?.content);

//   console.log("\n--- Turn 2: Testing Memory ---");
//   // Notice: I am NOT telling it my name again.
//   const input2 = { messages: [new HumanMessage("What is my name?")] };
//   const result2 = await app.invoke(input2, config); // <--- Using SAME config
//   console.log("AI:", result2.messages[result2.messages.length - 1]?.content);
// }

// main().catch(console.error);







// implemention of interuptions

// import 'dotenv/config';
// import { 
//   StateGraph, 
//   MessagesAnnotation, 
//   START, 
//   END,
//   MemorySaver 
// } from "@langchain/langgraph";
// import { HumanMessage } from "@langchain/core/messages";

// // Node 1: The Agent (Proposes the action)
// async function agentNode(state: typeof MessagesAnnotation.State) {
//   console.log("--- Step 1: Agent is planning ---");
//   return { 
//     messages: [new HumanMessage("I am ready to launch the missiles. Awaiting approval.")] 
//   };
// }

// // Node 2: The Sensitive Action (The dangerous part)
// async function launchNode(state: typeof MessagesAnnotation.State) {
//   console.log("--- Step 2: EXECUTION ---");
//   return { 
//     messages: [new HumanMessage("🚀 MISSILES LAUNCHED!")] 
//   };
// }

// // Build the Graph
// const workflow = new StateGraph(MessagesAnnotation)
//   .addNode("agent", agentNode)
//   .addNode("launch_site", launchNode)
  
//   .addEdge(START, "agent")
//   .addEdge("agent", "launch_site")
//   .addEdge("launch_site", END);

// // --- THE MAGIC PART ---
// const checkpointer = new MemorySaver();

// const app = workflow.compile({ 
//   checkpointer,
//   // This tells LangGraph: "STOP right before entering 'launch_site'"
//   interruptBefore: ["launch_site"], 
// });

// async function main() {
//   const config = { configurable: { thread_id: "mission-impossible-1" } };

//   // --- PHASE 1: The Initial Run ---
//   console.log("\n[PHASE 1] Starting the graph...");
//   await app.invoke({
//     messages: [new HumanMessage("Start the mission")]
//   }, config);

//   // At this point, the code inside 'launchNode' has NOT run yet.
//   // The graph is "sleeping" in the database.
  
//   console.log("\n[PAUSED] Graph has stopped. Waiting for human approval...");
  
//   // In a real app, you would exit here and wait for a user button click.
//   // We will simulate 'waiting' with a quick check.
//   const state = await app.getState(config);
//   console.log("Current Next Step:", state.next); // Should say 'launch_site'

//   // --- PHASE 2: Human Approval (Resuming) ---
//   console.log("\n[PHASE 2] Human says 'GO'. Resuming graph...");
  
//   // To resume, we call invoke again with 'null' (meaning: "No new input, just continue")
//   const result = await app.invoke(null, config);

//   console.log("Final Message:", result.messages[result.messages.length - 1]?.content);
// }

// main().catch(console.error);










import 'dotenv/config';
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { 
  StateGraph, 
  MessagesAnnotation, 
  START, 
  END 
} from "@langchain/langgraph";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

// --- 1. DEFINE THE TOOL ---
// We use the 'tool' helper to wrap a standard JS function.
// We MUST provide a 'schema' using Zod so the AI knows what inputs to provide.

const cryptoTool = tool(
  async ({ coinName }) => {
    console.log(`\n--- 🛠️  TOOL CALLED: Fetching price for ${coinName}... ---`);
    
    try {
      // Real API call to CoinGecko
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinName.toLowerCase()}&vs_currencies=usd`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Check if data exists
      if (!data[coinName.toLowerCase()]) {
        return `Error: Could not find price for '${coinName}'. Is it spelled correctly?`;
      }

      const price = data[coinName.toLowerCase()].usd;
      return `The current price of ${coinName} is $${price} USD.`;
      
    } catch (error) {
      return "Error fetching data from API.";
    }
  },
  {
    name: "get_crypto_price",
    description: "Fetches the current price of a cryptocurrency (e.g., bitcoin, ethereum, dogecoin).",
    schema: z.object({
      coinName: z.string().describe("The name of the cryptocurrency (e.g. 'bitcoin')"),
    }),
  }
);

// --- 2. SETUP MODEL WITH TOOLS ---
const tools = [cryptoTool];
const toolNode = new ToolNode(tools); // Prebuilt node that runs tools

const model = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  apiKey: process.env.GOOGLE_API_KEY!,
}).bindTools(tools); // <--- We hand the tool menu to Gemini here!


// --- 3. THE AGENT NODE ---
// It calls the model. The model will either return text OR ask to run a tool.
async function agentNode(state: typeof MessagesAnnotation.State) {
  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

// --- 4. CONDITIONAL LOGIC ---
// We need a function to decide: "Should we run a tool, or stop?"
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages[state.messages.length - 1] as AIMessage;

  // If the AI has "tool_calls", we MUST go to the tool node.
  if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
    return "tools";
  }
  
  // Otherwise, we are done.
  return END;
}

// --- 5. BUILD THE GRAPH ---
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode) // The prebuilt worker

  .addEdge(START, "agent")
  
  // The Decision Point:
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools", // If 'tools', go to 'tools' node
    [END]: END      // If END, stop
  })

  // The Loop Back:
  // After the tool runs, go BACK to the agent so it can read the result and answer you.
  .addEdge("tools", "agent"); 

const app = workflow.compile();

// --- 6. RUN IT ---
async function main() {
  console.log("Starting Crypto Agent...");
  
  const result = await app.invoke({
    messages: [new HumanMessage("What is the price of Bitcoin right now?")]
  });

  const lastMessage = result.messages[result.messages.length - 1];
  console.log("\nFINAL ANSWER:", lastMessage?.content);
}

main().catch(console.error);