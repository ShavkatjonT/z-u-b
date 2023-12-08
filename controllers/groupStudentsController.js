const ApiError = require("../error/ApiError");
const { GroupStudents, Groups, Students, GroupSchedule,  } = require("../models/models");
const groupStudentCreate = require('./groupStudentCreate');
const groupStudentsExport = require('./groupStudentExport');
const validateFun = require("./validateFun");
const CountWeekdays = require("./countWeekdays");

class groupStudentsController {
  async groupStudentsAdd(req, res, next) {
    try {
      const { student_id, group_id, summa } = req.body;

      if (!student_id) {
        return next(ApiError.badRequest("student idsi yo'q "));
      } else {
        const studentOne = await Students.findOne({
          where: { id: student_id, status: "active" },
        });
        if (!studentOne) {
          return next(ApiError.badRequest("Bunday o'quvchi topilmadi"));
        }
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

      const groups = await Groups.findOne({
        where: { status: "active", id: group_id },
      });
      const candidate = await GroupStudents.findOne({
        where: { status: "active", student_id, group_id },
      });
      if (candidate) {
        return next(ApiError.badRequest(`Gruhda shunday  o'quvch bor`));
      }
      if (!groups) {
        return next(ApiError.badRequest(`Group topilmadi`));
      }
      groups.count_students = String(Number(groups.count_students) + 1);
      const groupCount = await groups.save();
      const groupStudents = await GroupStudents.create({
        student_id,
        group_id,
        month_payment: summa ? summa : 0

      });

      
      const day = new Date().getDate();
      const groupStudentCreateRes = await groupStudentCreate({ student_id, group_id, day, summa });

      res.json({ groupStudents, groupCount, groupStudentCreateRes });
    } catch (error) {
      return next(ApiError.badRequest(`${error} , groupStudents add`));
    }
  }
  async groupStudentsDelete(req, res, next) {
    try {
      const { id } = req.params;
      if (!validateFun.isValidUUID(id)) {
        return next(ApiError.badRequest("The data was entered incorrectly"));
      }
      const groupStudentsById = await GroupStudents.findOne({ where: { id } });
      if (!groupStudentsById) {
        return next(
          ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`)
        );
      }
      groupStudentsById.status = "inactive";
      const groupStudentsDeletes = await groupStudentsById.save();
      if (!groupStudentsDeletes) {
        return next(
          ApiError.badRequest(
            `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
          )
        );
      }
      res.json({ groupStudentsDeletes });
    } catch (error) {
      return next(ApiError.badRequest(`${error}, groupStudents delete`));
    }
  }
  async groupStudentsPut(req, res, next) {
    try {
      const { id } = req.params;
      if (!validateFun.isValidUUID(id)) {
        return next(ApiError.badRequest("The data was entered incorrectly"));
      }
      const { student_id, group_id } = req.body;
      const groupStudentsById = await GroupStudents.findOne({ where: { id } });

      if (!groupStudentsById) {
        return next(ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`));
      }
      if (student_id) groupStudentsById.student_id = student_id;
      if (group_id) groupStudentsById.group_id = group_id;

      const groupStudentsUpdate = await groupStudentsById.save();
      if (!groupStudentsUpdate) {
        return next(
          ApiError.badRequest(
            `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
          )
        );
      }
      res.json({ groupStudentsUpdate });
    } catch (error) {
      return next(ApiError.badRequest(`${error}, groupStudents put`));
    }
  }
  async groupStudentsPutSumma(req, res, next) {
    try {
      const { id, summa } = req.body;
      const groupStudentsById = await GroupStudents.findOne({ where: { id } });

      if (!groupStudentsById) {
        return next(ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`));
      }
      if (summa) groupStudentsById.month_payment = summa
      const groupStudentsUpdate = await groupStudentsById.save();
      if (!groupStudentsUpdate) {
        return next(
          ApiError.badRequest(
            `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
          )
        );
      }
      res.json({ groupStudentsUpdate });
    } catch (error) {
      return next(ApiError.badRequest(`${error}, groupStudents put`));
    }
  }
  async groupStudentsGet(req, res, next) {
    try {
      const groupStudents = await GroupStudents.findAll({
        where: { status: "active" },
      });
      res.json(groupStudents);
    } catch (error) {
      return next(ApiError.badRequest(`${error}, groupStudents get`));
    }
  }

  async groupStudentsExportNewGroup(req, res, next) {
    try {
      const { exitGroup_id, newGroup_id, student_id, group_student_id, summa, } = req.body;

      if (!student_id || !validateFun.isValidUUID(student_id)) {
        return next(ApiError.badRequest("student_id not found "));
      } else {
        const studentOne = await Students.findOne({
          where: { id: student_id, status: "active" },
        });
        if (!studentOne) {
          return next(ApiError.badRequest("No such student found"));
        }
      }
      if (!exitGroup_id || !validateFun.isValidUUID(exitGroup_id)) {
        return next(ApiError.badRequest("exitGroup_id not found "));
      } else {
        const groupOne = await Groups.findOne({
          where: { id: exitGroup_id, status: "active" },
        });
        if (!groupOne) {
          return next(ApiError.badRequest("No such exporting group was found"));
        }
      }

      if (!group_student_id || !validateFun.isValidUUID(group_student_id)) {
        return next(ApiError.badRequest("group_student_id not found "));
      }

      const group_student_old = await GroupStudents.findOne({
        where: {
          group_id: exitGroup_id,
          status: 'active',
          student_id: student_id,
        }
      });

      if (!group_student_old) {
        return next(
          ApiError.badRequest("Bu o'quvchi guruhdan topilmadi")
        )
      }

      if (group_student_id != group_student_old.id) {
        return next(
          ApiError.badRequest("Bu o'quvchi guruhdan topilmadi")
        )
      }


      if (!newGroup_id || !validateFun.isValidUUID(newGroup_id)) {
        return next(ApiError.badRequest("newGroup_id not found "));
      } else {
        const groupOne = await Groups.findOne({
          where: { id: newGroup_id, status: "active" },
        });
        if (!groupOne) {
          return next(ApiError.badRequest("No such importing group was found"));
        }
      }

      const groupStudent = await GroupStudents.findOne({
        where: {
          group_id: newGroup_id,
          status: 'active',
          student_id: student_id,
        }
      });

      if (groupStudent) {
        return next(
          ApiError.badRequest("Bu o'quvchi ko'chirilishi kerak bo'lgan guruhda mavjud")
        )
      }

      if (summa < 0) {
        return next(ApiError.badRequest("Enter the correct value in the amount"));
      }
      const newGroupStudent = await GroupStudents.create({
        student_id,
        group_id: newGroup_id,
        month_payment: summa ? summa : 0

      });
      await groupStudentsExport({ exitGroup_id, newGroup_id, student_id, group_student_id, summa, newGroupStudent_id: newGroupStudent.id })



      return res.send('expor student')
    } catch (error) {
      return next(ApiError.badRequest(`${error}, groupStudents export`));
    }
  }

}

module.exports = new groupStudentsController();
