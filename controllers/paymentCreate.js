const {
  Payments,
  Debtors,
  Students,
  Groups,
  TeacherGroups,
  Teachers,
  GroupStudents,
  TeacherWedms
} = require("../models/models");
const sendMessage = require("./sendMessageController");
const validateFun = require("./validateFun");
const paymentCreate = async ({ student_id, group_id, given_summa, sale, update }) => {
  try {

    const groupOneSecond = await Groups.findOne({
      where: { id: group_id, },
    });
    const groupStudent = await GroupStudents.findOne({
      where: {
        student_id,
        group_id,

      },
    });
    const techerGroup = await TeacherGroups.findOne({
      where: {
        group_id,
        status: "active",
      },
    });
    const techer =
      techerGroup &&
      (await Teachers.findOne({
        where: {
          status: "active",
          id: techerGroup.teacher_id,
        },
      }));

    let debtors_id = []
    let debtors_active_sum = 0;
    let teacher_sum = 0;
    const debtors = await Debtors.findAll({
      where: {
        student_id,
        group_id,
        status: "active",
      },
    });

    if (sale) {
      if (debtors && debtors.length > 0) {
        let amountSum = sale;
        for (const data of debtors) {
          if (amountSum > 0) {
            const debtorOne = await Debtors.findOne({
              where: {
                status: 'active',
                id: data.id
              }
            })
            let amount = debtorOne && debtorOne.amount && debtorOne.amount;
            let paySum = amountSum - amount;
            if (paySum >= 0 && debtorOne) {
              debtors_active_sum = debtors_active_sum + amount,
                debtorOne.status = 'inactive'
              debtorOne.amount = 0
              debtors_id.push({ 'id': data.id, 'summa': 0, sale: amount });
              amountSum = amountSum - amount;
            } else if (paySum < 0 && debtorOne) {
              debtorOne.amount = Math.abs(paySum);
              const amountSumSecond = paySum + amount;
              debtors_active_sum = debtors_active_sum + (Math.abs(amountSumSecond));
              debtors_id.push({ 'id': data.id, 'summa': 0, 'sale': Math.abs(amountSumSecond) })
              amountSum = paySum;
            }
            if (debtorOne) await debtorOne.save();
          }
        }
      }
    }

    if (given_summa) {
      if (debtors && debtors.length > 0) {
        let amountSum = given_summa;
        for (const data of debtors) {
          if (amountSum > 0) {
            const debtorOne = await Debtors.findOne({
              where: {
                status: 'active',
                id: data.id
              }
            })
            let amount = debtorOne && debtorOne.amount && debtorOne.amount;
            let paySum = amountSum - amount;
            if (paySum >= 0 && debtorOne) {
              debtors_active_sum = debtors_active_sum + amount,
                debtorOne.status = 'inactive'
              debtorOne.amount = 0
              debtors_id.push({ 'id': data.id, 'summa': amount });
              if (techer) {
                techer.wallet =
                  techer &&
                  Math.trunc((techer.wallet ? techer.wallet : 0) +
                    (amount * groupOneSecond.sale) / 100);
                teacher_sum =
                  techer && Math.trunc(teacher_sum + (amount * groupOneSecond.sale) / 100);
                techer && techer.save();
              }
              amountSum = amountSum - amount;
            } else if (paySum < 0 && debtorOne) {
              debtorOne.amount = Math.abs(paySum);
              const amountSumSecond = paySum + amount;
              debtors_active_sum = debtors_active_sum + (Math.abs(amountSumSecond));
              debtors_id.push({ 'id': data.id, 'summa': Math.abs(amountSumSecond) })
              techer.wallet =
                techer &&
                Math.trunc((techer.wallet ? techer.wallet : 0) +
                  (Math.abs(amountSumSecond) * groupOneSecond.sale) / 100);
              teacher_sum =
                techer &&
                Math.trunc(teacher_sum +
                  (Math.abs(amountSumSecond) * groupOneSecond.sale) / 100);
              techer && techer.save();
              amountSum = paySum;
            }

            if (debtorOne) await debtorOne.save()
          }
        }
        groupStudent.wallet = amountSum >= 0 ? amountSum : 0;
        groupStudent.save();
      } else if (given_summa && given_summa > 0) {
        groupStudent.wallet =
          (groupStudent.wallet ? groupStudent.wallet : 0) + given_summa;
        groupStudent.save();
      }
    }

    const studentOne = await Students.findOne({
      where: { id: student_id, status: "active" },
    });


    const payment = await Payments.create({
      group_student_id: groupStudent.id,
      sale,
      amount: given_summa,
      teacher_sum,
      debtors_id: debtors_id.length > 0 && debtors_id,
      debtors_active: debtors_active_sum && debtors_active_sum
    });


    if (teacher_sum && teacher_sum > 0 && techer);
    const centerSun = given_summa - teacher_sum;
    await TeacherWedms.create({
      teacher_sum,
      payment_id: payment.id,
      teacher_id: techer.id,
      amount: given_summa,
      center_sum: centerSun > 0 ? centerSun : 0,
      sale_sum: sale,
      group_id
    });


    const sendData = given_summa > 0 && [
      {
        phone: studentOne.fatherPhone
          ? studentOne.fatherPhone
          : studentOne.motherPhone,
        text: `
              "Zukko INM" o'quv markazi: Farzandingiz ${studentOne.firstname + " " + studentOne.lastname
          } ${groupOneSecond.name
          } guruhiga ${given_summa} so'm to'lov qildi.
            `,
      },
    ];

    update && sendData && sendData.length > 0 ? '' : sendMessage(sendData);
    return payment;

  } catch (error) {
    console.log(184, error.stack);
    return error
  }
};


module.exports = paymentCreate;
