const ApiError = require("../error/ApiError");
const {
    GroupSchedule,
    Groups,
    Rooms,
    LessonGroup,
    Teachers
} = require("../models/models");
const sequelize = require('../db');
const validateFun = require("./validateFun");
const weekDayFun = (arg) => {
    let day;
    switch (arg) {
        case 1:
            day = 'Du'
            break;
        case 2:
            day = 'Se'
            break;
        case 3:
            day = 'Cho'
            break;
        case 4:
            day = 'Pa'
            break;
        case 5:
            day = 'Ju'
            break;
        case 6:
            day = 'Sha'
            break;
        case 7:
            day = 'Ya'
            break;
        default:
            break;
    }
    return day
}
const weekDayExcelFun = (arg) => {
    let day;
    switch (arg) {
        case 1:
            day = 'Dushanba'
            break;
        case 2:
            day = 'Seshanba'
            break;
        case 3:
            day = 'Choshanba'
            break;
        case 4:
            day = 'Pashanba'
            break;
        case 5:
            day = 'Juma'
            break;
        case 6:
            day = 'Shanba'
            break;
        case 7:
            day = 'Yashanba'
            break;
        default:
            break;
    }
    return day
}


class LessonController {
    async lessonAllGet(req, res, next) {
        try {
            const weekDay = [1, 2, 3, 4, 5, 6, 7];
            const query = `SELECT lg.id AS lesson_group_id, lg.lesson_day, lg.lesson_time, lg.room_id, g.name AS group_name, g.status AS group_status,
            r.name AS room_name, r.status AS room_status, t.firstname AS teacher_firstname, t.lastname AS teacher_lastname, t.status AS teacher_status
     FROM lesson_groups lg
     JOIN Groups g ON lg.group_id::VARCHAR(255) = g.id::VARCHAR(255) AND g.status = 'active'
     JOIN Rooms r ON lg.room_id = r.id::VARCHAR(255) AND r.status::VARCHAR(255) = 'active'
     JOIN Teachers t ON lg.teacher_id::VARCHAR(255) = t.id::VARCHAR(255);`
            const lessonGroup = await sequelize.query(query);

            let weekDayData = []
            if (lessonGroup) {
                for (const day of weekDay) {
                    const lessonDay = lessonGroup[0].filter((el) => el.lesson_day.split(',').map((e) => Number(e)).includes(day));
                    const data = lessonDay && {
                        weekDay: day,
                        data: []
                    }
                    if (lessonDay) {
                        lessonDay.forEach((el) => {
                            // start date
                            const startDate = new Date();
                            // const startDate = new Date().toLocaleString("en-US", {timeZone: "Asia/Tashkent"});
                            startDate.setHours(Number(el.lesson_time.split('-')[0].split(':')[0]))
                            startDate.setMinutes(Number(el.lesson_time.split('-')[0].split(':')[1]))
                            startDate.setSeconds(0);
                            // end date
                            const endDate = new Date();
                            // const endDate = new Date().toLocaleString("en-US", {timeZone: "Asia/Tashkent"});
                            endDate.setHours(Number(el.lesson_time.split('-')[1].split(':')[0]))
                            endDate.setMinutes(Number(el.lesson_time.split('-')[1].split(':')[1]))
                            endDate.setSeconds(0);

                            const textData = {
                                group: el.group_name,
                                teacher: el.teacher_firstname,
                                room: el.room_name,
                                day: el.lesson_day.split(',').map((e) => Number(e)).map((e) => weekDayFun(e)).join(',')
                            }

                            const resData = {
                                room_id: el.room_id,
                                startDate: new Object(new Date(startDate)),
                                endDate: new Object(new Date(endDate)),
                                text: JSON.stringify(textData)
                            }
                            data.data.push(resData)

                        })

                    }

                    weekDayData.push(data)
                }

            }


            return res.json(weekDayData)
        } catch (error) {
            console.log(34, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async lessonAllWeekdayGet(req, res, next) {
        try {
            const { day } = req.params;

            if (isNaN(day)) {
                return next(
                    ApiError.badRequest('no data found')
                )
            }
            const weekDay = Number(day);
            if (weekDay < 1 || weekDay > 7) {
                return next(
                    ApiError.badRequest('no data found')
                )
            }

            const groupSchedule = await GroupSchedule.findAll({
                where: {
                    status: 'active',
                    day_of_week: weekDay
                }
            });
            const groups = await Groups.findAll({
                where: {
                    status: 'active',

                }
            });
            const rooms = await Rooms.findAll({
                where: {
                    status: 'active',

                }
            });
            const teachers = await Teachers.findAll({
                where: {
                    status: 'active',

                }
            });
            const lessonGroups = await LessonGroup.findAll({
                where: {
                    status: 'active',
                }
            });
            const resData = []
            if (groupSchedule) {
                for (const data of groupSchedule) {
                    const group = groups.find((e) => e.id == data.group_id)
                    const lessonGroup = lessonGroups.find((e) => e.group_id == data.group_id)
                    const room = rooms.find((e) => e.id == data.room_id)
                    const teacher = teachers.find((e) => e.id == data.teacher_id)
                    if (group && lessonGroup && room) {
                        // start date
                        const startDate = new Date();
                        // const startDate = new Date().toLocaleString("en-US", {timeZone: "Asia/Tashkent"});
                        startDate.setHours(Number(data.lesson_time.split('-')[0].split(':')[0]))
                        startDate.setMinutes(Number(data.lesson_time.split('-')[0].split(':')[1]))
                        startDate.setSeconds(0);
                        // end date
                        const endDate = new Date();
                        // const endDate = new Date().toLocaleString("en-US", {timeZone: "Asia/Tashkent"});
                        endDate.setHours(Number(data.lesson_time.split('-')[1].split(':')[0]))
                        endDate.setMinutes(Number(data.lesson_time.split('-')[1].split(':')[1]))
                        endDate.setSeconds(0);

                        const textData = {
                            group: group.name,
                            teacher: teacher ? teacher.firstname + ' ' + teacher.lastname : 'Biriktirilmagan',
                            room: room.name,
                            day: lessonGroup.lesson_day.split(',').map((e) => Number(e)).map((e) => weekDayFun(e)).join(',')
                        }


                        const finishresData = {
                            room_id: data.room_id,
                            startDate: new Object(new Date(startDate)),
                            endDate: new Object(new Date(endDate)),
                            text: JSON.stringify(textData)
                        }

                        resData.push(finishresData)
                    }

                }
            }

            return res.json(resData)
        } catch (error) {
            console.log(34, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async lessonAllWeekdayExcelGet(req, res, next) {
        try {

            const weekDay = [1, 2, 3, 4, 5, 6, 7]
            const groupSchedule = await GroupSchedule.findAll({
                where: {
                    status: 'active',
                }
            });
            const groups = await Groups.findAll({
                where: {
                    status: 'active',

                }
            });
            const rooms = await Rooms.findAll({
                where: {
                    status: 'active',

                }
            });
            const teachers = await Teachers.findAll({
                where: {
                    status: 'active',

                }
            });
            const lessonGroups = await LessonGroup.findAll({
                where: {
                    status: 'active',
                }
            });

            const dataFilter = weekDay.map((day) => {
                const resData = {
                    day: weekDayExcelFun(day),
                    lesson: []
                }
                const groupScheduleOne = groupSchedule.filter((e) => e.day_of_week == day);
                if (groupScheduleOne && groupScheduleOne.length > 0) {
                    for (const data of groupScheduleOne) {
                        const group = groups.find((e) => e.id == data.group_id)
                        const lessonGroup = lessonGroups.find((e) => e.group_id == data.group_id)
                        const room = rooms.find((e) => e.id == data.room_id)
                        const teacher = teachers.find((e) => e.id == data.teacher_id)
                        if (group && lessonGroup && room) {
                            const textData = {
                                group: group.name,
                                teacher: teacher ? teacher.firstname + ' ' + teacher.lastname : 'Biriktirilmagan',
                                room: room.name,
                                day: lessonGroup.lesson_day.split(',').map((e) => Number(e)).map((e) => weekDayExcelFun(e)).join(',')
                            }
                            const finishresData = {
                                room_id: data.room_id,
                                startDate: data.lesson_time.split('-')[0],
                                endDate: data.lesson_time.split('-')[1],
                                text: textData
                            }

                            resData.lesson.push(finishresData)
                        }

                    }
                }
                return resData
            });
            return res.json(dataFilter)
        } catch (error) {
            console.log(34, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

}

module.exports = new LessonController();
