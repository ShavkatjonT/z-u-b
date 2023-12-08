const ApiError = require("../error/ApiError");
const sendMessage = require('./sendMessageController');
const {
  Messages,
  Students,
  Groups,
  GroupStudents,
  PendingGroups,
  StudentPending
} = require("../models/models");
const sequelize = require('../db');
const validateFun = require("./validateFun");
class MessagesController {
  async messageAddOne(req, res, next) {
    try {
      const { student_id, text, time } = req.body;

      if (!student_id) {
        return next(ApiError.badRequest("student idsi yo'q "));
      } else {
        const studentOne = await Students.findOne({
          where: { id: student_id },
        });
        if (!studentOne) {
          return next(ApiError.badRequest("Bunday o'quvchi topilmadi"));
        }
      }

      if (!text) {
        return next(ApiError.badRequest("Yuboriladigon text yo'q"));
      } else {
        let inString = typeof text;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }
      if (!time) {
        return next(ApiError.badRequest("Vaqt jo'natilmadi"));
      } else {
        let inString = typeof time;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      };

      const studentOne = await Students.findOne({
        where: { id: student_id, },
      });

      await Messages.create({
        group_id: '',
        student_id: studentOne.id,
        message: text,
        time,
        phone: studentOne.fatherPhone ? studentOne.fatherPhone : studentOne.motherPhone
      });

      const data = [{
        text,
        phone: studentOne.fatherPhone ? studentOne.fatherPhone : studentOne.motherPhone
      }]

      const messageResult = sendMessage(data);
      return res.json({ messageResult });


    } catch (error) {
      return next(ApiError.badRequest(`${error},message add one`));
    }
  };
  async messageAddGroup(req, res, next) {
    try {
      const { group_id, text, time } = req.body;

      if (!group_id) {
        return next(ApiError.badRequest("group idsi yo'q "));
      } else {
        const groupOne = await Groups.findOne({
          where: { id: group_id, status: "active" },
        });
        if (!groupOne) {
          return next(ApiError.badRequest("Bunday group topilmadi"));
        }
      }
      if (!text) {
        return next(ApiError.badRequest("Yuboriladigon text yo'q"));
      } else {
        let inString = typeof text;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }
      if (!time) {
        return next(ApiError.badRequest("Vaqt jo'natilmadi"));
      } else {
        let inString = typeof time;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }

      const groupStudent = await GroupStudents.findAll({
        where: { status: "active", group_id },
      });

      if (!groupStudent) {
        return next(ApiError.badRequest("Grouhda o'quvchilar yo'q"));
      }
      let messageList = groupStudent.map(async (e) => {
        let student = await Students.findOne({
          where: { status: "active", id: e.student_id },
        });
        const validete = (arg) => {
          let length = arg.length;
          let textWith = arg.startsWith("+998");
          let arr = arg.split("");
          let filterSecond = arr.filter((e) => {
            if (e !== "+" && e !== "-" && e !== "(" && e !== ")" && e !== " ") {
              if (
                Number(e) % 1 == 0 ||
                Number(e) % 2 == 0 ||
                Number(e) % 3 == 0 ||
                Number(e) % 4 == 0 ||
                Number(e) % 5 == 0 ||
                Number(e) % 6 == 0 ||
                Number(e) % 7 == 0 ||
                Number(e) % 8 == 0 ||
                Number(e) % 9 == 0 ||
                Number(e) % 0 == 0
              ) {
                return e;
              }
            }
          });

          if (filterSecond.join("").length == 12 && length == 19 && textWith) {
            return true;
          } else {
            return false;
          }
        };

        let pohoneSend = student.fatherPhone ? validete(student.fatherPhone) : validete(student.motherPhone);
        if ((student.fatherPhone || student.motherPhone) && pohoneSend) {
          await Messages.create({
            group_id,
            student_id: student.id,
            message: text,
            time,
            phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
          });
          let messagedData = {
            text: text,
            phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
          };
          return messagedData;
        } else {
          return "error";
        }
      });

      const messageFuc = async () => {
        const data = await Promise.all(messageList.map(async (e) => await e));
        return sendMessage(data);

      };
      const messageResult = messageFuc();
      return res.json({ messageResult });
    } catch (error) {
      return next(ApiError.badRequest(`${error},message add group`));
    }
  };
  async messageAddList(req, res, next) {
    try {
      const { studentIdList, group_id, text, time } = req.body;

      if (!studentIdList) {
        return next(ApiError.badRequest("student id list yo'q yo'q "));
      }
      if (!group_id) {
        return next(ApiError.badRequest("group idsi yo'q "));
      } else {
        const groupOne = await Groups.findOne({
          where: { id: group_id, status: "active" },
        });
        if (!groupOne) {
          return next(ApiError.badRequest("Bunday group topilmadi"));
        }
      }
      if (!text) {
        return next(ApiError.badRequest("Yuboriladigon text yo'q"));
      } else {
        let inString = typeof text;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }
      if (!time) {
        return next(ApiError.badRequest("Vaqt jo'natilmadi"));
      } else {
        let inString = typeof time;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }
      const messageList = studentIdList.map(async (e) => {
        let student = await Students.findOne({
          where: { status: "active", id: e },
        });

        const validete = (arg) => {
          let length = arg.length;
          let textWith = arg.startsWith("+998");
          let arr = arg.split("");
          let filterSecond = arr.filter((e) => {
            if (e !== "+" && e !== "-" && e !== "(" && e !== ")" && e !== " ") {
              if (
                Number(e) % 1 == 0 ||
                Number(e) % 2 == 0 ||
                Number(e) % 3 == 0 ||
                Number(e) % 4 == 0 ||
                Number(e) % 5 == 0 ||
                Number(e) % 6 == 0 ||
                Number(e) % 7 == 0 ||
                Number(e) % 8 == 0 ||
                Number(e) % 9 == 0 ||
                Number(e) % 0 == 0
              ) {
                return e;
              }
            }
          });

          if (filterSecond.join("").length == 12 && length == 19 && textWith) {
            return true;
          } else {
            return false;
          }
        };
        let pohoneSend = student.fatherPhone ? validete(student.fatherPhone) : validete(student.motherPhone);
        if ((student.fatherPhone || student.motherPhone) && pohoneSend) {
          await Messages.create({
            group_id,
            student_id: student.id,
            message: text,
            time,
            phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
          });
          let messagedData = {
            text: text,
            phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
          }
          return messagedData;
        }
      });

      const messageFuc = async () => {
        const data = await Promise.all(
          messageList.filter(async (e) => {
            if (
              await e !== false &&
              await e !== undefined &&
              await e != null &&
              await e !== "error" &&
              await e
            ) {
              return e;
            }
          })
        );
        return sendMessage(data)
      };
      const messageResult = messageFuc();
      return res.json({ messageResult });
    } catch (error) {
      return next(ApiError.badRequest(`${error},message add list`));
    }
  };
  async messageAllStudentSendMessage(req, res, next) {
    try {
      const { studentIdList, text, time } = req.body;

      if (!studentIdList) {
        return next(ApiError.badRequest("student id list yo'q yo'q "));
      }

      if (!text) {
        return next(ApiError.badRequest("Yuboriladigon text yo'q"));
      } else {
        let inString = typeof text;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }
      if (!time) {
        return next(ApiError.badRequest("Vaqt jo'natilmadi"));
      } else {
        let inString = typeof time;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }
      const messageList = studentIdList.map(async (e) => {
        let student = await Students.findOne({
          where: { status: "active", id: e },
        });

        const validete = (arg) => {
          let length = arg.length;
          let textWith = arg.startsWith("+998");
          let arr = arg.split("");
          let filterSecond = arr.filter((e) => {
            if (e !== "+" && e !== "-" && e !== "(" && e !== ")" && e !== " ") {
              if (
                Number(e) % 1 == 0 ||
                Number(e) % 2 == 0 ||
                Number(e) % 3 == 0 ||
                Number(e) % 4 == 0 ||
                Number(e) % 5 == 0 ||
                Number(e) % 6 == 0 ||
                Number(e) % 7 == 0 ||
                Number(e) % 8 == 0 ||
                Number(e) % 9 == 0 ||
                Number(e) % 0 == 0
              ) {
                return e;
              }
            }
          });

          if (filterSecond.join("").length == 12 && length == 19 && textWith) {
            return true;
          } else {
            return false;
          }
        };
        let pohoneSend = student.fatherPhone ? validete(student.fatherPhone) : validete(student.motherPhone);
        if ((student.fatherPhone || student.motherPhone) && pohoneSend) {
          await Messages.create({
            student_id: student.id,
            message: text,
            time,
            phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
          });
          let messagedData = {
            text: text,
            phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
          }
          return messagedData;
        }
      });
      const messageFuc = async () => {
        const data = await Promise.all(
          messageList.filter(async (e) => {
            if (
              await e !== false &&
              await e !== undefined &&
              await e != null &&
              await e !== "error" &&
              await e
            ) {
              return e;
            }
          })
        );
        return sendMessage(data)
      };
      const messageResult = messageFuc();
      return res.json({ messageResult });
    } catch (error) {
      return next(ApiError.badRequest(`${error},message add list`));
    }
  };
  async messageAddPendingGroup(req, res, next) {
    try {
      const { group_id, text, time } = req.body;

      if (!group_id) {
        return next(ApiError.badRequest("group idsi yo'q "));
      } else {
        const groupOne = await PendingGroups.findOne({
          where: { id: group_id, status: "active" },
        });
        if (!groupOne) {
          return next(ApiError.badRequest("Bunday group topilmadi"));
        }
      }
      if (!text) {
        return next(ApiError.badRequest("Yuboriladigon text yo'q"));
      } else {
        let inString = typeof text;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }
      if (!time) {
        return next(ApiError.badRequest("Vaqt jo'natilmadi"));
      } else {
        let inString = typeof time;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }

      const groupOne = await PendingGroups.findOne({
        where: { id: group_id, status: "active" },
      });

      let messageList = groupOne.students && groupOne.students.length > 0 && groupOne.students.map(async (e) => {
        let student = await StudentPending.findOne({
          where: { status: "active", id: e },
        });
        const validete = (arg) => {
          let length = arg.length;
          let textWith = arg.startsWith("+998");
          let arr = arg.split("");
          let filterSecond = arr.filter((e) => {
            if (e !== "+" && e !== "-" && e !== "(" && e !== ")" && e !== " ") {
              if (
                Number(e) % 1 == 0 ||
                Number(e) % 2 == 0 ||
                Number(e) % 3 == 0 ||
                Number(e) % 4 == 0 ||
                Number(e) % 5 == 0 ||
                Number(e) % 6 == 0 ||
                Number(e) % 7 == 0 ||
                Number(e) % 8 == 0 ||
                Number(e) % 9 == 0 ||
                Number(e) % 0 == 0
              ) {
                return e;
              }
            }
          });

          if (filterSecond.join("").length == 12 && length == 19 && textWith) {
            return true;
          } else {
            return false;
          }
        };

        let pohoneSend = student.fatherPhone ? validete(student.fatherPhone) : validete(student.motherPhone);
        if ((student.fatherPhone || student.motherPhone) && pohoneSend) {
          await Messages.create({
            group_id,
            student_id: student.id,
            message: text,
            time,
            phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
          });
          let messagedData = {
            text: text,
            phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
          };
          return messagedData;
        } else {
          return "error";
        }
      });

      const messageFuc = async () => {
        const data = await Promise.all(messageList.map(async (e) => await e));
        return sendMessage(data);

      };
      const messageResult = messageFuc();
      return res.json({ messageResult });
    } catch (error) {
      return next(ApiError.badRequest(`${error},message add group`));
    }
  };
  async messageAddPendingStudentOne(req, res, next) {
    try {
      const { student_id, text, time } = req.body;

      if (!student_id) {
        return next(ApiError.badRequest("student idsi yo'q "));
      } else {
        const studentOne = await StudentPending.findOne({
          where: { id: student_id },
        });
        if (!studentOne) {
          return next(ApiError.badRequest("Bunday o'quvchi topilmadi"));
        }
      }

      if (!text) {
        return next(ApiError.badRequest("Yuboriladigon text yo'q"));
      } else {
        let inString = typeof text;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      }
      if (!time) {
        return next(ApiError.badRequest("Vaqt jo'natilmadi"));
      } else {
        let inString = typeof time;
        if (inString !== "string") {
          return next(ApiError.badRequest("string emas"));
        }
      };

      const studentOne = await StudentPending.findOne({
        where: { id: student_id, },
      });

      await Messages.create({
        group_id: '',
        student_id: studentOne.id,
        message: text,
        time,
        phone: studentOne.fatherPhone ? studentOne.fatherPhone : studentOne.motherPhone
      });

      const data = [{
        text,
        phone: studentOne.fatherPhone ? studentOne.fatherPhone : studentOne.motherPhone
      }]

      const messageResult = sendMessage(data);
      return res.json({ messageResult });


    } catch (error) {
      return next(ApiError.badRequest(`${error},message add one`));
    }
  };
  async messageGet(req, res, next) {
    try {
      const message = await Messages.findAll();
      const student = await sequelize.query(`SELECT * FROM Students WHERE status='active' OR status='pending'`);

      const groups = await Groups.findAll({
        where: {
          status: 'active'
        }
      });

      const pendingGroups = await PendingGroups.findAll({
        where: {
          status: 'active'
        }
      });
      const studentPending = await StudentPending.findAll({
        where: {
          status: 'active'
        }
      });

      const data = message && student && message.map((el) => {
        const studentOne = student[0].find((e) => e.id == el.student_id);
        const pendingStudentOne = studentPending.find((e) => e.id == el.student_id);
        const groupOne = el.group_id && groups.find((e) => e.id == el.group_id);
        const pendingGroupOne = el.group_id && pendingGroups.find((e) => e.id == el.group_id);
        if (studentOne) {
          return {
            id: el.id,
            student: studentOne && studentOne.firstname + ' ' + studentOne.lastname,
            groupName: groupOne ? groupOne.name : 'Belgilanmagan',
            createdAt: el.createdAt,
            messageText: el.message,
            time: el.time,
            phone: el.phone
          }
        } else if (pendingStudentOne) {
          return {
            id: el.id,
            student: pendingStudentOne.firstname + ' ' + pendingStudentOne.lastname,
            groupName: pendingGroupOne ? pendingGroupOne.name : 'Belgilanmagan',
            createdAt: el.createdAt,
            messageText: el.message,
            time: el.time,
            phone: el.phone
          }
        }
      }).filter((e) => e && e)
        .sort(function (a, b) {
          return b.createdAt - a.createdAt;
        });

      res.json(data);
    } catch (error) {
      return next(ApiError.badRequest(`${error},message get`));
    }
  };

  async messageDelete() {
    try {

     await sequelize.query(`DELETE FROM messages
      WHERE "createdAt" < now() - interval '1 week';`);
      return 'sms delete'
    } catch (error) {
      console.log(error);
    }
  }

}

module.exports = new MessagesController();
