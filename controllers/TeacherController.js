const ApiError = require("../error/ApiError");
const {
    Teachers,
    TeacherGroups,
    Groups,
    Monthly,
    User,
    TeacherStatistics,
    Payments,
    GroupStudents,
    TeacherWedms
} = require("../models/models");
const jwt = require("jsonwebtoken");
const sendMessage = require("./sendMessageController");
const validateFun = require("./validateFun");
const { Op } = require("sequelize");
const { Sequelize } = require("../db");
const sequelize = require("../db");
const monhts = [
    { id: 1, month: 'Yanvar' },
    { id: 2, month: 'Fevral' },
    { id: 3, month: 'Mart' },
    { id: 4, month: 'Aprel' },
    { id: 5, month: 'May' },
    { id: 6, month: 'Iyun' },
    { id: 7, month: 'Iyul' },
    { id: 8, month: 'Avgust' },
    { id: 9, month: 'Sentyabr' },
    { id: 10, month: 'Oktyabr' },
    { id: 11, month: 'Noyabr' },
    { id: 12, month: 'Dekabr' },
]
const monthFun = (date) => {
    const monhtOne = new Date(date).getMonth() + 1
    const monhtOneName = monhts.find((el) => el.id == monhtOne);
    return monhtOneName.month
};

async function calculateGroupSum(groupStudents, columnName, date) {
    const monthOne = new Date().getMonth() + 1;
    const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;

    return groupStudents.reduce(async (accPromise, el) => {
        const acc = await accPromise;

        const payment = await Payments.findOne({
            where: {
                status: 'active',
                group_student_id: el.id,
                createdAt: {
                    [Op.gte]: `${date}-01 00:01:01`,
                }
            },

        });

        return acc + (payment?.[columnName] || 0);
    }, Promise.resolve(0));
}

class TeachersController {
    async teacherAdd(req, res, next) {
        try {
            const {
                firstname,
                lastname,
                fathername,
                gender,
                birthday,
                address,
                phone,
            } = req.body;
            if (!firstname) {
                return next(ApiError.badRequest("Data is incomplete"));
            }
            if (!address) {
                return next(ApiError.badRequest("Data is incomplete"));
            }
            if (!gender) {
                return next(ApiError.badRequest("Data is incomplete"));
            }
            if (!birthday) {
                return next(ApiError.badRequest("Data is incomplete"));
            }
            if (!lastname) {
                return next(ApiError.badRequest("Data is incomplete"));
            }
            if (!phone) {
                return next(ApiError.badRequest("Data is incomplete"));
            }

            const teacher = await Teachers.create({
                firstname,
                lastname,
                fathername,
                gender,
                birthday,
                address,
                phone,
            });
            res.json({ teacher });
        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherDelete(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const teacherById = await Teachers.findOne({ where: { id } });
            if (!teacherById) {
                return next(
                    ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`)
                );
            }
            const teacherUser = await User.findOne({
                where: {
                    status: 'active',
                    teacher_id: id
                }
            })
            if (teacherUser) {
                teacherUser.status = "inactive";
                await teacherUser.save();
            }

            teacherById.status = "inactive";
            const teacherDeletes = await teacherById.save();
            if (!teacherDeletes) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ teacherDeletes });
        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherPut(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const {
                firstname,
                lastname,
                fathername,
                gender,
                birthday,
                address,
                phone,
            } = req.body;

            const teacherById = await Teachers.findOne({ where: { id } });

            if (!teacherById) {
                return next(ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`));
            }
            if (firstname) teacherById.firstname = firstname;
            if (gender) teacherById.gender = gender;
            if (birthday) teacherById.birthday = birthday;
            if (lastname) teacherById.lastname = lastname;
            if (fathername) teacherById.fathername = fathername;
            if (address) teacherById.address = address;
            if (phone) teacherById.phone = phone;
            const teachersUpdate = await teacherById.save();
            if (!teachersUpdate) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ teachersUpdate });
        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherGet(req, res, next) {
        try {
            const teachers = await Teachers.findAll({
                where: { status: "active" },
            });
            res.json(teachers);
        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherLabelGet(req, res, next) {
        try {
            const teachers = await Teachers.findAll({
                where: {
                    status: "active",
                },
            });
            const label = teachers.map(async (e) => {
                return {
                    id: e.id,
                    name: e.firstname + " " + e.lastname + " " + e.fathername,
                };
            })

            const teacherFuc = async () => {
                const map1 = await Promise.all(label.map(async (e) => await e));
                return res.json(map1);
            };
            const teacherResult = teacherFuc();
            return teacherResult;
        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherGetOne(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const teacherGroup = await TeacherGroups.findAll({
                where: {
                    status: "active",
                    teacher_id: id,
                },
            });
            const group = await Groups.findAll({
                where: {
                    status: "active",
                },
            });
            const teachers = await Teachers.findOne({
                where: { id, status: "active" },
            });
            let groupListOne = [];
            teacherGroup.map((el) => {
                let groupOne = group.find((e) => e.id == el.group_id);
                return groupListOne.push(groupOne);
            });

            let teacherList = {
                firstname: teachers.firstname,
                lastname: teachers.lastname,
                fathername: teachers.fathername,
                gender: teachers.gender,
                birthday: teachers.birthday,
                address: teachers.address,
                phone: teachers.phone,
                wallet: teachers.wallet,
                group: groupListOne && groupListOne,
            };

            res.json(teacherList);
        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherAllListGet(req, res, next) {
        try {
            const teachers = await Teachers.findAll({
                where: {
                    status: "active",
                },
            });
            const label = teachers.map((e) => {
                return {
                    id: e.id,
                    name: e.firstname + " " + e.lastname + " ",
                    phone: e.phone,
                    birthday: e.birthday,
                    address: e.address,
                    sciences: e.sciences,
                };
            }).sort((a, b) => a.name.localeCompare(b.name));;

            const teacherFuc = async () => {
                const map1 = await Promise.all(label.map(async (e) => await e));
                return res.json(map1);
            };
            const teacherResult = teacherFuc();
            return teacherResult;
        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherAllListLoginGet(req, res, next) {
        try {
            const teachers = await Teachers.findAll({
                where: {
                    status: "active",
                },
            });

            const user = await User.findAll({
                where: {
                    role: "teacher",
                    status: 'active'
                }
            });

            const teacherSort = teachers && teachers.sort((a, b) => a.firstname.localeCompare(b.firstname));

            const label = teacherSort.map(async (el) => {
                const teacherOne = user && user.find((e) => e.teacher_id == el.id)
                const data = !teacherOne && {
                    id: el.id,
                    name: el.firstname + " " + el.lastname + " " + el.fathername,
                }
                return data
            });

            const teacherFuc = async () => {
                const map1 = await Promise.all(label.map(async (e) => await e));
                return res.json(map1);
            };
            const teacherResult = teacherFuc();
            return teacherResult;
        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherAllListCabinet(req, res, next) {
        try {
            const teachers = await Teachers.findAll({
                where: {
                    status: "active",
                },
            });

            const user = await User.findAll({
                where: {
                    [Op.or]: [
                        { status: "frozen" },
                        { status: "active" },
                        { role: "teacher" },
                        { role: "admin" },
                    ],
                }
            });
            const adminData = user.filter((e) => e && e?.role && e.role == 'admin').map((el) => {
                return {
                    id: el.id,
                    email: el.email,
                    email: el.email,
                    lastname: el?.lastname ? el.lastname : '',
                    firstname: el?.firstname ? el.firstname : '',
                    gender: el?.gender ? el.gender : '',
                    phone: el?.phone ? el.phone : '',
                    status: el?.status ? el.status : ''
                }
            }).filter((el) => el && el);

            const label = teachers.map((el) => {
                const teacherOne = user && user.find((e) => e && e?.role && e.role == 'teacher' && e.teacher_id == el.id);
                const data = teacherOne && {
                    id: teacherOne.id,
                    name: el.firstname + " " + el.lastname + " " + el.fathername,
                    teacher_id: el.id,
                    email: teacherOne.email
                }
                return data
            }).sort((a, b) => a.name.localeCompare(b.name));



            const filterData = label.filter((e) => e && e);
            res.json({ filterData, adminData });

        } catch (error) {
            return next(
                ApiError.badRequest(error)
            )
        }
    }
    async teacherAddPaymet(req, res, next) {
        try {
            const day = [14, 15, 16, 27, 28, 29];
            const date = new Date().getDate()
            if (day.includes(date)) {
                const { id } = req.params;
                if (!validateFun.isValidUUID(id)) {
                    return next(ApiError.badRequest("The data was entered incorrectly"));
                }
                if (!id || !validateFun.isValidUUID(id)) {
                    return next(
                        ApiError.badRequest("The ID value was entered incorrectly")
                    );
                }
                const { payment, month } = req.body;

                const teacher = await Teachers.findOne({
                    where: { id, status: "active" },
                });

                if (!teacher) {
                    return next(ApiError.badRequest("O'qtuvchi topilmadi"));
                }
                if (!payment) {
                    return next(ApiError.badRequest("to'lov qilingan suma yo'q "));
                } else {
                    let inNumber = typeof payment;
                    if (inNumber !== "number") {
                        return next(ApiError.badRequest("Summani raqamda kiriting"));
                    }
                    if (payment > 10000000) {
                        return next(
                            ApiError.badRequest(
                                "Berilban summa o'nmilyondan kop summani kamaytiring"
                            )
                        );
                    }
                }
                if (!month) {
                    return next(ApiError.badRequest("Yil va oy kriltilmadi"));
                } else {
                    let inString = typeof month;
                    if (inString !== "string") {
                        return next(ApiError.badRequest("string emas"));
                    }
                }

                const monthText = month.substring(5);
                const years = month.substring(0, 4);

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



                const monthly = await Monthly.create({
                    teacher_id: id,
                    payment,
                    month,
                });

                if (!monthly) {
                    return next(
                        ApiError.badRequest('Malumotlarni saqlab bo\'lmadi')
                    )
                }
                teacher.wallet = teacher.wallet - payment;
                const teacherPay = await teacher.save();

                const sendData = [
                    {
                        phone: teacher.phone,
                        text: `"Zukko INM" o'quv markazi: Hurmatli ${teacher.firstname + " " + teacher.lastname} sizga ${years}-yil ${monthPay} oyi uchun ${payment} so'm miqdorda oylik maosh berildi.`,
                    },
                ];

                sendMessage(sendData);

                return res.json({ teacherPay, monthly });

            } else {
                return next(
                    ApiError.badRequest("You can't pay monthly or advance today")
                );
            };
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async teacherStatisticsGetApi(req, res, next) {
        try {
            const { id } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest('The ID value was entered incorrectly'));
            };
            const teacher = await Teachers.findOne({
                where: {
                    id,
                    status: 'active'
                }
            });
            if (!teacher) {
                return next(ApiError.badRequest('No data found'));
            };

            const groups = await Groups.findAll({
                where: {
                    status: "active"
                }
            });

            const teacherGroups = await TeacherGroups.findAll({
                where: {
                    status: 'active',
                    teacher_id: id
                }
            });


            const statistics = await TeacherStatistics.findAll({
                where: {
                    teacher_id: id,
                    status: 'active',
                    created_at: {
                        [Sequelize.Op.gte]: Sequelize.literal("NOW() - INTERVAL '12 months'"),
                    },
                },
                order: [
                    ['group_id'],
                    ['student_id'],
                    [Sequelize.literal('DATE_TRUNC(\'month\', "created_at")'), 'DESC'],
                    ['created_at', 'DESC'],
                ],
            });

            const result = groups.map((group) => {
                const groupStatistics = statistics.filter((stat) => stat.group_id === group.id);
                const latestStatistics = [];
                const teacher_groups_one = teacherGroups.find((el) => el.group_id == group.id);
                const seenMonths = new Set();
                for (const stat of groupStatistics) {
                    const monthKey = stat.createdAt.toISOString().slice(0, 7);
                    if (!seenMonths.has(monthKey)) {
                        seenMonths.add(monthKey);
                        latestStatistics.push({
                            student_count: stat.student_count,
                            month: monthFun(stat.createdAt),
                        });
                    }
                }
                if (teacher_groups_one) {
                    return {
                        id: group.id,
                        name: group.name,
                        interest: group.sale,
                        statistics: latestStatistics,
                    };
                }
            }).filter((el) => el && el);
            return res.json(result)
        } catch (error) {
            console.log(453, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async teacherWedms(req, res, next) {
        try {

            const monthOne = new Date().getMonth() + 1;
            const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;
            const { id } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(
                    ApiError.badRequest('id not found')
                );
            };

            // Find the teacher
            const teacherInfo = await Teachers.findOne({
                where: { id: id, status: 'active' },
            });

            if (!teacherInfo) {
                return next(
                    ApiError.badRequest('Teacher not found')
                );
            };

            // Find the teacher's groups
            const teacherGroups = await TeacherGroups.findAll({
                where: { teacher_id: id, status: 'active' },
            });

            // Find the teacher_sum for each group
            const teacherSums = await Promise.all(
                teacherGroups.map(async (group) => {
                    const groupStudents = await GroupStudents.findAll({
                        where: { group_id: group.group_id },
                    });
                    const sum = await groupStudents.reduce(async (accPromise, el) => {
                        const acc = await accPromise;
                        const payment = await Payments.findOne({
                            where: {
                                status: 'active',
                                group_student_id: el.id,
                                createdAt: {
                                    [Op.gte]: `${currentMonth}-01 00:01:01`,
                                }
                            }
                        });
                        return acc + (payment?.teacher_sum || 0);
                    }, Promise.resolve(0));

                    const groupOne = await Groups.findOne({
                        where: {
                            id: group.group_id
                        }
                    });

                    return {
                        groupId: groupOne.id,
                        groupName: groupOne.name, // Replace with the correct column name
                        teacherSum: sum,
                    };
                })
            );

            return res.json(teacherSums);

        } catch (error) {
            console.log(591, error.stack);
            return next(ApiError.badRequest(error))
        }
    }
    async teacherWedmsNew(req, res, next) {
        try {
            const { id } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(
                    ApiError.badRequest('id not found')
                );
            };
            const query = `SELECT
            g.id AS "groupId",
            g.name AS "groupName",
            SUM(CAST(tw.teacher_sum AS NUMERIC)) AS "teacherSum"
        FROM
            groups g
        JOIN
            teacher_wedms tw ON g.id::VARCHAR(255) = tw.group_id::VARCHAR(255)
        JOIN
            teachers t ON tw.teacher_id::VARCHAR(255) = t.id::VARCHAR(255)
        WHERE
             t.id = '${id}'
            AND tw.created_at >= CURRENT_DATE - INTERVAL '1' MONTH
        GROUP BY
            g.id, g.name;
        `;
            const data = await sequelize.query(query);

            return res.json(data[0])
        } catch (error) {
            console.log(591, error.stack);
            return next(ApiError.badRequest(error))
        }
    }
    async teacherCenterWedms(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );

            if (role.role == 'super') {
                const { date } = req.body;

                if (!date || !validateFun.validateMonth(date)) {
                    return next(
                        ApiError.badRequest('Date not found')
                    )
                }

                const activeTeachers = await Teachers.findAll({
                    where: { status: 'active' },
                });


                const teacherSums = await Promise.all(
                    activeTeachers.map(async (teacher) => {
                        const teacherGroups = await TeacherGroups.findAll({
                            where: { teacher_id: teacher.id, status: 'active' },
                        });

                        const sum = await Promise.all(
                            teacherGroups.map(async (group) => {
                                const groupStudents = await GroupStudents.findAll({
                                    where: { group_id: group.group_id },
                                });

                                const groupSum = await calculateGroupSum(groupStudents, 'teacher_sum', date);
                                const centerSum = await calculateGroupSum(groupStudents, 'amount', date) - await calculateGroupSum(groupStudents, 'teacher_sum', date);
                                const saleSum = await calculateGroupSum(groupStudents, 'sale', date);
                                const amountSum = await calculateGroupSum(groupStudents, 'amount', date);

                                const groupOne = await Groups.findOne({
                                    where: { id: group.group_id },
                                });

                                return {
                                    groupId: groupOne.id,
                                    groupName: groupOne.name, // Replace with the correct column name
                                    teacherSum: groupSum,
                                    centerSum: centerSum,
                                    saleSum: saleSum,
                                    amountSum: amountSum
                                };
                            })
                        );

                        return {
                            teacherId: teacher.id,
                            teacherName: `${teacher.firstname} ${teacher.lastname}`,
                            teacherSums: sum,
                        };
                    })
                );

                return res.json(teacherSums);
            } else {
                return next(
                    ApiError.badRequest('Changing user data is not allowed')
                )
            }



        } catch (error) {
            console.error(675, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async teacherCenterWedmsNew(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );

            if (role.role == 'super') {
                const { date } = req.body;

                if (!date || !validateFun.validateMonth(date)) {
                    return next(
                        ApiError.badRequest('Date not found')
                    )
                };
                const query = `WITH TeacherGroupSum AS (
                    SELECT
                        t.id AS teacher_id,
                        t.lastname AS lastname,
                        t.firstname AS firstname,
                        g.id AS group_id,
                        g.name AS group_name,
                        SUM(CAST(tw.teacher_sum AS NUMERIC)) AS teacher_sum,
                        SUM(CAST(tw.amount AS NUMERIC)) AS amount,
                        SUM(CAST(tw.sale_sum AS NUMERIC)) AS sale,
                        SUM(CAST(tw.center_sum AS NUMERIC)) AS center_sum
                    FROM
                        teachers t
                    JOIN
                        teacher_wedms tw ON t.id::VARCHAR(255) = tw.teacher_id::VARCHAR(255)
                    JOIN
                        groups g ON tw.group_id::VARCHAR(255) = g.id::VARCHAR(255)
                    WHERE
                        t.status = 'active' 
                        AND tw.status = 'active' and tw.created_at >='${date}-01 00:01:01'
                    GROUP BY
                        t.id, t.lastname, t.firstname, g.id, g.name
                )
                SELECT
                    teacher_id AS "teacherId",
                    firstname || ' ' || lastname AS "teacherName",
                    JSONB_AGG(
                        JSONB_BUILD_OBJECT(
                            'groupId', group_id,
                            'groupName', group_name,
                            'teacherSum', teacher_sum,
                            'centerSum',center_sum,
                            'saleSum',sale,
                            'amount',amount
                        )
                    ) AS "teacherSums"
                FROM
                    TeacherGroupSum
                GROUP BY
                    teacher_id, lastname, firstname
                ORDER BY
                    teacher_id;
                `;
                const data = await sequelize.query(query);
                const sendData = data && data.length > 0 && data[0].length > 0 ? data[0] : []
                return res.json(sendData);
            } else {
                return next(
                    ApiError.badRequest('Changing user data is not allowed')
                )
            }



        } catch (error) {
            console.error(675, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
}

module.exports = new TeachersController();
