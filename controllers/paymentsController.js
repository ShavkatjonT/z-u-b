const ApiError = require("../error/ApiError");
const {
    Payments,
    Students,
    Groups,
    TeacherGroups,
    Teachers,
    GroupStudents,
} = require("../models/models");
const paymentDelete = require("./paymentDelete");
const paymentCreate = require("./paymentCreate");
const dateFormat = require('date-and-time')
const sequelize = require("../db");
const { Op } = require('sequelize');
const validateFun = require("./validateFun");
class PaymentsController {
    async paymentAdd(req, res, next) {
        try {
            const { student_id, group_id, given_summa, sale } = req.body;
            const update = false;

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

            if ((!given_summa && !sale) || (given_summa == 0 && sale == 0)) {
                return next(ApiError.badRequest("to'lov qilingan suma yo'q "));
            } else {
                let inNumber = typeof given_summa;
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("Summani raqamda kiriting"));
                }
                if (given_summa > 10000000) {
                    return next(
                        ApiError.badRequest(
                            "Berilban summa yuzmiliondan kop summani kamaytiring"
                        )
                    );
                }
            }
            let inNumber = sale && typeof sale;

            if (sale) {
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("Summani raqamda kiriting"));
                }
            }
            const paymentFun = await paymentCreate({
                student_id,
                group_id,
                given_summa,
                sale,
                update,
            });

            return res.json(paymentFun);
        } catch (error) {
            return next(ApiError.badRequest(`${error} : paymet add`));
        }
    }
    async paymentDelete(req, res, next) {
        try {
            const { id } = req.body;
            const paymentDeleteFun = await paymentDelete(id);
            res.json({ paymentDeleteFun });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async paymentPut(req, res, next) {
        try {
            const { id, student_id, group_id, given_summa, sale } = req.body;
            const update = true;
            const paymentDeleteFun = await paymentDelete(id);
            const paymentCreateFun = await paymentCreate({
                student_id,
                group_id,
                given_summa,
                sale,
                update,
            });
            res.json({ paymentDeleteFun, paymentCreateFun });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async paymentGet(req, res, next) {
        try {
            const { startDate, endDate } = req.body;

            if ((!startDate || !endDate) || (!validateFun.isToday_2(startDate) || !validateFun.isToday_2(endDate)) || !validateFun.toCompare(startDate, endDate)) {
                return next(
                    ApiError.badRequest('An invalid value was entered in date')
                );
            }

            const query = {
                where: {
                    status: 'active',
                    createdAt: {
                        [Op.gte]: `${startDate} 00:01:01`,
                        [Op.lte]: `${endDate} 23:59:00`
                    }
                }
            };

            const date = new Date();
            const payments = await Payments.findAll(query);
            const groupStudent = await GroupStudents.findAll();
            const students = await Students.findAll();
            const groups = await Groups.findAll();
            const paymentList =
                payments &&
                students &&
                groupStudent &&
                payments.map((el) => {
                    const groupStudentOne = groupStudent.find(
                        (e) => e.id == el.group_student_id
                    );
                    const studentOne = groupStudentOne && students.find(
                        (e) => e.id == groupStudentOne.student_id
                    );
                    const groupOne = groupStudentOne && groups.find((e) => e.id == groupStudentOne.group_id);
                    const data = studentOne &&
                        groupOne && {
                        id: el.id,
                        group: {
                            id: groupOne.id && groupOne.id,
                            name: groupOne.name,
                        },

                        student: {
                            id: studentOne.id,
                            name: studentOne.firstname + " " + studentOne.lastname,
                            lastname: studentOne.lastname,
                            firstname: studentOne.firstname
                        },
                        sale: el.sale ? el.sale : 0,
                        // month: monthFun(el.month),
                        summa: el.amount,
                        createdAt: el.createdAt,
                        updatedAt: el.createdAt,
                        deleteActive:
                            Math.trunc((date - el.createdAt) / 3600000) <= 24
                                ? true
                                : false,
                    };
                    return data;
                });


            const filterTime = (e) => {
                const timeDate = String(e);
                const filterYear = timeDate.substring(0, 24);
                return filterYear;
            };


            const paymentFilter = paymentList.filter((e) => e && e);
            const paymentSort = paymentFilter.sort(function (a, b) {
                return b.createdAt - a.createdAt;
            });
            const excelData = paymentSort.map((el) => {
                const data = {
                    Ism: el.student.firstname,
                    Familya: el.student.lastname,
                    Summa: el.summa,
                    Chegirma: el.sale ? el.sale : 0,
                    "Yaratilgan vaqt": filterTime(el.createdAt),
                };
                return data
            });

            res.json({ paymentSort, excelData });
        } catch (error) {
            console.log(error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async paymentExcelData(req, res, next) {
        try {
            const date = new Date();
            const { startDate, endDate } = req.body;
            if ((!startDate || !endDate) || (!validateFun.isToday_2(startDate) || !validateFun.isToday_2(endDate)) || !validateFun.toCompare(startDate, endDate)) {
                return next(
                    ApiError.badRequest('An invalid value was entered in date')
                );
            }
            const query = {
                where: {
                    status: 'active',
                    createdAt: {
                        [Op.gte]: `${startDate} 00:01:01`,
                        [Op.lte]: `${endDate} 23:59:00`
                    }
                }
            };
            const payments = await Payments.findAll(query);
            const teacherGroup = await TeacherGroups.findAll({
                where: {
                    status: 'active'
                }
            });
            const teacher = await Teachers.findAll({
                where: {
                    status: 'active'
                }
            });
            const groupStudent = await GroupStudents.findAll();
            const students = await Students.findAll();
            const groups = await Groups.findAll();
            const paymentList =
                payments &&
                groupStudent &&
                payments.map((el) => {
                    const groupStudentOne = groupStudent.find(
                        (e) => e.id == el.group_student_id
                    );

                    const teacherGroupOne = teacherGroup.find((e) =>
                        e.group_id == groupStudentOne.group_id
                    );

                    const teacherOne = teacherGroupOne && teacher.find((e) =>
                        teacherGroupOne.teacher_id == e.id
                    )

                    const studentOne = students.find(
                        (e) => e.id == groupStudentOne.student_id
                    );

                    const groupOne = groups.find((e) => e.id == groupStudentOne.group_id);
                    const data = studentOne &&
                        groupOne && {
                        id: el.id,
                        group: {
                            id: groupOne.id && groupOne.id,
                            name: groupOne.name,
                        },
                        teacher: teacherOne && {
                            name: teacherOne.firstname + " " + teacherOne.lastname
                        },
                        student: {
                            id: studentOne.id,
                            name: studentOne.firstname + " " + studentOne.lastname,
                            lastname: studentOne.lastname,
                            firstname: studentOne.firstname
                        },
                        sale: el.sale ? el.sale : 0,
                        summa: el.amount,
                        createdAt: el.createdAt,
                        updatedAt: el.createdAt,
                    };
                    return data;
                });
            const filterTime = (e) => {
                const timeDate = String(e);
                const filterYear = timeDate.substring(0, 24);
                return filterYear;
            };


            const paymentFilter = paymentList.filter((e) => e && e);

            const paymentSort = paymentFilter.sort(function (a, b) {
                return b.createdAt - a.createdAt;
            });

            const excelData = paymentSort.map((el) => {
                const data = {
                    Ism: el.student.firstname,
                    Familya: el.student.lastname,
                    Guruh: el.group.name,
                    "O'qtuchi": el.teacher && el.teacher.name,
                    Summa: el.summa,
                    Chegirma: el.sale ? el.sale : 0,
                    "Yaratilgan vaqt": filterTime(el.createdAt),
                };
                return data
            });


            let a = 0
            excelData.forEach((el) => {
                a = a + el.Summa
            });
            console.log(343, a);

            res.json(excelData);
        } catch (error) {
            console.log(341, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async paymentChartGet(req, res, next) {
        try {

            const date = new Date();
            const payments = await Payments.findAll({
                where: { status: "active" },
            });
            const monthTextFun = (arr) => {
                const monthText = arr.substring(5);
                const years = arr.substring(0, 4);
                let monthPay;
                switch (monthText) {
                    case "01":
                        monthPay = "Yanvar";
                        break;
                    case "02":
                        monthPay = "Fevral";
                        break;
                    case "03":
                        monthPay = "Mart";
                        break;
                    case "04":
                        monthPay = "Aprel";
                        break;
                    case "05":
                        monthPay = "May";
                        break;
                    case "06":
                        monthPay = "Iyun";
                        break;
                    case "07":
                        monthPay = "Iyul";
                        break;
                    case "08":
                        monthPay = "Avgust";
                        break;
                    case "09":
                        monthPay = "Sentabr";
                        break;
                    case "10":
                        monthPay = "Oktabr";
                        break;
                    case "11":
                        monthPay = "Noyabr";
                        break;
                    case "12":
                        monthPay = "Dekabr";
                        break;

                    default:
                        break;
                }
                const month = years + "-" + monthPay;
                return month;
            };
            const monthFun = (arg) => {
                let monthName = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
                let dateOne = arg;
                dateOne.setDate(1);
                let lastMonth = [];
                for (let i = 0; i <= 11; i++) {
                    let lastMonthOne = String(dateOne.getFullYear() + '-' + monthName[dateOne.getMonth()])
                    lastMonth.push(lastMonthOne);
                    dateOne.setMonth(dateOne.getMonth() - 1);
                }
                return lastMonth
            }

            const student = await Students.findAll({
                where: {
                    status: 'active'
                }
            });
            const pendingStudent = await Students.findAll({
                where: {
                    status: 'pending'
                }
            });
            const groups = await Groups.findAll({
                where: {
                    status: 'active'
                }
            })

            const month = monthFun(date);
            let payData = []
            month.forEach((el) => {
                let dataOne = payments.filter((e) => {
                    const format = dateFormat.format(e.createdAt, 'YYYY-MM-DD HH:mm:ss');
                    const day = format.substring(0, 7);
                    return day == el
                })
                let amount = 0
                dataOne && dataOne.length > 0 && dataOne.forEach((e) => {
                    amount = amount + e.amount
                });

                console.log(447, dataOne.length);
                const chartData = dataOne && dataOne.length > 0 && {
                    month: monthTextFun(el),
                    summa: amount
                }
                dataOne && dataOne.length > 0 && payData.push(chartData)
                return;
            });

            console.log(payData);

            let studentList = []
            student && month.forEach((el) => {
                let studentOne = student.filter((e) => {
                    const format = dateFormat.format(e.createdAt, 'YYYY-MM-DD HH:mm:ss');
                    const day = format.substring(0, 7);
                    return day == el
                });
                const studentData = studentOne && studentOne.length > 0 && {
                    month: monthTextFun(el),
                    number: studentOne.length
                }
                studentOne && studentOne.length > 0 && studentList.push(studentData)
            });

            let genderList = [];
            const maleList = student && student.filter((el) => el.gender == 'erkak');
            if (maleList) {
                genderList.push({
                    name: "O'g'il bolalar soni",
                    number: maleList.length
                })
            }
            const womanList = student && student.filter((el) => el.gender == 'ayol');
            if (womanList) {
                genderList.push({
                    name: 'Qiz bolalar soni',
                    number: womanList.length
                })
            }

            const allStudent = {
                "Barcha o'quvchilar": student.length
            };

            const pendingStudentList = {
                "Kutish zalidagi o'quvchilar": pendingStudent.length
            }

            const groupList = {
                groups_size: groups.length
            }


            const payDataLast = payments.filter((e) => {
                const format = dateFormat.format(e.createdAt, 'YYYY-MM-DD HH:mm:ss');
                const day = format.substring(0, 7);
                return day == month[0];
            });

            let lastMonthPay = 0;
            payDataLast.forEach((el) => {
                lastMonthPay = lastMonthPay + el.amount
            });

            console.log(509, lastMonthPay);

            const lastMonthData = {
                month: monthTextFun(month[0]),
                'Summa': lastMonthPay
            };

            res.json({ payData, studentList, genderList, allStudent, pendingStudentList, lastMonthData, groupList });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async paymentDeleteData(req, res, next) {
        try {
            const { startDate, endDate } = req.body;

            if ((!startDate || !endDate) || (!validateFun.isToday_2(startDate) || !validateFun.isToday_2(endDate)) || !validateFun.toCompare(startDate, endDate)) {
                return next(
                    ApiError.badRequest('An invalid value was entered in date')
                );
            }

            const query = `SELECT * FROM public.payments
        WHERE status='inactive' and "createdAt" >= '${startDate} 00:01:01' and "createdAt" =< '${endDate} 23:59:00'`
            const data = await sequelize.query(query);

            if (data && data.length > 0 && data[0].length > 0) {
                const resultData = []
                for (const value of data[0]) {
                    const group_students = await GroupStudents.findOne({
                        where: {
                            id: value.group_student_id
                        }
                    });
                    if (group_students) {
                        const students = await Students.findOne({
                            where: {
                                id: group_students.student_id
                            }
                        });
                        const group = await Groups.findOne({
                            where: {
                                id: group_students.group_id
                            }
                        });

                        if (students && group) {
                            resultData.push({
                                'Ism Famliya': students.firstname + ' ' + students.lastname,
                                'Guruh': group.name,
                                'Summa': value.amount,
                                'Chegirma': value.sale,
                                'To\'lov sanasi ': dateFormat.format(value.createdAt, 'YYYY-MM-DD//HH:mm:ss'),
                                'To\'lov o\'chirilgan sana ': dateFormat.format(value.updatedAt, 'YYYY-MM-DD//HH:mm:ss'),
                            })
                        }
                    }
                }

                return res.json(resultData)
            }
            return res.json([])
        } catch (error) {
            console.log(660, error.stack);
            return next(
                ApiError.badRequest(error)
            )
        }
    }




}

module.exports = new PaymentsController();
