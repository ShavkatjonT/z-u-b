const {
    Payments,
    TeacherGroups,
    Teachers,
    GroupStudents,
    Debtors,
    TeacherWedms,
} = require("../models/models");
const validateFun = require("./validateFun");
const deleteFun = async (id) => {
    try {
        const paymentsById = await Payments.findOne({ where: { id } });
        if (!paymentsById) {
            return next(ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`));
        };
        const groupStudent = await GroupStudents.findOne({
            where: {
                id: paymentsById.group_student_id,
            },
        });
        let debtorSumma = 0
        if (paymentsById.debtors_id && paymentsById.debtors_id.length > 0) {
            for (const data of paymentsById.debtors_id) {
                const debtorsOne = data.id && await Debtors.findOne({
                    where: {
                        id: data.id
                    }
                });

                if (debtorsOne) {
                    debtorSumma = Math.trunc(data.summa + debtorSumma);
                    debtorsOne.amount = data.saleTrue ? data.summa : Math.trunc((debtorsOne.amount ? debtorsOne.amount : 0) + data.summa + (data.sale ? data.sale : 0));
                    debtorsOne.status = 'active';
                    await debtorsOne.save()
                }
            }
        };

        const teacherWedms = await TeacherWedms.findOne({
            where: {
                status: 'active',
                payment_id: id
            }
        });
        if (teacherWedms) {
            teacherWedms.status = 'inactive';
            await teacherWedms.save();
        };

        const techerGroup = await TeacherGroups.findOne({
            where: {
                group_id: groupStudent.group_id,
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

        if (techer) {
            techer.wallet = techer.wallet - paymentsById.teacher_sum;
            techer.save();
        }

        const updateSum = paymentsById.amount - debtorSumma;

        if (updateSum >= 0) {
            groupStudent.wallet = 0;
            groupStudent.save();
        }
        paymentsById.status = "inactive";
        paymentsById.save();
        return paymentsById;
    } catch (error) {
        return error;
    }
};

module.exports = deleteFun;
