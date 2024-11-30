import * as TelegramBot from 'node-telegram-bot-api';
import TaroAgent from './Agent';
import * as FireBase from "./FireBaseDB";
import crypto = require("crypto");
function IsNull(input:string): boolean
{
    if(input == null || input == "") return true;
    return false;
}
setTimeout(async () => {
    const agent = new TaroAgent();
    const token = `Your Key`;
    const waitTextArray = [`(稍等，Cati正在整理思绪)`,`(稍等片刻)`,`(Cati正在准备道具，请稍等片刻)`];
    const bot = new TelegramBot(token, { polling: true });
    const welcomeMsg = `嘿嘿，你好呀！我是Cati，一位神秘的塔罗牌占卜师！💫✨
现在，就告诉我你想要占卜的内容吧！是关于爱情、事业，还是其他什么呢？我会帮你抽取三张牌，揭开未来的神秘面纱哦～`;
    let lockChat = [];
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        if(lockChat.indexOf(chatId) >= 0) return;
        lockChat.push(chatId);
        await bot.sendMessage(chatId, welcomeMsg);
        lockChat = lockChat.filter(item => item != chatId);
    });

    bot.onText(/^(?!\/start).*$/, async (msg)=>{
        if(IsNull(msg.text)) return;
        const chatId = msg.chat.id;
        await bot.sendChatAction(chatId, "typing");
        if(lockChat.indexOf(chatId) >= 0) 
        {
            await bot.sendMessage(chatId, waitTextArray[Math.floor(Math.random() * waitTextArray.length)]);
            return;
        }
        lockChat.push(chatId);
        let result = await agent.Chat(msg.text, chatId.toString());
        if(result == null || result.output == null) 
        {
            await bot.sendMessage(chatId, waitTextArray[Math.floor(Math.random() * waitTextArray.length)]);
            return;
        }
        if(result.output.startsWith("{"))
        {
            try{
                let json = JSON.parse(result.output);
                let path = crypto.randomUUID().toString();
                await FireBase.AddItemToDB(path, JSON.stringify(json));
                const options = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                //{ text: '点击占卜 🏹', url: `https://t.me/tarotrues_bot/tarotures/?startapp=${jsonBase64}` }
                                //{ text: '点击占卜 🏹', url: `https://t.me/tarotrues_bot/tarotures/?startapp=${Buffer.from(jsonBase64).toString("base64")}` }
                                { text: '点击占卜 🏹', url: `https://t.me/tarotrues_bot/tarotures?startapp=${path}` }
                            ],
                            [
                                { text: '钱包🌮', url: 'https://google.com' },
                                { text: '市场🍕', url: 'https://google.com' },
                                { text: '捐赠🍧', url: 'https://google.com' },
                                { text: '建议', url: 'https://google.com' }
                            ]
                        ]
                    }
                };
                await bot.sendMessage(chatId, json.reply, options);
            }
            catch{}
        }
        else
        {
            await bot.sendMessage(chatId, result.output);
        }
        lockChat = lockChat.filter(item => item != chatId);
    });
}, 1);

// setTimeout(async () => {
//     let path = crypto.randomUUID().toString();
//     await FireBase.AddItemToDB(path, "fdfdasfdsafdsafdaf");
//     await FireBase.GetItemFromDB(path);
// }, 1);