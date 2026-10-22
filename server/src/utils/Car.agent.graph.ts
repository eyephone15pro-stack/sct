import { ChatOllama } from '@langchain/ollama';
import {
  AIMessage, HumanMessage, SystemMessage, ToolMessage, BaseMessage,
} from '@langchain/core/messages';
import { END, MemorySaver, MessagesAnnotation, START, StateGraph } from '@langchain/langgraph';
import { ToolNode, toolsCondition } from '@langchain/langgraph/prebuilt';
import { carTools } from './car-agent.tools.js';

const SYSTEM_PROMPT = `You are an expert used-car valuation advisor for the Indian market.
You have tools: predict_car_price, compare_cars, what_if_analysis, emi_calculator.

Rules:
- Required fields for a prediction: brand, model, year, km_driven, fuel, transmission, owner, location, engine_cc, mileage_kmpl.
- If any required field is missing, ask the user for ALL missing fields in ONE short message. Never invent values.
  Exception: if the user does not know engine_cc or mileage_kmpl, you may use typical values for that model and say so.
- Never guess prices yourself. Always use a tool for any price.
- After a tool result, reply in 2-4 friendly sentences. Prices in lakh (₹44.89 lakh) and rupees.
- Mention the model's typical error (MAE) when you give a prediction.
- Reuse car details from earlier in the conversation instead of asking again.
- Stay on topic: cars, prices, loans. Politely decline anything else.`;

const llm = new ChatOllama({
  model: process.env.OLLAMA_MODEL ?? 'llama3.1:8b',
  // baseUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  temperature: 0,
}).bindTools(carTools);

async function agentNode(state: typeof MessagesAnnotation.State) {
  const res = await llm.invoke([new SystemMessage(SYSTEM_PROMPT), ...state.messages]);
  return { messages: [res] };
}

export const carGraph = new StateGraph(MessagesAnnotation)
  .addNode('agent', agentNode)
  .addNode('tools', new ToolNode(carTools))
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', toolsCondition, { tools: 'tools', [END]: END })
  .addEdge('tools', 'agent')
  .compile({ checkpointer: new MemorySaver() }); // keeps chat memory per thread_id

export interface CarAgentResult {
  reply: string;
  threadId: string;
  toolResults: any[]; // parsed tool outputs -> rendered as cards in the UI
}

/** The function you asked for: give it user text, get a smart answer. */
export async function runCarAgent(
  input: string,
  threadId = 'default',
): Promise<CarAgentResult> {
  const result = await carGraph.invoke(
    { messages: [new HumanMessage(input)] },
    { configurable: { thread_id: threadId }, recursionLimit: 10 },
  );

  const msgs: BaseMessage[] = result.messages;
  const lastHuman = msgs.map((m) => m._getType()).lastIndexOf('human');
  const turn = msgs.slice(lastHuman + 1);

  const toolResults = turn
    .filter((m): m is ToolMessage => m._getType() === 'tool')
    .map((m) => {
      try { return JSON.parse(String(m.content)); } catch { return null; }
    })
    .filter(Boolean);

  const last = [...turn].reverse().find((m) => m._getType() === 'ai') as AIMessage | undefined;
  return { reply: String(last?.content ?? ''), threadId, toolResults };
}