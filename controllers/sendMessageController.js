const axios = require("axios");
const smsToken = require('./tokenController');
const validateFun = require("./validateFun");
const isValidPhoneNumber = (phone) => {
  const cleanPhone = phone.replace(/[\s()+-]/g, ""); // remove all spaces, parentheses, + and - signs
  const isValidFormat =
    cleanPhone.startsWith("998") && cleanPhone.length === 12; // check if the remaining string starts with "998" and has length of 12
  const containsOnlyDigits = /^\d+$/.test(cleanPhone); // check if the remaining string only contains digits
  return isValidFormat && containsOnlyDigits;
};

const sendMessage = async (arr) => {
  try {
    let token = await smsToken.getCurrentToken();
    const config = { headers: { Authorization: `Bearer ${token}` } };

    const validPhoneMessages = arr.filter(({ phone, text }) => {
      return isValidPhoneNumber(phone) && text.length <= 160;
    });

    async function sendMessagesRecursively(messages) {
      if (messages.length === 0) {
        return; // Base case: All messages have been sent
      }

      const { phone, text } = messages[0];
      const cleanPhone = phone.replace(/[\s()+-]/g, "");
      console.log(60, text);
      try {
        const response = await axios.post(
          "https://notify.eskiz.uz/api/message/sms/send",
          {
            mobile_phone: cleanPhone,
            message: text,
            from: 4546,
          },
          config
        );

        console.log("Message sent:", cleanPhone);
      } catch (error) {
        console.log("Message failed:", cleanPhone);
        console.log(25, error.stack);
      }

      // Recursively send the remaining messages
      await sendMessagesRecursively(messages.slice(1));
    }

    await sendMessagesRecursively(validPhoneMessages);
  } catch (error) {
    console.log(14, error.stack);
  }
};


module.exports = sendMessage;
