const ApiError = require("../error/ApiError");
const {
    Debtors,
    Groups,
    Students,
    GroupStudents,
    TeacherGroups,
    Teachers,
    Payments,
} = require("../models/models");
const paymentCreate = require("./paymentCreate");
const { Op } = require('sequelize');
const validateFun = require("./validateFun");
const sequelize = require("../db");
class DebtorsController {
    async debtorAdd(req, res, next) {
        try {
            const { student_id, all_summa, group_id, month, amount } = req.body;

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

            if (!all_summa) {
                return next(ApiError.badRequest("oylik to'lov sumasi yo'q "));
            } else {
                let inNumber = typeof all_summa;
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("Summani raqamda kiriting"));
                }
            }

            if (!amount) {
                return next(ApiError.badRequest("oylik to'lov sumasi yo'q "));
            } else {
                let inNumber = typeof amount;
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("Summani raqamda kiriting"));
                }
            }

            const debtor = await Debtors.create({
                student_id,
                group_id,
                month,
                amount,
                all_summa,
            });
            res.json({ debtor });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async debtorDelete(req, res, next) {
        try {
            const { student_id, group_id, given_summa, sale } = req.body;
            const update = false;
            if ((!given_summa && !sale) || (given_summa == 0 && sale == 0)) {
                return next(ApiError.badRequest("qarz summasi yuborilmadi"));
            } else {
                let inNumber = typeof given_summa;
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
            return next(ApiError.badRequest(error));
        }
    }

    async debtorDeleteOne(req, res, next) {
        try {
            const { id } = req.body;
            const debtorDelete = await Debtors.destroy({ where: { id, status: 'active' } })
            return res.json({ "debtor": 'delete', debtorDelete });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async debtorPut(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const { student_id, all_summa, group_id, month, amount } = req.body;
            const debtorsById = await Debtors.findOne({ where: { id } });

            if (!debtorsById) {
                return next(ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`));
            }
            if (student_id) debtorsById.student_id = student_id;
            if (amount) debtorsById.amount = Math.trunc(amount);
            if (all_summa) debtorsById.all_summa = Math.trunc(all_summa);
            if (group_id) debtorsById.group_id = group_id;
            if (month) debtorsById.month = month;

            const debtorsUpdate = await debtorsById.save();
            if (!debtorsUpdate) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ debtorsUpdate });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async debtorGet(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const debtors = await Debtors.findAll({
                where: { status: "active", group_id: id },
            });
            const student = await Students.findAll({
                where: { status: "active" },
            });
            const group = await Groups.findOne({
                where: { status: "active", id: id },
            });
            const groupStudents = await GroupStudents.findAll({
                where: { status: "active", group_id: id },
            });

            const studentList =
                groupStudents &&
                student &&
                student.filter((el) => {
                    return groupStudents.find((e) => e.student_id == el.id);
                }).sort((a, b) => a.firstname.localeCompare(b.firstname));

            let amount = 0;
            const debtorsList =
                group &&
                studentList &&
                studentList.map((el) => {
                    const debtorsOne =
                        debtors &&
                        debtors.filter((e) => {
                            if (e.student_id == el.id) {
                                amount = amount + e.amount;
                            }

                            return e.student_id == el.id;
                        });

                    const groupStudentOne = groupStudents.find(
                        (e) => e.student_id == el.id
                    );
                    const data = {
                        id: el.id,
                        name: el.firstname + " " + el.lastname,
                        phone: el.fatherPhone ? el.fatherPhone : el.motherPhone,
                        months: debtorsOne && debtorsOne,
                        amount: amount ? amount : 0,
                        groupId: group.id,
                        gruoName: group.name,
                        wallet: groupStudentOne.wallet,
                    };
                    amount = 0;
                    return data;
                });
            const debtorFilter = debtorsList.filter((e) => (e.wallet < 0 || e.amount > 0) && e);
            res.json(debtorFilter);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async debtorAllGet(req, res, next) {
        try {
            const debtors = await Debtors.findAll({
                where: { status: "active" },
            });
            const student = await Students.findAll();
            const group = await Groups.findAll();
            const groupStudents = await GroupStudents.findAll();
            const studentSort = student && student.sort((a, b) => a.firstname.localeCompare(b.firstname));
            let amount = 0;
            const debtorsList =
                group &&
                studentSort &&
                groupStudents &&
                group.map((el) => {
                    const groupOne = groupStudents.filter((e) => e.group_id == el.id);
                    const debtorOne = debtors.filter((e) => e.group_id == el.id);
                    const studentOne = studentSort.filter((e) => {
                        return groupOne.find((ele) => ele.student_id == e.id)
                    }).sort((a, b) => a.firstname.localeCompare(b.firstname));

                    let dataList = {
                        group: {
                            name: el.name,
                            id: el.id
                        },
                        debtors: []
                    }
                    debtorOne && debtorOne.length > 0 && studentOne.forEach((e) => {
                        const debtorList = debtorOne.filter((ele) => ele.student_id == e.id);
                        debtorList.forEach((ele) => {
                            return amount = amount + ele.amount
                        })
                        const data = debtorList && debtorList.length > 0 && {
                            name: e.lastname + ' ' + e.firstname,
                            id: e.id,
                            debtors: debtorList && debtorList,
                            amount
                        }
                        amount = 0
                        if (debtorList && debtorList.length > 0) {
                            dataList.debtors.push(data);
                        }
                        return;
                    });

                    return dataList
                });

            const dataFiletr = debtorsList.filter((el) => el.debtors.length > 0 && el.debtors && el);

            res.json(dataFiletr);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async debtorAllGetNewAdmin(req, res, next) {
        try {
            const monthOne = new Date().getMonth() + 1;
            const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;
            const query = `SELECT json_agg(json_build_object(
            'student_id', s.id,
            'lastName', s.lastName,
            'firstName', s.firstName,
            'group', json_build_object(
                'group_id', g.id,
                'name', g.name
            ),
            'debtors', (
                    SELECT json_agg(json_build_object(
                        'debtor_id', d.id,
                        'amount', d.amount,
                        'month', d.month
                    ))
                    FROM debtors AS d
                    WHERE d.status = 'active'
                    AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
                    AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
                    AND d.month='${currentMonth}'
            ),
            'all_summa', (
                    SELECT SUM(d.amount)
                    FROM debtors AS d
                    WHERE d.status = 'active'
                    AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
                    AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
                    AND d.month='${currentMonth}'
            )
        )) AS data
        FROM group_students AS gs
        JOIN students AS s ON gs.student_id::VARCHAR(255) = s.id::VARCHAR(255)
        JOIN groups AS g ON gs.group_id::VARCHAR(255) = g.id::VARCHAR(255)
        WHERE EXISTS (
            SELECT 1
            FROM debtors AS d
            WHERE d.status = 'active'
            AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
            AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
            AND d.month='${currentMonth}'
        );
        `;
            const data = await sequelize.query(query);
            return res.json(data[0][0])
        } catch (error) {
            console.log(304, error.stack);
            return next(
                ApiError.badRequest(error)
            )
        }
    }

    async debtorAllGetNewSuper(req, res, next) {
        try {
            const { startDate, endDate } = req.body;
            if (!startDate || !validateFun.validateMonth(startDate)) {
                return next(
                    ApiError.badRequest('An invalid value was entered in date')
                );
            }

            if (endDate) {
                if (endDate && !validateFun.validateMonth(endDate)) {
                    return next(
                        ApiError.badRequest('An invalid value was entered in date')
                    );
                }
            }

            const monthOne = new Date().getMonth() + 1;
            const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;
            const query_1 = endDate && `SELECT json_agg(json_build_object(
                'student_id', s.id,
                'lastName', s.lastName,
                'firstName', s.firstName,
                'group', json_build_object(
                    'group_id', g.id,
                    'name', g.name
                ),
                'debtors', (
                        SELECT json_agg(json_build_object(
                            'debtor_id', d.id,
                            'amount', d.amount,
                            'month', d.month
                        ))
                        FROM debtors AS d
                        WHERE d.status = 'active'
                        AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
                        AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
						and d.month<='${startDate}' and d.month>='${endDate}'
                ),
                'all_summa', (
                        SELECT SUM(d.amount)
                        FROM debtors AS d
                        WHERE d.status = 'active'
                        AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
                        AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
						and d.month<='${startDate}' and d.month>='${endDate}'
                )
            )) AS data
            FROM group_students AS gs
            JOIN students AS s ON gs.student_id::VARCHAR(255) = s.id::VARCHAR(255)
            JOIN groups AS g ON gs.group_id::VARCHAR(255) = g.id::VARCHAR(255)
            WHERE EXISTS (
                SELECT 1
                FROM debtors AS d
                WHERE d.status = 'active'
                AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
                AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
				and d.month<='${startDate}' and d.month>='${endDate}'
            );
            `;

            const query_2 = !endDate && `SELECT json_agg(json_build_object(
                'student_id', s.id,
                'lastName', s.lastName,
                'firstName', s.firstName,
                'group', json_build_object(
                    'group_id', g.id,
                    'name', g.name
                ),
                'debtors', (
                        SELECT json_agg(json_build_object(
                            'debtor_id', d.id,
                            'amount', d.amount,
                            'month', d.month
                        ))
                        FROM debtors AS d
                        WHERE d.status = 'active'
                        AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
                        AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
                        AND d.month='${startDate}'
                ),
                'all_summa', (
                        SELECT SUM(d.amount)
                        FROM debtors AS d
                        WHERE d.status = 'active'
                        AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
                        AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
                        AND d.month='${startDate}'
                )
            )) AS data
            FROM group_students AS gs
            JOIN students AS s ON gs.student_id::VARCHAR(255) = s.id::VARCHAR(255)
            JOIN groups AS g ON gs.group_id::VARCHAR(255) = g.id::VARCHAR(255)
            WHERE EXISTS (
                SELECT 1
                FROM debtors AS d
                WHERE d.status = 'active'
                AND d.group_id::VARCHAR(255) = gs.group_id::VARCHAR(255)
                AND d.student_id::VARCHAR(255) = gs.student_id::VARCHAR(255)
                AND d.month='${startDate}'
            );
            `;

            const data = endDate ? await sequelize.query(query_1) : await sequelize.query(query_2);
            return res.json(data[0][0])
        } catch (error) {
            console.log(409, error.stack);
            return next(
                ApiError.badRequest(error)
            )
        }
    }

}

module.exports = new DebtorsController();
