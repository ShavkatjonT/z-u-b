const ApiError = require("../error/ApiError");
const { TeacherGroups, Groups, Teachers } = require("../models/models");
const validateFun = require("./validateFun");
class teacherGroupsController {
    async teacherGroupsAdd(req, res, next) {
        try {
            const {
                teacher_id,
                group_id
            } = req.body;
            if (!teacher_id) {
                return next(ApiError.badRequest("student idsi yo'q "));
            } else {
                const studentOne = await Teachers.findOne({
                    where: { id: teacher_id, status: "active" },
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
            const teacherGroups = await TeacherGroups.create({
                teacher_id,
                group_id,
            });
            res.json({ teacherGroups });
        } catch (error) {
            return next(
                ApiError.badRequest(`${error} , teacherGroups add`)
            )
        }
    }
    async teacherGroupsDelete(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const TeacherGroupsById = await TeacherGroups.findOne({ where: { id } });
            if (!TeacherGroupsById) {
                return next(
                    ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`)
                );
            }
            TeacherGroupsById.status = "inactive";
            const TeacherGroupsDeletes = await TeacherGroupsById.save();
            if (!TeacherGroupsDeletes) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ TeacherGroupsDeletes });
        } catch (error) {
            return next(
                ApiError.badRequest(`${error}, TeacherGroups delete`)
            )
        }
    }
    async teacherGroupsPut(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const { teacher_id, group_id } = req.body;
            const teacherGroupsById = await TeacherGroups.update({ teacher_id: teacher_id, group_id: group_id },
                { where: { id, status: 'active' } })

            if (!teacherGroupsById) {
                return next(
                    ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`)
                );
            }
            if (teacher_id) teacherGroupsById.teacher_id = teacher_id;
            if (group_id) teacherGroupsById.group_id = group_id;

            const teacherGroupsUpdate = await teacherGroupsById.save();
            if (!teacherGroupsUpdate) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ teacherGroupsUpdate });
        } catch (error) {
            return next(
                ApiError.badRequest(`${error}, teacherGroups put`)
            )
        }
    }
    async teacherGroupsGet(req, res, next) {
        try {
            const teacherGroups = await TeacherGroups.findAll({
                where: { status: "active" },
            });
            res.json(teacherGroups);
        } catch (error) {
            return next(
                ApiError.badRequest(`${error}, teacherGroups get`)
            );
        }
    }
}

module.exports = new teacherGroupsController();
