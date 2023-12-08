const ApiError = require("../error/ApiError");
const { Sciences , Students, GroupStudents, Groups, TeacherGroups, Teachers} = require("../models/models");
const validateFun = require("./validateFun");
class SciencesController {
    async sciencesAdd(req, res, next) {
        try {
            const { name } = req.body;
            const sciences = await Sciences.create({
                name,
            });

            res.json({ sciences });
        } catch (error) {
            return next(
                ApiError.badRequest(error)
              )
        }
    }
    async sciencesDelete(req, res, next) {
        try {
            const { id } = req.body;
            const sciencesById = await Sciences.findOne({ where: { id } });
            if (!sciencesById) {
                return next(
                    ApiError.badRequest(
                        `Ushbu ${id} idli malumotlar  topilmadi`
                    )
                );
            }
            sciencesById.status = "inactive";
            const sciencesDeletes = await sciencesById.save();
            if (!sciencesDeletes) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ sciencesDeletes });
        } catch (error) {
            return next(
                ApiError.badRequest(error)
              )
        }
    }
    async sciencesPut(req, res, next) {
        try {
            const { name , id } = req.body;
            const SciencesById = await Sciences.findOne({ where: { id } });

            if (!SciencesById) {
                return next(
                    ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`)
                );
            }
            if (name) SciencesById.name = name;
            const sciencesUpdate = await SciencesById.save();
            if (!sciencesUpdate) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ sciencesUpdate });
        } catch (error) {
            return next(
                ApiError.badRequest(error)
              )
        }
    }
    async sciencesGet(req, res, next) {
        try {
            const sciences = await Sciences.findAll({
                where: { status: "active" },
            });
            res.json(sciences);
        } catch (error) {
            return next(
                ApiError.badRequest(error)
              )
        }
    }
    async sciencesStudentGet (req, res, next){
        try {
            const sciences = await Sciences.findAll({
                where: { status: "active" },
            });
            const data =sciences && sciences.map((e)=>{
                return {
                    name:e.name,
                    id:e.id
                }
            })
            res.json(data);
        } catch (error) {
            return next(
                ApiError.badRequest(error)
              )
        }
    }
}

module.exports = new SciencesController();
