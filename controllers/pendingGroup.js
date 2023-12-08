const ApiError = require("../error/ApiError");
const {
    PendingGroups,
    TeacherGroups,
    Groups,
    Students,
    GroupStudents,
    StudentPending,
    Rooms, LessonGroup,
    GroupSchedule
} = require("../models/models");
const groupStudentCreate = require('./groupStudentCreate');
const timeFun = require('./timeFun');
const CountWeekdays = require('./countWeekdays')
const validateFun = require("./validateFun");
class PendingGroupsController {
    async PendingGroupsAdd(req, res, next) {
        try {
            const { name } = req.body;
            if (!name) {
                return next(
                    ApiError.badRequest("There is no group name")
                )
            }
            const pendingGroup = await PendingGroups.create({
                name
            })

            return res.json(pendingGroup)

        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async PendingGroupsDelete(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                return next(ApiError.badRequest("There is no group id"))
            }
            const pendingGroup = await PendingGroups.findOne({
                where: {
                    id,
                    status: 'active'
                }
            });
            if (!pendingGroup) {
                return next(
                    ApiError.badRequest('Group not found')
                )
            }

            pendingGroup.status = 'inactive';
            await pendingGroup.save();
            return res.send(`Group delete`);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async PendingGroupsPut(req, res, next) {
        try {
            const { id, name } = req.body;

            const pendingGroup = await PendingGroups.findOne({
                where: {
                    status: 'active',
                    id
                }
            });

            if (!pendingGroup) {
                return next(
                    ApiError.badRequest('Group not found')
                )
            };

            if (name) pendingGroup.name = name
            await pendingGroup.save();
            return res.json(pendingGroup);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async PendingGroupsGet(req, res, next) {
        try {

            const pendingGroup = await PendingGroups.findAll({
                where: {
                    status: 'active'
                }
            })
            return res.json(pendingGroup)
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async GroupsCreateGroupTable(req, res, next) {
        try {
            const { pendingGroupId, name, month_payment, sale, teacher_id, time, day, room_id, } = req.body;

            if (!pendingGroupId) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }
            if (!teacher_id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }
            if (!name) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }
            if (!month_payment) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }
            if (!time) {
                return next(
                    ApiError.badRequest("data is incomplete")
                )
            }

            if (!sale) {
                return next(
                    ApiError.badRequest("data is incomplete")
                )
            }else  if (sale < 0 || 100 < sale) {
                return next(
                    ApiError.badRequest('Re-enter the teacher percentage')
                )
            }


            if (!day) {
                return next(
                    ApiError.badRequest("data is incomplete")
                )
            } else {
                function validateArray(arr) {
                    for (let i = 0; i < arr.length; i++) {
                        const num = arr[i];
                        if (typeof num !== "number" || num < 1 || num > 7) {
                            return false;
                        }
                    }
                    return true;
                }

                const result = validateArray(day);
                if (!result) {
                    return next(
                        ApiError.badRequest('Error: Array contains invalid number(s).')
                    )
                }
            }
            if (!room_id) {
                return next(
                    ApiError.badRequest("data is incomplete")
                )
            }
            const room = await Rooms.findOne({
                where: {
                    status: 'active',
                    id: room_id
                }
            });
            if (!room) {
                return next(
                    ApiError.badRequest('no data found')
                )
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
            const day_seond = new Date().getDate();

            const pendingGroup = await PendingGroups.findOne({
                where: {
                    id: pendingGroupId,
                    status: 'active'
                }
            });

            if (!pendingGroup) {
                return next(
                    ApiError.badRequest("pendingGroup not found")
                );
            };

            const pendingStudent = await StudentPending.findAll({
                where: {
                    status: 'active',
                    group_id: pendingGroupId
                }
            });

            const groupScheduleAll = []
            for (const weekDay of day) {
                const groupScheduleOne = await GroupSchedule.create({
                    room_id,
                    lesson_time: time,
                    group_id: pendingGroupId,
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
                group_id: pendingGroupId,
                lesson_day: groupScheduleAll.join(','),
                teacher_id
            });

            await Groups.create({
                id: pendingGroupId,
                name,
                month_payment,
                sale,
                count_students: pendingGroup.count_students
            });


            await TeacherGroups.create({
                teacher_id,
                group_id: pendingGroupId
            });
            if (pendingStudent) {
                for (let studentsData of pendingStudent) {
                    await Students.create({
                        id: studentsData.id,
                        firstname: studentsData.firstname,
                        gender: studentsData.gender,
                        birthday: studentsData.birthday,
                        lastname: studentsData.lastname,
                        fathername: studentsData.fathername,
                        address: studentsData.address,
                        fatherPhone: studentsData.fatherPhone,
                        motherPhone: studentsData.motherPhone,
                        science: [],
                        class: studentsData.class
                    });
                    await GroupStudents.create({
                        student_id: studentsData.id,
                        group_id: pendingGroupId,
                        month_payment
                    });
                    await groupStudentCreate({ student_id: studentsData.id, group_id: pendingGroupId, summa: month_payment, day: day_seond });
                }
            }

            const pendingGroupDelete = await PendingGroups.destroy({
                where: {
                    id: pendingGroupId,
                    status: 'active'
                }
            });

            const pendingStudentDelete = await StudentPending.destroy({
                where: {
                    status: 'active',
                    group_id: pendingGroupId
                }
            });
            return res.json({ pendingGroupDelete, pendingStudentDelete })

        } catch (error) {
            console.log(101, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async GroupsCreateGroupLeessonTable(req, res, next) {
        try {
            const { pendingGroupId, name, month_payment, sale, teacher_id, week_data } = req.body;

            if (!pendingGroupId) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }
            if (!teacher_id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }
            if (!name) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }
            if (!month_payment) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }

            if (!sale) {
                return next(
                    ApiError.badRequest("data is incomplete")
                )
            }else if (sale < 0 || 100 < sale) {
                return next(
                    ApiError.badRequest('Re-enter the teacher percentage')
                )
            }

            if (!week_data || week_data.length <= 0) {
                return next(
                  ApiError.badRequest('There is an error in the weekly data')
                )
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

            const day_seond = new Date().getDate();

            const pendingGroup = await PendingGroups.findOne({
                where: {
                    id: pendingGroupId,
                    status: 'active'
                }
            });

            if (!pendingGroup) {
                return next(
                    ApiError.badRequest("pendingGroup not found")
                );
            };

            const pendingStudent = await StudentPending.findAll({
                where: {
                    status: 'active',
                    group_id: pendingGroupId
                }
            });

            const groupScheduleAll = []
            for (const data of week_data) {
                const groupScheduleOne = await GroupSchedule.create({
                    room_id: data.room_id,
                    lesson_time: data.time,
                    group_id: pendingGroupId,
                    day_of_week: data.week_day,
                    teacher_id,
                });
                if (groupScheduleOne) {
                    groupScheduleAll.push(groupScheduleOne.day_of_week)
                }
            }

            await LessonGroup.create({
                group_id: pendingGroupId,
                lesson_day: groupScheduleAll.join(','),
                teacher_id
            });

            await Groups.create({
                id: pendingGroupId,
                name,
                month_payment,
                sale,
                count_students: pendingGroup.count_students
            });


            await TeacherGroups.create({
                teacher_id,
                group_id: pendingGroupId
            });
            if (pendingStudent) {
                for (let studentsData of pendingStudent) {
                    await Students.create({
                        id: studentsData.id,
                        firstname: studentsData.firstname,
                        gender: studentsData.gender,
                        birthday: studentsData.birthday,
                        lastname: studentsData.lastname,
                        fathername: studentsData.fathername,
                        address: studentsData.address,
                        fatherPhone: studentsData.fatherPhone,
                        motherPhone: studentsData.motherPhone,
                        science: [],
                        class: studentsData.class
                    });
                    await GroupStudents.create({
                        student_id: studentsData.id,
                        group_id: pendingGroupId,
                        month_payment
                    });
                    await groupStudentCreate({ student_id: studentsData.id, group_id: pendingGroupId, summa: month_payment, day: day_seond });
                }
            }

            const pendingGroupDelete = await PendingGroups.destroy({
                where: {
                    id: pendingGroupId,
                    status: 'active'
                }
            });

            const pendingStudentDelete = await StudentPending.destroy({
                where: {
                    status: 'active',
                    group_id: pendingGroupId
                }
            });
            return res.json({ pendingGroupDelete, pendingStudentDelete })

        } catch (error) {
            console.log(101, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

}

module.exports = new PendingGroupsController();
