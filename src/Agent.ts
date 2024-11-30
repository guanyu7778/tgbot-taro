import { DynamicStructuredTool, StructuredToolParams } from "@langchain/core/tools";
import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { AgentRunnableSequence } from "langchain/dist/agents/agent";
import { ChatMessageHistory, ConversationSummaryBufferMemory } from "langchain/memory";
import { BaseChatMessageHistory } from "@langchain/core/chat_history";
import { RunnablePassthrough, RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";

export default class TaroAgent
{
    private chatModel:ChatOpenAI;
    private systemPrompt:ChatPromptTemplate;
    private chainWithTrimming:RunnableSequence;
    private static store = [];
    private static historyLimit = 10;

    constructor()
    {
        this.chatModel = new ChatOpenAI({
            //modelName : "deepseek-chat",
            modelName: "gpt-4o",
            temperature: 0.9,
            topP: 0.7,
            openAIApiKey: "Your Key"
        });
        this.systemPrompt = ChatPromptTemplate.fromMessages([
            ["system", 
`你扮演一位北京大学历史系的美少女塔罗牌占卜师，名字叫Cati。
你长相甜美，语言西方古典，充满了神秘感，喜欢吊人胃口。
请不要主动询问用户是否需要占卜或引导用户去占卜。
请只专注于直接回答问题，不要使用附加的服务性语言。
占卜的规则是用户说出想占卜的内容后，由你抽取三张塔罗牌，注意正逆位，然后由你给出解答。
如果本次回复类型是占卜结果，那么以下面的JSON格式返回结果，我将直接使用JSON.parse方法解析这个json，所以格式一定要正确。
{{
  "cards":
  [
    {{
      "name":"塔罗牌的名字",
      "position":"正位|逆位",
      "description":"占卜内容的卡牌诠释，注意结合用户想占卜的内容做出详细诠释"
    }}
  ],
  "reply":"你对用户想占卜内容（注意不是占卜结果，而是用户想占卜的内容）的主观评价，需要符合你的语言风格",
  "summarize":"你对占卜结果的详细总结，需要符合你的语言风格"
}}`],
            ["placeholder", "{chat_history}"],
            ["human", "{input}"],
            ["placeholder", "{agent_scratchpad}"],
        ]);
        const tools = [];
        const agent = createToolCallingAgent({ llm: this.chatModel, tools: tools, prompt: this.systemPrompt });
        const agentExecutor = new AgentExecutor({
            agent: agent,
            tools: tools
        });
        let getMessageHistory = TaroAgent.getMessageHistory;
        let agentWithChatHistory = new RunnableWithMessageHistory({
            runnable: agentExecutor,
            getMessageHistory,
            inputMessagesKey: "input",
            historyMessagesKey: "chat_history",
        });
        let trimMessages = TaroAgent.trimMessages;
        this.chainWithTrimming = RunnableSequence.from([
            RunnablePassthrough.assign({ messages_trimmed: trimMessages }),
            agentWithChatHistory,
        ]); 
    }

    public static getMessageHistory(sessionId: string): BaseChatMessageHistory  {
        if (!(sessionId in TaroAgent.store)) {
            TaroAgent.store[sessionId] = new ChatMessageHistory();
        }
        return TaroAgent.store[sessionId];
    }

    public static async trimMessages(_chainInput: Record<string, any>)
    {
        const sessionId = _chainInput.sessionId;  // Now available
        const historyMessages = TaroAgent.getMessageHistory(sessionId);
        // Use sessionId in your logic
        let storedMessages = await historyMessages.getMessages();
        if (storedMessages.length <= TaroAgent.historyLimit) {
          return false;
        }
        await historyMessages.clear();
        for (const message of storedMessages.slice(-1 * TaroAgent.historyLimit)) {
            historyMessages.addMessage(message);
        }
        return true;
    };

    public async Chat(input:string, sessionId:string):Promise<any>
    {
        try
        {
            return await this.chainWithTrimming.invoke({input: input, sessionId: sessionId}, {configurable: {sessionId: sessionId}});
        }
        catch(e)
        {
            console.error(e);
            return null;
        }
    }
}