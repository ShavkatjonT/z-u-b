const ApiError = require("../error/ApiError");
const {
    Groups,
    Teachers,
    GroupStudents,
    TeacherGroups,
    Students,
    Rooms,
    LessonGroup,
    Debtors,
    GroupSchedule
} = require("../models/models");
const timeFun = require('./timeFun');
const CountWeekdays = require('./countWeekdays');
const validateFun = require("./validateFun");
class GroupsController {
    async groupAdd(req, res, next) {
        try {
            const { name, month_payment, sale, time, day, room_id, teacher_id, } = req.body;
            if (!name) {
                return next(ApiError.badRequest("Group name yo'q"));
            }
            if (!month_payment) {
                return next(ApiError.badRequest("Month_payment  yo'q"));
            } else {
                let inNumber = typeof month_payment;
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("Summani raqamda kiriting"));
                }
            }
            if (!time) {
                return next(ApiError.badRequest("data is incomplete"));
            }
            if (!day) {
                return next(ApiError.badRequest("data is incomplete"));
            } else {
                const result = CountWeekdays.validateArray(day);
                if (!result) {
                    return next(
                        ApiError.badRequest("Error: Array contains invalid number(s).")
                    );
                }
            }
            if (!room_id) {
                return next(ApiError.badRequest("data is incomplete"));
            }
            const room = await Rooms.findOne({
                where: {
                    status: "active",
                    id: room_id,
                },
            });
            if (!room) {
                return next(ApiError.badRequest("no data found"));
            }
            let resAllTime = false
            for (const weekDay of day) {
                const groupSchedule = await GroupSchedule.findAll({
                    where: {
                        status: 'active',
                        day_of_week: weekDay,
                        room_id
                    }
                });
                let resTime = false
                if (groupSchedule && groupSchedule.length > 0) {
                    for (const data of groupSchedule) {
                        const timeFunRes = timeFun(data.lesson_time, time);
                        if (!timeFunRes) {
                            resTime = true
                            break;
                        }


                    }
                }
                if (resTime) {
                    resAllTime = true
                    break;
                }

            }
            if (resAllTime) {
                return next(
                    ApiError.badRequest("At this time there is a lesson in the room")
                );
            }

            if (sale || sale == 0) {
                let inNumber = typeof sale;
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("sale raqamda kiriting"));
                }
            }
            if (sale < 0 || sale > 100) {
                return next(ApiError.badRequest("Foizni 100 va 0 oralig'da bo'lsin"));
            }

            const group = await Groups.create({
                name,
                month_payment,
                sale,
            });
            const groupScheduleAll = []
            for (const weekDay of day) {
                const groupScheduleOne = await GroupSchedule.create({
                    room_id,
                    lesson_time: time,
                    group_id: group.id,
                    day_of_week: weekDay,
                    teacher_id,
                });
                if (groupScheduleOne) {
                    groupScheduleAll.push(groupScheduleOne.day_of_week)
                }
            }

            await LessonGroup.create({
                room_id,
                lesson_time: time,
                group_id: group.id,
                lesson_day: groupScheduleAll.join(","),
                teacher_id,
            });

            res.json({ group });
        } catch (error) {
            console.log(147, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async groupLesson(req, res, next) {
        try {
            const { name, month_payment, sale, teacher_id, week_data } = req.body;
            if (!name) {
                return next(ApiError.badRequest("Group name yo'q"));
            }
            if (!month_payment) {
                return next(ApiError.badRequest("Month_payment  yo'q"));
            } else {
                let inNumber = typeof month_payment;
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("Summani raqamda kiriting"));
                }
            }
            if (sale || sale == 0) {
                let inNumber = typeof sale;
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("sale raqamda kiriting"));
                }
            }
            if (sale < 0 || sale > 100) {
                return next(ApiError.badRequest("Foizni 100 va 0 oralig'da bo'lsin"));
            }

            if (!week_data || week_data.length <= 0) {
                return next(
                    ApiError.badRequest('There is an error in the weekly data')
                );
            }


            const resWeekData = CountWeekdays.validateWeekData(week_data);
            if (resWeekData) {
                return next(
                    ApiError.badRequest('There is an error in the weekly data')
                )
            }
            let resAllTime = false;
            for (const data of week_data) {
                const groupSchedule = await GroupSchedule.findAll({
                    where: {
                        status: 'active',
                        day_of_week: data.week_day,
                        room_id: data.room_id
                    }
                });
                let resTime = false
                if (groupSchedule && groupSchedule.length > 0) {
                    for (const groupScheduleData of groupSchedule) {
                        const timeFunRes = timeFun(groupScheduleData.lesson_time, data.time);
                        if (!timeFunRes) {
                            resTime = true
                            break;
                        }
                    }
                }
                if (resTime) {
                    resAllTime = true
                    break;
                }

            }
            if (resAllTime) {
                return next(
                    ApiError.badRequest("At this time there is a lesson in the room")
                );
            }
            const group = await Groups.create({
                name,
                month_payment,
                sale,
            });

            const groupScheduleAll = []
            for (const data of week_data) {
                const groupScheduleOne = await GroupSchedule.create({
                    room_id: data.room_id,
                    lesson_time: data.time,
                    group_id: group.id,
                    day_of_week: data.week_day,
                    teacher_id,
                });
                if (groupScheduleOne) {
                    groupScheduleAll.push(groupScheduleOne.day_of_week)
                }
            }

            await LessonGroup.create({
                group_id: group.id,
                lesson_day: groupScheduleAll.join(","),
                teacher_id,
            });
            res.json({ group });
        } catch (error) {
            console.log(237, error.stack);
            console.log(238, error);
            return next(ApiError.badRequest(error));
        }
    }
    async groupDelete(req, res, next) {
        try {
            const { id } = req.params;
            const groupsById = await Groups.findOne({
                where: { id, status: "active" },
            });

            if (!groupsById) {
                return next(
                    ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`)
                );
            }
            const teacherGroup = await TeacherGroups.findOne({
                where: {
                    status: "active",
                    group_id: id,
                },
            });

            const lesson_group = await LessonGroup.findOne({
                where: {
                    group_id: id,
                    status: "active",
                },
            });
            if (lesson_group) {
                lesson_group.status = "inactve";
                await lesson_group.save();
            }
            await GroupSchedule.destroy({
                where: {
                    status: 'active',
                    group_id: id,
                }
            });

            if (teacherGroup) teacherGroup.status = "inactive";
            teacherGroup && await teacherGroup.save();
            const student = await Students.findAll({
                where: {
                    status: "active",
                },
            });
            const groupStudentList = await GroupStudents.findAll({
                where: { status: "active", group_id: id },
            });
            const groupStudent = await GroupStudents.update(
                { status: "inactive" },
                { where: { status: "active", group_id: id } }
            );
            const studentFilter =
                groupStudentList.length > 0 &&
                student &&
                groupStudentList.map((el) => {
                    const studentOne = student.find((e) => e.id == el.student_id);

                    return studentOne;
                });

            const group_student = await GroupStudents.findAll({
                where: {
                    status: "active",
                },
            });

            const weekDay = lesson_group && lesson_group.lesson_day
                .split(",")
                .map((e) => Number(e));
            const day = new Date().getDate();
            const monthOne = new Date().getMonth() + 1;
            const year = new Date().getFullYear();
            const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;

            if (studentFilter.length > 0 && studentFilter) {
                for (const el of studentFilter) {
                    const studentOne = group_student.find((e) => e.student_id == el.id);
                    if (!studentOne) {
                        el.update({
                            status: "pending",
                        });
                    }
                    const debtors = await Debtors.findOne({
                        where: {
                            status: 'active',
                            group_id: id,
                            student_id: el.id,
                            month: currentMonth
                        }
                    });
                    if (debtors && lesson_group) {
                        const date = new Date(debtors.createdAt).getDate()
                        const lessonDay = CountWeekdays.countWeekdaysInMonth(monthOne, year, weekDay);
                        const lessonLastDay = CountWeekdays.countWeekdaysInRange(date, day, weekDay);
                        const amountSum = Math.trunc((lessonLastDay * debtors.all_summa) / lessonDay);
                        const paySumm = (debtors.all_summa - debtors.amount) - amountSum;
                        if (paySumm >= 0) {
                            debtors.status = 'inactive'
                        } else if (paySumm < 0) {
                            debtors.amount = Math.abs(paySumm)
                        }
                        await debtors.save()

                    }
                }
            }
            groupsById.status = "inactive";
            const groupsDeletes = await groupsById.save();
            if (!groupsDeletes) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ groupsDeletes, groupStudent });
        } catch (error) {
            console.log(111, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async groupDeleteNew(req, res, next) {
        try {
            const { id } = req.params;

            if (!id || !validateFun.isValidUUID(id)) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };
            const groupsById = await Groups.findOne({
                where: { id, status: 'active' },
            });

            if (!groupsById) {
                return next(
                    ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`)
                );
            }
            const teacherGroup = await TeacherGroups.findOne({
                where: {
                    status: 'active',
                    group_id: id,
                },
            });

            const lesson_group = await LessonGroup.findOne({
                where: {
                    group_id: id,
                    status: 'active',
                },
            });
            if (lesson_group) {
                lesson_group.status = 'inactve';
                await lesson_group.save();
            }

            if (teacherGroup) teacherGroup.status = 'inactive';
            teacherGroup && (await teacherGroup.save());
            const student = await Students.findAll({
                where: {
                    status: 'active',
                },
            });
            const groupStudentList = await GroupStudents.findAll({
                where: { status: "active", group_id: id },
            });
            const groupStudent = await GroupStudents.update(
                { status: 'inactive' },
                { where: { status: "active", group_id: id } }
            );
            const studentFilter =
                groupStudentList.length > 0 &&
                student &&
                groupStudentList.map((el) => {
                    const studentOne = student.find((e) => e.id == el.student_id);

                    return studentOne;
                });

            const group_student = await GroupStudents.findAll({
                where: {
                    status: "active"
                },
            });

            const weekDay =
                lesson_group &&
                lesson_group.lesson_day.split(',').map((e) => Number(e));
            const day = new Date().getDate();
            const monthOne = new Date().getMonth() + 1;
            const year = new Date().getFullYear();
            const currentMonth =
                new Date().getFullYear() + '-' + (monthOne <= 9 ? "0" : '') + '' + monthOne;

            if (studentFilter.length > 0 && studentFilter) {
                for (const el of studentFilter) {
                    const studentOne = group_student.find((e) => e.student_id == el.id);
                    if (!studentOne) {
                        el.update({
                            status: 'pending',
                        });
                    }
                    const debtors = await Debtors.findOne({
                        where: {
                            status: 'active',
                            group_id: id,
                            student_id: el.id,
                            month: currentMonth,
                        },
                    });

                    if (debtors && lesson_group) {
                        const startTimeWeek = new Date(debtors.createdAt).getDay();
                        const end_date = validateFun.isLocatonTime();
                        const endWeekDay = new Date().getDay();
                        const startGroupSchedule = await GroupSchedule.findOne({
                            where: {
                                status: "active",
                                group_id: id,
                                day_of_week: startTimeWeek
                            },
                        });
                        const endGroupSchedule = await GroupSchedule.findOne({
                            where: {
                                group_id: id,
                                status: "active",
                                day_of_week: endWeekDay
                            },
                        });
                        const date = new Date(debtors.createdAt).getDate();
                        const lessonDay = CountWeekdays.countWeekdaysInMonth(
                            monthOne,
                            year,
                            weekDay
                        );
                        const start_time_1 = (new Date(debtors.createdAt).getHours() <= 9 ? "0" : '') + '' + new Date(debtors.createdAt).getHours() + ':'
                            + (new Date(debtors.createdAt).getMinutes() <= 9 ? "0" : '') + '' + new Date(debtors.createdAt).getMinutes() + ':' +
                            (new Date(debtors.createdAt).getSeconds() <= 9 ? "0" : '') + new Date(debtors.createdAt).getSeconds();
                        const end_time_1 = validateFun.isLocatonTime().split(" ")[1];
                        const lessonLastDay = CountWeekdays.countWeekdaysInRangeNew(
                            {
                                week_day: weekDay,
                                start_date: debtors.createdAt,
                                start_time_1,
                                start_time_2: startGroupSchedule?.lesson_time ? startGroupSchedule.lesson_time : false,
                                end_date,
                                end_time_1,
                                end_time_2: endGroupSchedule?.lesson_time ? endGroupSchedule.lesson_time : false
                            }
                        );
                        const amountSum = Math.trunc(
                            (lessonLastDay * debtors.all_summa) / lessonDay
                        );
                        const paySumm = debtors.all_summa - debtors.amount - amountSum;
                        if (paySumm >= 0) {
                            debtors.status = 'inactive';
                        } else if (paySumm < 0) {
                            debtors.amount = Math.abs(paySumm);
                        }
                        await debtors.save();
                    }
                }
            };
            await GroupSchedule.destroy({
                where: {
                    status: 'active',
                    group_id: id,
                },
            });
            groupsById.status = 'inactive';
            const groupsDeletes = await groupsById.save();
            if (!groupsDeletes) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ groupsDeletes, groupStudent });
        } catch (error) {
            console.log(111, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async groupPut(req, res, next) {
        try {
            let createTeacher;
            let teacherGroup;
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const {
                name,
                teacher_id,
                month_payment,
                sale,
                month_pay_intrue,
                time,
                day,
                room_id,
            } = req.body;
            const groupById = await Groups.findOne({
                where: { id, status: "active" },
            });
            if (sale < 0 || 100 < sale) {
                return next(
                    ApiError.badRequest('Re-enter the teacher percentage')
                )
            }

            const groupStudent = month_pay_intrue
                ? await GroupStudents.update(
                    { month_payment: month_payment },
                    {
                        where: {
                            status: "active",
                            group_id: id,
                        },
                    }
                )
                : {};

            if (name) {
                groupById.name = name;
            }
            if (sale) {
                groupById.sale = sale;
            }

            await groupById.save();

            if (!day) {
                return next(ApiError.badRequest("data is incomplete"));
            } else {
                const result = CountWeekdays.validateArray(day);
                if (!result) {
                    return next(
                        ApiError.badRequest("Error: Array contains invalid number(s).")
                    );
                }
            }

            const room = await Rooms.findOne({
                where: {
                    status: "active",
                    id: room_id,
                },
            });

            if (!room) {
                return next(ApiError.badRequest("no data found"));
            }

            if (!time) {
                return next(ApiError.badRequest("data is incomplete"));
            }
            const lessonGroupOne = await LessonGroup.findOne({
                where: {
                    group_id: id,
                    status: "active",
                },
            });

            const deleteApp = await GroupSchedule.destroy({
                where: {
                    status: 'active',
                    group_id: id,
                }
            });

            console.log(deleteApp);

            let resAllTime = false
            for (const weekDay of day) {
                const groupSchedule = await GroupSchedule.findAll({
                    where: {
                        status: 'active',
                        day_of_week: weekDay,
                        room_id
                    }
                });
                let resTime = false
                if (groupSchedule && groupSchedule.length > 0) {
                    for (const data of groupSchedule) {
                        const timeFunRes = timeFun(data.lesson_time, time);
                        if (!timeFunRes) {
                            resTime = true
                            break;
                        }
                    }
                }
                if (resTime) {
                    resAllTime = true
                    break;
                }

            }
            if (resAllTime) {
                return next(
                    ApiError.badRequest("At this time there is a lesson in the room")
                );
            }

            const groupScheduleAll = []
            for (const weekDay of day) {
                const groupScheduleOne = await GroupSchedule.create({
                    room_id,
                    lesson_time: time,
                    group_id: id,
                    day_of_week: weekDay,
                    teacher_id,
                });
                if (groupScheduleOne) {
                    groupScheduleAll.push(groupScheduleOne.day_of_week)
                }
            }

            if (lessonGroupOne) {
                lessonGroupOne.room_id = room_id;
                lessonGroupOne.lesson_time = time;
                lessonGroupOne.lesson_day = groupScheduleAll.join(",");
                lessonGroupOne.teacher_id = teacher_id;
                await lessonGroupOne.save();
            } else {
                await LessonGroup.create({
                    room_id,
                    lesson_time: time,
                    group_id: id,
                    lesson_day: groupScheduleAll.join(","),
                    teacher_id,
                });
            }
            if (month_payment) {
                groupById.month_payment = month_payment;
            }
            const teacherGroupOne = await TeacherGroups.findOne({
                where: { status: "active", group_id: id },
            });

            if (teacherGroupOne && teacher_id != teacherGroupOne.teacher_id) {
                teacherGroup = await TeacherGroups.update(
                    { status: "inactive" },
                    { where: { status: "active", group_id: id } }
                );
                createTeacher = await TeacherGroups.create({
                    teacher_id: teacher_id,
                    group_id: id,
                });
            }

            if (!groupById) {
                return next(ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`));
            }
            const groupUpdate = await groupById.save();
            if (!groupUpdate) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ groupUpdate, teacherGroup, createTeacher, groupStudent });
        } catch (error) {
            console.log(374, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async groupLessonPut(req, res, next) {
        try {
            let createTeacher;
            let teacherGroup;
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const {
                name,
                teacher_id,
                month_payment,
                sale,
                month_pay_intrue,
                week_data
            } = req.body;
            const groupById = await Groups.findOne({
                where: { id, status: "active" },
            });
            const groupStudent = month_pay_intrue
                ? await GroupStudents.update(
                    { month_payment: month_payment },
                    {
                        where: {
                            status: "active",
                            group_id: id,
                        },
                    }
                )
                : {};

            if (sale < 0 || 100 < sale) {
                return next(
                    ApiError.badRequest('Re-enter the teacher percentage')
                )
            }

            if (name) {
                groupById.name = name;
            }
            if (sale) {
                groupById.sale = sale;
            }
            const lessonGroupOne = await LessonGroup.findOne({
                where: {
                    group_id: id,
                    status: "active",
                },
            });
            await GroupSchedule.destroy({
                where: {
                    status: 'active',
                    group_id: id,
                }
            });

            if (!week_data || week_data.length <= 0) {
                return next(
                    ApiError.badRequest('There is an error in the weekly data')
                );
            }
            const resWeekData = CountWeekdays.validateWeekData(week_data);
            if (resWeekData) {
                return next(
                    ApiError.badRequest('There is an error in the weekly data')
                )
            }

            let resAllTime = false;
            for (const data of week_data) {
                const groupSchedule = await GroupSchedule.findAll({
                    where: {
                        status: 'active',
                        day_of_week: data.week_day,
                        room_id: data.room_id
                    }
                });

                let resTime = false
                if (groupSchedule && groupSchedule.length > 0) {
                    for (const groupScheduleData of groupSchedule) {
                        const timeFunRes = timeFun(groupScheduleData.lesson_time, data.time);
                        if (!timeFunRes) {
                            resTime = true
                            break;
                        }
                    }
                }
                if (resTime) {
                    resAllTime = true
                    break;
                }

            }
            if (resAllTime) {
                return next(
                    ApiError.badRequest("At this time there is a lesson in the room")
                );
            }

            const groupScheduleAll = []
            for (const data of week_data) {
                const groupScheduleOne = await GroupSchedule.create({
                    room_id: data.room_id,
                    lesson_time: data.time,
                    group_id: id,
                    day_of_week: data.week_day,
                    teacher_id,
                });
                if (groupScheduleOne) {
                    groupScheduleAll.push(groupScheduleOne.day_of_week)
                }
            }

            if (lessonGroupOne) {
                lessonGroupOne.room_id = '';
                lessonGroupOne.lesson_time = '';
                lessonGroupOne.lesson_day = groupScheduleAll.join(",");
                lessonGroupOne.teacher_id = teacher_id;
                await lessonGroupOne.save();
            } else {
                await LessonGroup.create({
                    group_id: id,
                    lesson_day: groupScheduleAll.join(","),
                    teacher_id,
                });
            }
            if (month_payment) {
                groupById.month_payment = month_payment;
            }
            const teacherGroupOne = await TeacherGroups.findOne({
                where: { status: "active", group_id: id },
            });

            if (teacherGroupOne && teacher_id != teacherGroupOne.teacher_id) {
                teacherGroup = await TeacherGroups.update(
                    { status: "inactive" },
                    { where: { status: "active", group_id: id } }
                );
                createTeacher = await TeacherGroups.create({
                    teacher_id: teacher_id,
                    group_id: id,
                });
            }

            if (!groupById) {
                return next(ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`));
            }
            const groupUpdate = await groupById.save();
            if (!groupUpdate) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ groupUpdate, teacherGroup, createTeacher, groupStudent });
        } catch (error) {
            console.log(374, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async groupGet(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const groups = await Groups.findAll({ where: { status: "active" } });
            const teachers = await Teachers.findOne({
                where: { status: "active", id },
            });
            const teacherGroup = await TeacherGroups.findAll({
                where: { status: "active", teacher_id: id },
            });

            let groupListData = [];
            if (groups && teacherGroup && teachers) {
                groupListData = teacherGroup
                    .map((el) => {
                        const groupOne = groups.find((e) => e.id == el.group_id);
                        return (
                            groupOne && {
                                id: groupOne.id,
                                name: groupOne.name,
                                count_students: groupOne.count_students
                                    ? groupOne.count_students
                                    : "0",
                                month_payment: groupOne.month_payment
                                    ? groupOne.month_payment
                                    : "0",
                            }
                        );
                    })
                    .filter((e) => e && e);
            }
            const teacherData = {
                name: teachers.lastname + " " + teachers.firstname,
            };

            const groupList =
                groupListData &&
                groupListData.sort((a, b) => a.name.localeCompare(b.name));

            return res.json({ groupList, teacherData });
        } catch (error) {
            return next(ApiError.badRequest(`${error}, group get`));
        }

    }
    async groupTeacherGet(req, res, next) {
        try {
            const teachers = await Teachers.findAll({
                where: {
                    status: "active",
                },
            });

            const teacherGroup = await TeacherGroups.findAll({
                where: {
                    status: "active",
                },
            });

            const groups = await Groups.findAll({ where: { status: "active" } });

            let dataGroup = [];
            groups &&
                groups.forEach((el) => {
                    const teacherGroupOne = teacherGroup.find((e) => el.id == e.group_id);
                    const teacherOne =
                        teacherGroupOne &&
                        teachers.find((e) => e.id == teacherGroupOne.teacher_id);
                    if (!teacherOne) {
                        const data = {
                            id: el.id,
                            name: el.name,
                            count_students: el.count_students ? el.count_students : "0",
                            month_payment: el.month_payment ? el.month_payment : "0",
                        };
                        dataGroup.push(data);
                    }
                });

            let groupList =
                dataGroup && dataGroup.sort((a, b) => a.name.localeCompare(b.name));
            const teacherGroupList = teachers
                .map((el) => {
                    const groups =
                        teacherGroup && teacherGroup.filter((e) => e.teacher_id == el.id);
                    return {
                        id: el.id,
                        name: el.firstname + " " + el.lastname + " ",
                        phone: el.phone,
                        groups_count: groups && groups.length,
                    };
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            return res.json({ teacherGroupList, groupList });
        } catch (error) {
            console.log(236, error.stack);
            console.log(236, error);
            return next(ApiError.badRequest(error));
        }
    }
    async groupGetOne(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const teacherGroup = await TeacherGroups.findOne({
                where: { status: "active", group_id: id },
            });
            const groups = await Groups.findOne({
                where: { id, status: "active" },
            });

            const lesson_group = await LessonGroup.findOne({
                where: {
                    status: "active",
                    group_id: id,
                },
            });

            const groupSchedule = await GroupSchedule.findAll(({
                where: {
                    status: 'active',
                    group_id: id
                }
            }));



            const groupsList = {
                name: groups.name,
                teacher_id: teacherGroup.teacher_id,
                id: groups.id,
                month_payment: groups.month_payment,
                count_students: groups.count_students,
                sale: groups.sale,
                lesson_group: lesson_group && lesson_group.lesson_time && lesson_group.room_id && lesson_group,
                groupSchedule: lesson_group && lesson_group.lesson_time && lesson_group.room_id ? [] : groupSchedule
            };

            return res.json(groupsList);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
}

module.exports = new GroupsController();


