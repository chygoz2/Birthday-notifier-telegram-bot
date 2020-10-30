require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const Telegraf = require("telegraf");
const cron = require("node-cron");
const axios = require("axios");
const config = require("./config");
const sequelize = require("./databaseConnection");
const ChatGroup = require("./models/ChatGroup");

const {
  sendBirthdayNotifications,
  writeBotGroupsFile,
  getDataFromSheet,
  getBirthdayIndex,
  getUserBirthdays,
} = require("./utility");
const { findAll } = require("./models/ChatGroup");

const app = express();

const bot = new Telegraf(process.env.BOT_TOKEN);
const BOT_USERNAME = "BirthdayNotifierBot";

bot.on("new_chat_members", (ctx) => {
  const members = ctx.message.new_chat_members;
  members.forEach(async (element) => {
    if (element.username == BOT_USERNAME) {
      const chatId = ctx.message.chat.id;
      let groupsBotIsIn = await ChatGroup.findAll({
        where: {
          id: chatId,
        },
      });
      if (chatId.toString().startsWith("-") && groupsBotIsIn.length < 1) {
        const chatGroup = await ChatGroup.create({
          id: chatId,
        });
        bot.telegram.sendMessage(
          chatId,
          "Thank you for adding me to this group. \n\n I can now send birthday alerts here"
        );
      }
    }
  });
});

bot.on("left_chat_member", async (ctx) => {
  const member = ctx.message.left_chat_member;
  if (member.username == BOT_USERNAME) {
    const chatId = ctx.message.chat.id;
    let groupsBotIsIn = await ChatGroup.findAll({
      where: {
        id: chatId,
      },
    });
    if (groupsBotIsIn.length > 0) {
      await ChatGroup.destroy({
        where: {
          id: chatId,
        },
      });
    }
  }
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// const chatId = "-424777229";

app.get("/", async function (req, res) {
  console.log("Endpoint called by cron");
  res.send("OK");
});

app.get("/birthdays", async function (req, res) {
  const data = await getDataFromSheet(config.googleSheetId);
  if (data.length < 2) return;

  const birthdayIndex = getBirthdayIndex(data[0]);
  const birthdays = getUserBirthdays(data.slice(1), birthdayIndex);
  res.json({
    birthdays,
  });
});

app.get("/connect", async function (req, res) {
  try {
    await sequelize.authenticate();
    res.send("Connection has been established successfully.");
  } catch (error) {
    res.json(error);
  }
});

app.get("/notify", async function (req, res) {
  try {
    await sequelize.authenticate();
    const groupsBotIsIn = await ChatGroup.findAll();
    groupsBotIsIn.forEach(async (group) => {
      await bot.telegram.sendMessage(group.id, 'Testing group messaging')
    });
    res.send('Notified groups')
  } catch (error) {
    res.json(error);
  }
});

cron.schedule(process.env.CRON_STRING, async () => {
  console.log("running cron...");
  const groupsBotIsIn = await ChatGroup.findAll();
  groupsBotIsIn.forEach(async (group) => {
    await sendBirthdayNotifications(bot, group.id);
  });
});

// globals
const url = "/";

cron.schedule("*/20 * * * *", () => {
  console.log("Keepalive running");
  axios
    .get(url)
    .then((res) => {
      console.log(`response-ok: ${res.status}, status: ${res.status}`);
    })
    .catch(() => {});
});

const port = process.env.PORT || 8080;

bot.launch();
app.listen(port, () => {
  console.log(`App is running on port: ${port}`);
});
