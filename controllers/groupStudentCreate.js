const { Debtors, LessonGroup, GroupSchedule, GroupStudents, TeacherGroups, TeacherStatistics, Groups, TeacherWedms, Teachers } = require("../models/models");
const CountWeekdays = require('./countWeekdays')
const month = async ({ student_id, group_id, day, summa, group_student_wallet_sum }) => {
  try {
    const monthOne = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    const date = new Date();
    const dayWeek = new Date().getDay();
    const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;
    const debtorsOne = await Debtors.findOne({
      where: {
        status: 'active',
        group_id,
        student_id,
        month: currentMonth
      }
    });

    const lessonGroupOne = await LessonGroup.findOne({
      where: {
        group_id,
        status: "active",
      },
    });

    const week_data = await GroupSchedule.findOne({
      where: {
        group_id,
        day_of_week: dayWeek
      }
    })

    const weekDay = lessonGroupOne && lessonGroupOne.lesson_day
      .split(",")
      .map((e) => Number(e))

    const lessonDay = CountWeekdays.countWeekdaysInMonth(monthOne, year, weekDay);
    const endData = CountWeekdays.getLastDateOfMonth(date);

    const time = (new Date().getHours() <= 9 ? "0" : '') + '' + new Date().getHours() + ':'
      + (new Date().getMinutes() <= 9 ? "0" : '') + '' + new Date().getMinutes() + ':' +
      (new Date().getSeconds() <= 9 ? "0" : '') + new Date().getSeconds();

    const lessonLastDay = CountWeekdays.countWeekdaysInRangeNew({
      week_day: weekDay,
      start_date: date,
      start_time_1: '00:00',
      start_time_2: false,
      end_date: endData,
      end_time_1: time,
      end_time_2: week_data?.lesson_time ? week_data?.lesson_time : false
    });

    console.log(52, lessonLastDay);

    const group_studentNew = await GroupStudents.findOne({
      where: {
        status: 'active',
        student_id,
        group_id,
      }
    });

    const teacherGroup = await TeacherGroups.findOne({
      where: {
        status: 'active',
        group_id
      }
    });


    const teacher = teacherGroup && await Teachers.findOne({
      where: {
        status: 'active',
        id: teacherGroup.teacher_id
      }
    });

    const group = await Groups.findOne({
      where: {
        status: 'active',
        id: group_id
      }
    });

    await TeacherStatistics.create({
      group_id,
      student_id,
      student_status: 'add',
      student_count: group.count_students,
      teacher_id: teacher ? teacher.id : ''
    });

    const amountSum = Math.trunc((lessonLastDay * summa) / lessonDay);
    let sum = 0;
    if (group_student_wallet_sum && amountSum && amountSum > 0) {
      const sum1 = group_student_wallet_sum - amountSum;
      if (sum1 > 0) {
        group_studentNew.wallet = (group_studentNew?.wallet ? group_studentNew?.wallet : 0) + sum1;
        if (teacher) {
          const teacher_sum = Math.trunc((amountSum * group.sale) / 100);
          teacher.wallet = (teacher.wallet ? teacher.wallet : 0) + teacher_sum;
          await teacher.save();
          await TeacherWedms.create({
            group_id: group.id,
            teacher_id: teacher.id,
            teacher_sum: teacher_sum
          });
        }
      } else if (sum1 == 0) {
        if (teacher) {
          const teacher_sum = Math.trunc((amountSum * group.sale) / 100);
          teacher.wallet = (teacher.wallet ? teacher.wallet : 0) + teacher_sum;
          await teacher.save();
          await TeacherWedms.create({
            group_id: group.id,
            teacher_id: teacher.id,
            teacher_sum: teacher_sum
          });
        }
        sum = 0;
      } else {
        if (teacher) {
          const teacher_sum = Math.trunc((group_student_wallet_sum * group.sale) / 100);
          teacher.wallet = (teacher.wallet ? teacher.wallet : 0) + teacher_sum;
          await teacher.save();
          await TeacherWedms.create({
            group_id: group.id,
            teacher_id: teacher.id,
            teacher_sum: teacher_sum
          });
        }
        sum = Math.abs(sum1);

      }
    } else if (group_student_wallet_sum && amountSum == 0) {
      group_studentNew.wallet = (group_studentNew?.wallet ? group_studentNew?.wallet : 0) + group_student_wallet_sum;
      sum = sum + 0;
    } else {
      sum = amountSum + sum;
    }

    if (debtorsOne) {
      debtorsOne.amount = lessonGroupOne && Math.trunc(debtorsOne.amount + sum)
      debtorsOne.all_summa = lessonGroupOne && Math.trunc(debtorsOne.amount + sum)
      await debtorsOne.save()
    } else {
      lessonGroupOne && sum > 0 && await Debtors.create({
        student_id,
        group_id,
        month: currentMonth,
        amount: Math.trunc(sum),
        all_summa: Math.trunc(sum),
      });
    }

    await group_studentNew.save()
    return 'Debtors add'
  } catch (error) {
    console.log(100, error.stack);
    return error;
  }
};

module.exports = month;