import { StateGraph } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { llmNode } from "./llmNode.js";

const graph = new StateGraph(AgentState);

graph.addNode("llm", llmNode);

graph.addEdge("__start__", "llm");
graph.addEdge("llm", "__end__");

export const app = graph.compile();
