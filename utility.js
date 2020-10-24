const moment = require("moment");
const {
  getAuthToken,
  getSpreadSheetValues,
} = require("./googleSheetsService.js");
const config = require('./config')
const fs = require('fs')

const getDataFromSheet = async (spreadsheetId, sheetName = "Sheet1") => {
  try {
    const auth = await getAuthToken();
    const response = await getSpreadSheetValues({
      spreadsheetId,
      sheetName,
      auth,
    });
    return response.data ? response.data.values : []
  } catch (error) {
    console.log(error.message, error.stack);
  }
};

const getBirthdayIndex = (data) => {
  return data.indexOf("Birthday");
};

const getUserBirthdays = (data, birthdayIndex) => {
  return data
    .map((entry) => {
      try {
        let name = entry[1];
        let birthday = entry[birthdayIndex];
        if (birthday) {
          birthday = birthday.replace(/(st)|(nd)|(rd)|(th)/gi, "");
        }
        let formattedBirthday = moment(`${birthday} 2000`).format('DD MMMM');
        return {
          name,
          birthday,
          formattedBirthday,
        };
      } catch (err) {}
    })
    .filter((entry) => {
      return !!entry.name && !!entry.birthday;
    });
};

const getUpcomingBirthdaysMessage = data => {
  return `${data.name}'s birthday is coming up tomorrow, ${data.formattedBirthday} ${moment().year()}`
}

const getTodayBirthdaysMessage = data => {
  return `${data.name}'s birthday is today`
}

const getBirthdaysToday = data => {
  const today = moment().format('DD MMMM')
  return data.filter(entry => {
    return entry.formattedBirthday == today
  })
}

const getBirthdaysTomorrow = data => {
  const tomorrow = moment().add(1, 'days').format('DD MMMM')
  return data.filter(entry => {
    return entry.formattedBirthday == tomorrow
  })
}

const sendBirthdayNotifications = async (bot, chatId) => {
  const data = await getDataFromSheet(config.googleSheetId)
  if (data.length < 2) return

  const birthdayIndex = getBirthdayIndex(data[0])
  const userBirthdays = getUserBirthdays(data.slice(1), birthdayIndex)
  const birthdaysToday = getBirthdaysToday(userBirthdays)
  const birthdaysTomorrow = getBirthdaysTomorrow(userBirthdays)
  birthdaysToday.forEach(user => {
    bot.telegram.sendMessage(chatId, getTodayBirthdaysMessage(user))
  })
  birthdaysTomorrow.forEach(user => {
    bot.telegram.sendMessage(chatId, getUpcomingBirthdaysMessage(user))
  })
}

const readBotGroupsFile = (filePath) => {
  try {
    let jsonString = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(jsonString)
  } catch (err) {
    console.log('File read failed:', err)
  }
}

const writeBotGroupsFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data))
  } catch (err) {
    console.log('File write failed:', err)
  }
}

module.exports = {
  getDataFromSheet,
  getBirthdayIndex,
  getUserBirthdays,
  getUpcomingBirthdaysMessage,
  getTodayBirthdaysMessage,
  getBirthdaysToday,
  getBirthdaysTomorrow,
  sendBirthdayNotifications,
  readBotGroupsFile,
  writeBotGroupsFile,
};

