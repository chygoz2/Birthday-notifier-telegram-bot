require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const Telegraf = require("telegraf");
const cron = require("node-cron");

const {
  sendBirthdayNotifications,
  readBotGroupsFile,
  writeBotGroupsFile,
} = require("./utility");

const app = express();

const bot = new Telegraf(process.env.BOT_TOKEN);
const BOT_USERNAME = "BirthdayNotifierBot";

let savedGroups = readBotGroupsFile("./groupsBotIsIn.json");
let groupsBotIsIn = [...savedGroups];

bot.on("new_chat_members", (ctx) => {
  const members = ctx.message.new_chat_members;
  members.forEach((element) => {
    if (element.username == BOT_USERNAME) {
      const chatId = ctx.message.chat.id;
      if (
        chatId.toString().startsWith("-") &&
        groupsBotIsIn.indexOf(chatId) < 0
      ) {
        groupsBotIsIn.push(chatId);
        writeBotGroupsFile("./groupsBotIsIn.json", groupsBotIsIn);
        bot.telegram.sendMessage(
          chatId,
          "Thank you for adding me to this group. \n\n I can now send birthday alerts here"
        );
      }
    }
  });
});

bot.on("left_chat_member", (ctx) => {
  const member = ctx.message.left_chat_member;
  if (member.username == BOT_USERNAME) {
    const chatId = ctx.message.chat.id;
    let indexOfGroup = groupsBotIsIn.indexOf(chatId);
    if (indexOfGroup > -1) {
      groupsBotIsIn.splice(indexOfGroup, 1);
    }
    writeBotGroupsFile("./groupsBotIsIn.json", groupsBotIsIn);
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// const chatId = "-424777229";

app.get("/", async function (req, res) {
  // await sendBirthdayNotifications(bot, chatId);
  res.send("OK");
});

cron.schedule(process.env.CRON_STRING, () => {
  console.log('running cron...')
  groupsBotIsIn.forEach(async chatId => {
    await sendBirthdayNotifications(bot, chatId)
  })
})

const port = process.env.PORT || 8080

bot.launch();
app.listen(port, () => {
  console.log(`App is running on port: ${port}`)
});
