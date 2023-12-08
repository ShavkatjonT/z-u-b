const ApiError = require("../error/ApiError");
const {
    StudentOther,
    Sciences,
    ExamStudents,
    Exams
} = require("../models/models");
function formatDate(dateString) {
    let parts = dateString.split('-');
    let formattedDate = parts[1] + '.' + parts[0] + '.' + parts[2];
    return formattedDate;
}
const sendMessage = require('./sendMessageController');
const validateFun = require("./validateFun");
class NewPendingStudentController {
    async studentAdd(req, res, next) {
        try {
            const {
                firstname,
                lastname,
                fathername,
                fatherPhone,
                science,
                classStudentdent,
                exam_id
            } = req.body;

            if (!exam_id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }

            const exam = await Exams.findOne({ where: { id: exam_id, status: 'active' } });
            if (!exam) {
                return next(
                    ApiError.badRequest('No data found')
                )
            }

            if (!firstname) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };
            if (!lastname) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };
            if (!fatherPhone) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };
            if (!science) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };
            if (!classStudentdent) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };

            const student = await StudentOther.create({
                firstname: firstname,
                lastname: lastname,
                fathername: fathername,
                phone: fatherPhone,
                class: classStudentdent,
                science
            });

            const examStudents = await ExamStudents.create({
                exam_id,
                student_other_id: student.id
            });

            const sendData = [{
                text: `Farzandingiz ${formatDate(exam.date)}-kuni bo'ladigan test sinoviga ro'yxatdan o'tdi. Imtihon vaqti va xonasi haqida qo'shimcha ma'lumot beriladi.
907024500
ZUKKO INM`,
                phone: fatherPhone
            }]

             sendMessage(sendData)

            return res.json({ student, examStudents });

        } catch (error) {
            console.log(59, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async studentDelete(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };

            const student = await StudentOther.findOne({
                where: {
                    status: 'active',
                    id
                }
            });



            if (!student) {
                return next(
                    ApiError.badRequest('No data found')
                )
            }

            const examStudents = await ExamStudents.destroy({
                where: {
                    status: 'active',
                    student_other_id: id
                }
            });

            student.status = 'inactive'

            await student.save();

            return res.send('The student has been deleted');
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async studentPut(req, res, next) {
        try {
            const {
                id,
                firstname,
                lastname,
                fatherPhone,
                science,
                classStudentdent
            } = req.body;

            if (!id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };
            const student = await StudentOther.findOne({
                where: {
                    status: 'active',
                    id
                }
            });

            if (!student) {
                return next(
                    ApiError.badRequest('No data found')
                )
            }

            if (firstname) {
                student.firstname = firstname;
            };
            if (lastname) {
                student.lastname = lastname;
            };
            if (fatherPhone) {
                student.phone = fatherPhone;
            };
            if (science) {
                student.science = [...[], []];
            };
            await student.save()
            if (science) student.science = science;
            if (classStudentdent) {
                student.class = classStudentdent
            };
            await student.save();
            return res.json(student)
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async studentGet(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
              }
            const sciences = await Sciences.findAll({
                where: {
                    status: 'active'
                }
            });

            const students = await StudentOther.findAll({
                where: {
                    status: 'active'
                }
            });

            const examStudents = await ExamStudents.findAll({
                where: {
                    status: 'active',
                    exam_id: id
                }
            });

            const dataStudentOther = examStudents && examStudents
                .map((el) => {
                    if (el.student_other_id) {
                        const studentOne = students.find(
                            (e) => (e.id == el.student_other_id)
                        );
                        const sciencesStudentOtherOne =
                            studentOne &&
                            studentOne.science &&
                            studentOne.science.map((e) => {
                                const scienceOne = sciences.find((ele) => ele.id == e);
                                return {
                                    id: scienceOne && scienceOne.id && scienceOne.id,
                                    name: scienceOne && scienceOne.name && scienceOne.name,
                                };
                            });
                        return (
                            studentOne && {
                                id: studentOne.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                            }
                        );
                    }
                })
                .filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));
            return res.json(dataStudentOther)
        } catch (error) {
            console.log(232, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

}

module.exports = new NewPendingStudentController();
