const ApiError = require("../error/ApiError");
const {
    Rooms,
    LessonGroup,
    GroupSchedule
} = require("../models/models");
const validateFun = require("./validateFun");
class RoomsController {
    async roomAdd(req, res, next) {
        try {
            const { name, count_students } = req.body;
            if (!name) {
                return next(
                    ApiError.badRequest('Data is incomplete')
                )
            }
            if (!count_students) {
                return next(
                    ApiError.badRequest('Data is incomplete')
                )
            }
            const room = await Rooms.create({
                name,
                count_students
            });


            return res.json(room)
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async roomDeleteOne(req, res, next) {
        try {
            const { id } = req.body;
            const room = await Rooms.findOne({
                where: {
                    status: 'active',
                    id
                }
            })

            const groupSchedule = await GroupSchedule.findOne({
                where: {
                    status: 'active',
                    room_id: id
                }
            });


            if (groupSchedule) {
                return next(
                    ApiError.badRequest('There is a lesson in this room')
                )
            }
            room.status = groupSchedule ? 'active' : 'inactive'
            await room.save();
            return res.json(room)
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async roomPut(req, res, next) {
        try {
            const { id, name, count_students } = req.body;

            const room = await Rooms.findOne({
                where: {
                    status: 'active',
                    id
                }
            })

            if (name) room.name = name
            if (count_students) room.count_students = count_students
            await room.save()

            return res.json({ room })
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async roomAllGet(req, res, next) {
        try {

            const groupSchedule = await GroupSchedule.findAll({
                where: {
                    status: 'active'
                }
            });
            const rooms = await Rooms.findAll({
                where: {
                    status: 'active'
                }
            });

            const roomFilter = rooms.map((el) => {
                const lessonGroupRoom = groupSchedule.find((e) => e.room_id == el.id);
                return {
                    id: el.id,
                    name: el.name,
                    deleteActive: lessonGroupRoom ? false : true,
                    count_students: el.count_students
                }
            }).sort((a, b) => a.name.localeCompare(b.name))

            return res.json(roomFilter)
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async roomLessonGet(req, res, next) {
        try {
            const colors = {
                0: '#FDC600',
                1: '#042954',
                2: '#D32F2F',
                3: '#037903',
                4: '#1976D2',
                5: '#2C3842',

            }
            const rooms = await Rooms.findAll({
                where: {
                    status: 'active'
                }
            });

            const randomFun = () => {
                const number = Math.floor(Math.random() * 6);
                return colors[number]
            }

            const roomFilter = rooms.map((el) => {
                return {
                    id: el.id,
                    text: el.name,
                    color: randomFun()
                }
            });

            return res.json(roomFilter)
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
}

module.exports = new RoomsController();
