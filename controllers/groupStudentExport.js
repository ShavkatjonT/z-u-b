const { Debtors, LessonGroup, GroupSchedule, Students, Groups, GroupStudents, TeacherGroups, TeacherStatistics, Teachers } = require("../models/models");
const CountWeekdays = require('./countWeekdays');
const groupStudentCreate = require('./groupStudentCreate')
const validateFun = require("./validateFun");
const studentExport = async ({ exitGroup_id, newGroup_id, student_id, group_student_id, summa, newGroupStudent_id, }) => {
    try {
        const monthOne = new Date().getMonth() + 1;
        const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 && '0') + '' + monthOne;
        const debtors = await Debtors.findOne({
            where: {
                group_id: exitGroup_id,
                student_id: student_id,
                month: currentMonth,
                status: 'active',
            }
        });

        const group_student = await GroupStudents.findOne({
            where: {
                status: 'active',
                id: group_student_id
            }
        });

        const group_studentNew = await GroupStudents.findOne({
            where: {
                status: 'active',
                id: newGroupStudent_id
            }
        });

        const lessonGroupOne = await LessonGroup.findOne({
            where: {
                group_id: exitGroup_id,
                status: "active",
            },
        });
        let week = new Date().getDay();

        const groupScheduleNew = await GroupSchedule.findOne({
            where: {
                status: 'active',
                group_id: exitGroup_id,
                day_of_week: week
            }
        })
        const startTimeWeek = debtors && new Date(debtors.createdAt).getDay()
        const groupScheduleStart = debtors && await GroupSchedule.findOne({
            where: {
                status: 'active',
                group_id: exitGroup_id,
                day_of_week: startTimeWeek
            }
        });


        const endTime = groupScheduleNew ? groupScheduleNew.lesson_time : false
        const startTime = groupScheduleStart ? groupScheduleStart.lesson_time : false


        const weekDay = lessonGroupOne && lessonGroupOne.lesson_day
            .split(",")
            .map((e) => Number(e));

        const groupNew = await Groups.findOne({
            where: {
                status: 'active',
                id: newGroup_id
            }
        });

        if (debtors && group_student.month_payment > 0) {
            const endLocatonTime = validateFun.isLocatonTime()
            const day = new Date();
            const monthOne = new Date().getMonth() + 1;
            const year = new Date().getFullYear();
            const date = new Date(debtors.createdAt)
            const start_time_1 = (new Date(debtors.createdAt).getHours() <= 9 ? "0" : '') + '' + new Date(debtors.createdAt).getHours() + ':'
                + (new Date(debtors.createdAt).getMinutes() <= 9 ? "0" : '') + '' + new Date(debtors.createdAt).getMinutes() + ':' +
                (new Date(debtors.createdAt).getSeconds() <= 9 ? "0" : '') + new Date(debtors.createdAt).getSeconds();
            const end_time_1 = (new Date(endLocatonTime).getHours() <= 9 ? "0" : '') + '' + new Date(endLocatonTime).getHours() + ':'
                + (new Date(endLocatonTime).getMinutes() <= 9 ? "0" : '') + '' + new Date(endLocatonTime).getMinutes() + ':' +
                (new Date(endLocatonTime).getSeconds() <= 9 ? "0" : '') + new Date(endLocatonTime).getSeconds();
            const lessonDay = CountWeekdays.countWeekdaysInMonth(monthOne, year, weekDay);
            const lessonLastDay = CountWeekdays.countWeekdaysInRangeNew({
                week_day: weekDay,
                end_date: day,
                end_time_1,
                end_time_2: endTime ? endTime : false,
                start_date: date,
                start_time_1,
                start_time_2: startTime ? startTime : false
            });

            const amountSum = Math.trunc((lessonLastDay * debtors.all_summa) / lessonDay);
            const paySumm = (debtors.all_summa - debtors.amount) - amountSum
            if (paySumm >= 0) {
                debtors.status = 'inactive'
            } else if (paySumm < 0) {
                debtors.amount = Math.abs(paySumm)
            }
            await debtors.save()
        } else if (group_student.month_payment == 0) {

        }
        let amountDebtors = 0;
        if (group_student.wallet > 0) {
            const amount = group_student.wallet - summa
            if (amount > 0) {
                amountDebtors = 0;
                group_studentNew.wallet = group_studentNew.wallet + amount;
            } else if (amount == 0) {
                amountDebtors = 0;
            } else if (amount < 0) {
                amountDebtors = Math.abs(amount);
            }

            await group_studentNew.save()
        }
        const day = new Date().getDate();
        const group_student_wallet = group_student?.wallet ? group_student.wallet : 0;
        await groupStudentCreate({
            student_id: student_id,
            summa, group_id: newGroup_id,
            day: day,
            group_student_wallet_sum: group_student_wallet && group_student_wallet > 0 ? group_student_wallet : false,
        });
        const groupOld = await Groups.findOne({
            where: {
                status: 'active',
                id: exitGroup_id
            }
        });


        groupOld.count_students = String(Number(groupOld.count_students) - 1);
        groupNew.count_students = String(Number(groupNew.count_students) + 1);
        group_student.status = 'incative';
        group_student.wallet = 0;
        await group_student.save();

        await groupOld.save();
        await groupNew.save();

        const teacherGroup = await TeacherGroups.findOne({
            where: {
                status: 'active',
                group_id: exitGroup_id
            }
        });


        const teacher = teacherGroup && await Teachers.findOne({
            where: {
                status: 'active',
                id: teacherGroup.teacher_id
            }
        });

        await TeacherStatistics.create({
            group_id: exitGroup_id,
            student_id,
            student_status: 'delete',
            student_count: groupOld.count_students,
            teacher_id: teacher ? teacher.id : ''
        });

        return 'student export finish'


    } catch (error) {
        console.log(80, error);
        return new Error(error)
    }
}

module.exports = studentExport;
