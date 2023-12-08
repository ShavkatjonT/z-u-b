const ApiError = require("../error/ApiError");
const {
  Students,
  Groups,
  GroupStudents,
  Debtors,
  Payments,
  Sciences,
  DTMColumns,
  LessonGroup,
  TeacherGroups,
  TeacherStatistics,
  Teachers
} = require("../models/models");
const sequelize = require("../db");
const CountWeekdays = require('./countWeekdays');
const sendMessage = require('./sendMessageController');
const validateFun = require("./validateFun");
function removeDuplicateNames(arr) {
  if (!Array.isArray(arr)) {
    throw new Error("Input is not an array.");
  }

  const uniqueNames = {};
  const result = [];

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];

    // Skip null or non-object elements
    if (!item || typeof item !== "object") {
      continue;
    }

    const name = item.name;

    // Add the item to the result array if its name is not encountered before
    if (!uniqueNames[name]) {
      uniqueNames[name] = true;
      result.push(item);
    }
  }

  return result;
}
class StudentController {
  async studentAdd(req, res, next) {
    try {
      const {
        firstname,
        gender,
        birthday,
        lastname,
        fathername,
        address,
        fatherPhone,
        motherPhone,
        studentPendingId,
        sciences,
        classStudentdent,
        group_id
      } = req.body;

      if (sciences) {
        if (sciences.length > 5)
          return next(
            ApiError.badRequest("Fan malumolarni o'zgartiring")
          )
      }

      if (!group_id || !validateFun.isValidUUID(group_id)) {
        return next(ApiError.badRequest(
          'Data is incomplete'
        ))
      }

      const group = await Groups.findOne({
        where: {
          status: 'active',
          id: group_id
        }
      });

      if (!group) {
        return next(ApiError.badRequest(
          'No data found'
        ))
      }


      const dtmcolumns = sciences && await DTMColumns.create({
        name: 'DTM Fanlar',
        items: sciences,
        order: 1
      })

      let student;
      if (studentPendingId && validateFun.isValidUUID(studentPendingId)) {
        student = await Students.findOne({ where: { id: studentPendingId } });
        if (!student) {
          return next(ApiError.badRequest("Bunday o'quvchi topilmadi"));
        }
        student.status = "active";
        const data = [{
          text: `Farzandingiz ${student.firstname + ' ' + student.lastname} ${group.name} guruhiga qo'shildi. ZUKKO INM`,
          phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
        }]
        const messageResult = sendMessage(data);
        const studentOne = await student.save();
        return res.json({ studentOne });
      } else if (
        firstname &&
        gender &&
        birthday &&
        lastname &&
        address &&
        fatherPhone
      ) {
        student = await Students.create({
          firstname: firstname,
          gender: gender,
          birthday: birthday,
          lastname: lastname,
          fathername: fathername,
          address: address,
          fatherPhone: fatherPhone,
          motherPhone: motherPhone,
          science: sciences,
          class: classStudentdent,
          dtmcolumns_id: dtmcolumns && dtmcolumns.id
        });

        const data = [{
          text: `Farzandingiz ${student.firstname + ' ' + student.lastname} ${group.name} guruhiga qo'shildi. ZUKKO INM`,
          phone: student.fatherPhone ? student.fatherPhone : student.motherPhone
        }]
        const messageResult = sendMessage(data);
        return res.json({ student, dtmcolumns });
      } else {
        return next(ApiError.badRequest("Data is incomplete"));
      }
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }

  async studentDelete(req, res, next) {
    try {
      const { id } = req.params;
      if (!validateFun.isValidUUID(id)) {
        return next(ApiError.badRequest("The data was entered incorrectly"));
      }
      const { group_id } = req.body;
      if (!group_id && !validateFun.isValidUUID(group_id)) {
        return next(ApiError.badRequest("You entered the data incorrectly"));
      }
      const findPersonById = await Students.findOne({ where: { id } });
      const groups = await Groups.findOne({
        where: { status: "active", id: group_id },
      });
      const groupStudentDelete = await GroupStudents.update(
        { status: "inactive" },
        {
          where: { status: "active", student_id: id, group_id: group_id },
        }
      );
      if (!findPersonById) {
        return next(
          ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`)
        );
      }
      if (!groupStudentDelete) {
        return next(
          ApiError.badRequest("student id yoki group id yuborilmadi")
        );
      }

      const group = await Groups.findOne({
        where: {
          status: 'active',
          id: group_id
        }
      });

      const data = [{
        text: `Farzandingiz ${findPersonById.firstname + ' ' + findPersonById.lastname} ${group.name} guruhidan  chetlashtirildi. ZUKKO INM`,
        phone: findPersonById.fatherPhone ? findPersonById.fatherPhone : findPersonById.motherPhone
      }]
      const messageResult = sendMessage(data);

      const day = new Date().getDate();
      const monthOne = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;
      const debtors = await Debtors.findOne({
        where: {
          status: 'active',
          group_id,
          student_id: id,
          month: currentMonth
        }
      });

      const lessonGroupOne = await LessonGroup.findOne({
        where: {
          group_id,
          status: "active",
        },
      });

      const weekDay = lessonGroupOne && lessonGroupOne.lesson_day
        .split(",")
        .map((e) => Number(e))


      if (debtors) {
        const date = new Date(debtors.createdAt).getDate()
        const lessonDay = CountWeekdays.countWeekdaysInMonth(monthOne, year, weekDay);
        const lessonLastDay = CountWeekdays.countWeekdaysInRange(date, day, weekDay);
        const amountSum = Math.trunc((lessonLastDay * debtors.all_summa) / lessonDay);
        const paySumm = (debtors.all_summa - debtors.amount) - amountSum
        if (paySumm >= 0) {
          debtors.status = 'inactive'
        } else if (paySumm < 0) {
          debtors.amount = Math.abs(paySumm)
        }
        await debtors.save()
      }
      groups.count_students = String(Number(groups.count_students) - 1);
      const groupCount = await groups.save();

      const group_student = await GroupStudents.findAll({
        where: {
          status: "active",
          student_id: id,
        },
      });
      if (group_student.length == 0) {
        findPersonById.status = "pending";
      }

      const teacherGroup = await TeacherGroups.findOne({
        where: {
          status: 'active',
          group_id: group_id
        }
      });


      const teacher = teacherGroup && await Teachers.findOne({
        where: {
          status: 'active',
          id: teacherGroup.teacher_id
        }
      });

      await TeacherStatistics.create({
        group_id: group_id,
        student_id: id,
        student_status: 'delete',
        student_count: groups.count_students,
        teacher_id: teacher ? teacher.id : ''
      });

      const studentSave = await findPersonById.save();
      res.json({ groupStudentDelete, groupCount, studentSave });
    } catch (error) {
      console.log(273, error.stack);
      return next(ApiError.badRequest(error));
    }
  }

  async studentOneDelete(req, res, next) {
    1
    try {
      const { id } = req.params;
      if (!validateFun.isValidUUID(id)) {
        return next(ApiError.badRequest("The data was entered incorrectly"));
      }
      const findPersonById = await Students.findOne({ where: { id } });

      const groups = await Groups.findAll({
        where: { status: "active" },
      });
      const groupStudents = await GroupStudents.findAll({
        where: { status: "active", student_id: id },
      });
      if (!findPersonById) {
        return next(
          ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`)
        );
      }
      groupStudents.forEach((e) => {
        groups.find((el) => {
          if (e.group_id == el.id) {
            el.update({
              count_students: String(Number(el.count_students) - 1),
            });
          }
          e.update({ status: "inactive" });
        });
      });

      for (const data of groupStudents) {
        const day = new Date().getDate();
        const monthOne = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;
        const debtors = await Debtors.findOne({
          where: {
            status: 'active',
            group_id: data.group_id,
            student_id: id,
            month: currentMonth
          }
        });

        const lessonGroupOne = await LessonGroup.findOne({
          where: {
            group_id: data.group_id,
            status: "active",
          },
        });

        const weekDay = lessonGroupOne && lessonGroupOne.lesson_day
          .split(",")
          .map((e) => Number(e))
        if (debtors) {
          const date = new Date(debtors.createdAt).getDate()
          const lessonDay = CountWeekdays.countWeekdaysInMonth(monthOne, year, weekDay);
          const lessonLastDay = CountWeekdays.countWeekdaysInRange(date, day, weekDay);
          const amountSum = Math.trunc((lessonLastDay * debtors.all_summa) / lessonDay);
          const paySumm = (debtors.all_summa - debtors.amount) - amountSum
          if (paySumm >= 0) {
            debtors.status = 'inactive'
          } else if (paySumm < 0) {
            debtors.amount = Math.abs(paySumm)
          }
          await debtors.save()
        }

        const teacherGroup = await TeacherGroups.findOne({
          where: {
            status: 'active',
            group_id: data.id
          }
        });


        const teacher = teacherGroup && await Teachers.findOne({
          where: {
            status: 'active',
            id: teacherGroup.teacher_id
          }
        });

        await TeacherStatistics.create({
          group_id: data.id,
          student_id: id,
          student_status: 'delete',
          student_count: data.count_students,
          teacher_id: teacher ? teacher.id : ''
        });

      }

      if (!groupStudents) {
        return next(
          ApiError.badRequest(`Ushbu malimotlarni o'gartirib bo'lmadi`)
        );
      }
      findPersonById.status = "inactive";
      const studentDeletes = await findPersonById.save();
      if (!studentDeletes) {
        return next(
          ApiError.badRequest(
            `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
          )
        );
      }
      res.json({ studentDeletes, groupStudents });
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }

  async studentPut(req, res, next) {
    try {
      const { id } = req.params;
      if (!validateFun.isValidUUID(id)) {
        return next(ApiError.badRequest("The data was entered incorrectly"));
      }
      const {
        firstname,
        gender,
        birthday,
        lastname,
        fathername,
        address,
        fatherPhone,
        motherPhone,
        sciences,
        classStudentdent
      } = req.body;

      const findPersonById = await Students.findOne({ where: { id } });

      if (!findPersonById) {
        return next(ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`));
      }

      if (firstname) findPersonById.firstname = firstname;
      if (gender) findPersonById.gender = gender;
      if (birthday) findPersonById.birthday = birthday;
      if (lastname) findPersonById.lastname = lastname;
      if (fathername) findPersonById.fathername = fathername;
      if (address) findPersonById.address = address;
      if (fatherPhone) findPersonById.fatherPhone = fatherPhone;
      if (motherPhone) findPersonById.motherPhone = motherPhone;
      if (sciences) findPersonById.science = [...[], []];
      await findPersonById.save();
      if (sciences) findPersonById.science = sciences
      if (classStudentdent) findPersonById.class = classStudentdent
      const DTMDelete = findPersonById.dtmcolumns_id && await DTMColumns.findOne({
        where: {
          status: 'active',
          id: findPersonById.dtmcolumns_id
        }
      });
      let createDTM;
      if (DTMDelete && sciences) {
        DTMDelete.status = 'inactive';
        await DTMDelete.save();
        createDTM = await DTMColumns.create({
          name: 'DTM Fanlar',
          items: sciences,
          order: 1
        });
      }

      if (!DTMDelete && sciences) {
        createDTM = await DTMColumns.create({
          name: 'DTM Fanlar',
          items: sciences,
          order: 1
        });
      }

      findPersonById.dtmcolumns_id = createDTM && createDTM.id
      const studentUpdate = await findPersonById.save();
      if (!studentUpdate) {
        return next(
          ApiError.badRequest(
            `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
          )
        );
      }


      res.json({ studentUpdate });
    } catch (error) {
      console.log(243, error);
      return next(ApiError.badRequest(error));
    }
  }

  async studentGet(req, res, next) {
    try {
      const student = await Students.findAll({
        where: { status: "active" },
      });
      const data = student && student.sort((a, b) => a.firstname.localeCompare(b.firstname));
      res.json(data);
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }

  async studentGetOne(req, res, next) {
    try {
      const { id } = req.params;
      if (!validateFun.isValidUUID(id)) {
        return next(ApiError.badRequest("The data was entered incorrectly"));
      }
      const groupStudent = await GroupStudents.findAll({
        where: {
          // status: "active",
          student_id: id,
        },
      });
      const sciences = await Sciences.findAll({
        where: { status: "active" },
      });
      const payments = await Payments.findAll({
        where: {
          status: "active",
        },
      });
      const group = await Groups.findAll({
        where: {
          status: "active",
        },
      });
      const student = await Students.findOne({
        where: { id, status: "active" },
      });
      const dtmColumns = student.dtmcolumns_id && await DTMColumns.findOne({
        where: {
          status: 'active',
          id: student.dtmcolumns_id
        }
      });



      let groupListOne = [];
      groupStudent.map((el) => {
        let groupOne = group.find((e) => e.id == el.group_id);
        let data = groupOne && {
          wallet: el.wallet,
          name: groupOne.name,
        };
        return groupListOne.push(data);
      });

      let paymentList = [];
      payments &&
        groupStudent.forEach((el) => {
          let paymentOne = payments.filter((e) => e.group_student_id === el.id);
          paymentOne &&
            paymentOne.map((e) => {
              let data = {
                updatedAt: e.updatedAt,
                createdAt: e.createdAt,
                sale: e.sale,
                amount: e.amount,
              };
              return paymentList.push(data);
            });
          return;
        });



      const sciencesData = dtmColumns && dtmColumns.items && dtmColumns.items.map((el) => {
        const scienceOne = sciences.find((e) => e.id == el);
        return {
          id: scienceOne.id,
          name: scienceOne.name
        }
      });

      const columns = sciencesData && dtmColumns && dtmColumns.items && {
        id: dtmColumns.id,
        name: dtmColumns.name,
        items: sciencesData
      }
      let studentList = {
        firstname: student.firstname,
        lastname: student.lastname,
        fathername: student.fathername,
        gender: student.gender,
        birthday: student.birthday,
        address: student.address,
        fatherPhone: student.fatherPhone,
        motherPhone: student.motherPhone,
        group: groupListOne && removeDuplicateNames(groupListOne),
        paymentList: paymentList && paymentList,
        class: student.class,
        sciences: sciencesData && sciencesData.length > 0 ? sciencesData : [],
        dtm_columns: columns && columns,
        rating: student.rating,
        blacklist_id: student.blacklist_id ? student.blacklist_id : []
      };

      res.json(studentList);
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }

  async studentGetList(req, res, next) {
    try {
      const groups = await Groups.findAll({ where: { status: "active" } });
      const groupStudents = await GroupStudents.findAll({
        where: { status: "active" },
      });
      const sciences = await Sciences.findAll({
        where: { status: "active" },
      });
      const students = await Students.findAll({
        where: { status: "active" },
      });

      const studentSort = students && students.sort((a, b) => a.firstname.localeCompare(b.firstname));

      const studentList =
        groups &&
        studentSort &&
        groupStudents &&
        studentSort.map((el) => {
          const groupFilter = groupStudents.filter(
            (e) => e.student_id == el.id
          );
          const groupName = groups.map((e) => {
            const data = groupFilter.find((v) => v.group_id == e.id);
            if (data) {
              return {
                id: e.id,
                name: e.name,
                month_payment: data.month_payment,

              }
            }

          }).filter((el) => el && el);

          const sciencesData = el && el.science && el.science.map((el) => {
            const scienceOne = sciences.find((e) => e.id == el);
            return scienceOne && {
              id: scienceOne.id,
              name: scienceOne.name
            }
          }).filter((e) => e && e)
          const data = {
            id: el.id,
            firstname: el.firstname,
            lastname: el.lastname,
            Fphone: el.fatherPhone,
            address: el.address,
            Mphone: el.motherPhone,
            class: el.class,
            groups: groupName,
            sciences: sciencesData && sciencesData.length > 0 ? sciencesData : []
          };
          return data;
        });

      const studentFuc = async () => {
        const data = await Promise.all(studentList.map(async (e) => await e));
        return res.json(data);
      };
      const studentResult = studentFuc();
      return studentResult;
    } catch (error) {
      console.log(482, error.stack);
      return next(ApiError.badRequest(error));
    }
  }

  async studentGroupGetList(req, res, next) {
    try {
      const { group_id } = req.params;
      if (!validateFun.isValidUUID(group_id)) {
        return next(ApiError.badRequest("The data was entered incorrectly"));
      }
      const monthOne = new Date().getMonth() + 1;
      const month =
        new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + "" + monthOne;

      const groups = await Groups.findOne({
        where: { status: "active", id: group_id },
      });
      const groupStudent = await GroupStudents.findAll({
        where: { status: "active", group_id: group_id },
      });
      const sciences = await Sciences.findAll({
        where: { status: "active" },
      });
      const student = await Students.findAll({
        where: { status: "active" },
      });
      const debtor = await Debtors.findAll({
        where: {
          status: "active",
          month: month,
          group_id,
        },
      });

      const sudentSort = student && student.sort((a, b) => a.firstname.localeCompare(b.firstname))
      const studentList =
        groupStudent &&
        groups &&
        sudentSort &&
        sudentSort.map((students) => {
          const group_student = groupStudent.find(
            (e) => e.student_id == students.id
          );
          const sciencesData = students.science && students.science.map((el) => {
            const scienceOne = sciences.find((e) => e.id == el);
            return {
              id: scienceOne && scienceOne.id && scienceOne.id,
              name: scienceOne && scienceOne.name && scienceOne.name
            }
          })

          const debtorOne = debtor.find((e) => e.student_id == students.id);

          if (group_student) {
            return {
              id: students.id,
              name: students.firstname + " " + students.lastname,
              phone: students.fatherPhone
                ? students.fatherPhone
                : students.motherPhone,
              gender: students.gender,
              class: students.class,
              group_id: group_id,
              monthPay: debtorOne
                ? false
                : group_student.wallet < 0
                  ? false
                  : true,
              month_payment: group_student.month_payment,
              group_student_id: group_student.id,
              groupAllSum: groups.month_payment,
              createdAt: group_student.createdAt,
              science: sciencesData && sciencesData.length > 0 ? sciencesData : []
            };
          }
        });

      const isStudentList = studentList.filter((e) => e && e);

      const studentFuc = async () => {
        const data = await Promise.all(isStudentList.map(async (e) => await e));
        return res.json(data);
      };
      const studentResult = studentFuc();
      return studentResult;
    } catch (error) {
      console.log(441, error.stack);
      return next(ApiError.badRequest(error));
    }
  }

  async studentGetListSearch(req, res, next) {
    try {
      const filters = req.query;

      const groups = await Groups.findAll({ where: { status: "active" } });

      const groupStudents = await GroupStudents.findAll({
        where: { status: "active" },
      });
      const students = await Students.findAll({
        where: { status: "active" },
      });

      const studentFilter = filters.text
        ? students.filter((student) => {
          const name = student.firstname.toLowerCase() + ' ' + student.lastname.toLowerCase();
          const searchText = filters.text.toLowerCase();
          return name.includes(searchText);
        })
        : students;


      const studentList =
        groups &&
        students &&
        groupStudents &&
        studentFilter.map((el) => {
          const groupFilter = groupStudents.filter(
            (e) => e.student_id == el.id
          );
          const groupName = groups.map((e) => {
            const data = groupFilter.find((v) => v.group_id == e.id);
            if (data) {
              return {
                id: e.id,
                name: e.name,
                month_payment: data.month_payment,
              }
            }
          }).filter((el) => el && el)
          const data = {
            id: el.id,
            firstname: el.firstname,
            lastname: el.lastname,
            Fphone: el.fatherPhone,
            address: el.address,
            Mphone: el.motherPhone,
            groups: groupName,
            class: el.class,
          };
          return data;
        });
      const studentFuc = async () => {
        const data = await Promise.all(studentList.map(async (e) => await e));
        return res.json(data);
      };
      const studentResult = studentFuc();
      return studentResult;
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }

  async studentAllSendMessage(req, res, next) {
    try {
      const { text } = req.body;
      if (!text || text.length > 160) {
        return next(
          ApiError.badRequest('Please re-enter the text')
        )
      }
      const query = `SELECT * FROM public.students`;
      const data = await sequelize.query(query);
      const sendText = text;
      const sendData = data && data.length > 0 && data[0].length > 0 && data[0].map((el) => {
        return el?.fatherPhone && {
          text: sendText,
          phone: el?.fatherPhone
        }
      }).filter((el) => el && el);

      const sendM = [
        {
          text: sendText,
          phone: '+998 (90) 562-93-05'
        }
      ];

      // await sendMessage(sendM);
      // console.log(736, sendData.length);

      await sendMessage(sendData);

      res.send('send message ' + ' ' + sendData.length);
    } catch (error) {
      return next(ApiError.badRequest(
        error
      ))
    }
  }

}

module.exports = new StudentController();
