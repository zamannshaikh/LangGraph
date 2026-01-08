import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "./state.js";

const model = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  temperature: 0.7,
});

export async function llmNode(
  state: typeof AgentState.State
) {
  const res = await model.invoke(state.input);

  return {
    output:
      typeof res.content === "string"
        ? res.content
        : res.content.map(c => c.text ?? "").join(" "),
  };
}
