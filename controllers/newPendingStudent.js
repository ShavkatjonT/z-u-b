const ApiError = require("../error/ApiError");
const {
    PendingGroups,
    StudentPending,
    TeacherGroups,
    Groups,
    Teachers,
    Students,
    GroupStudents
} = require("../models/models");
const groupStudentCreate = require('./groupStudentCreate')
const sequelize = require("../db");
const validateFun = require("./validateFun");
class NewPendingStudentController {
    async studentAdd(req, res, next) {
        try {
            const {
                firstname,
                gender,
                birthday,
                lastname,
                fathername,
                address,
                fatherPhone,
                motherPhone,
                group_id,
                classStudentdent
            } = req.body;
            const pendingGroup = await PendingGroups.findOne({
                where: {
                    status: 'active',
                    id: group_id
                }
            });

            if (!pendingGroup) {
                return next(
                    ApiError.badRequest('Group not found')
                )
            }

            if (
                firstname &&
                gender &&
                birthday &&
                lastname &&
                address &&
                fatherPhone &&
                group_id
            ) {
                const student = await StudentPending.create({
                    firstname: firstname,
                    gender: gender,
                    birthday: birthday,
                    lastname: lastname,
                    fathername: fathername,
                    address: address,
                    fatherPhone: fatherPhone,
                    motherPhone: motherPhone,
                    group_id,
                    class: classStudentdent
                });


                pendingGroup.students = pendingGroup.students ? [...pendingGroup.students, student.id] : [...[], student.id];
                pendingGroup.count_students = String(Number(pendingGroup.count_students) + 1);
                await pendingGroup.save();

                return res.json({ student });
            }
        } catch (error) {
            console.log(59, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async studentDelete(req, res, next) {
        try {
            const { id } = req.body;
            const student = await StudentPending.findOne({
                where: {
                    id,
                    status: 'active'
                }
            });

            if (!student) {
                return next(
                    ApiError.badRequest('Student not found')
                )
            }

            const pendingGroup = await PendingGroups.findOne({
                where: {
                    id: student.group_id,
                    status: 'active'
                }
            });


            if (!pendingGroup) {
                return next(
                    ApiError.badRequest('Group not found')
                )
            };

            let studentsData = pendingGroup.students && pendingGroup.students;
            studentsData && studentsData.splice(studentsData.indexOf(id), 1);
            pendingGroup.students = [...[], []];
            pendingGroup.count_students = String(Number(pendingGroup.count_students) - 1);
            await pendingGroup.save();
            student.status = 'inactive';
            await student.save();
            pendingGroup.students = studentsData;
            await pendingGroup.save();
            return res.json({ pendingGroup })
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async studentPut(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const {
                firstname,
                gender,
                birthday,
                lastname,
                fathername,
                address,
                fatherPhone,
                motherPhone,
                classStudentdent
            } = req.body;

            const findPersonById = await StudentPending.findOne({ where: { id, status: 'active' } });

            if (!findPersonById) {
                return next(ApiError.badRequest(`Ushbu idli o'quvchi topilmadi`));
            }

            if (firstname) findPersonById.firstname = firstname;
            if (gender) findPersonById.gender = gender;
            if (birthday) findPersonById.birthday = birthday;
            if (lastname) findPersonById.lastname = lastname;
            if (fathername) findPersonById.fathername = fathername;
            if (address) findPersonById.address = address;
            if (fatherPhone) findPersonById.fatherPhone = fatherPhone;
            if (motherPhone) findPersonById.motherPhone = motherPhone;
            if (classStudentdent) findPersonById.class = classStudentdent;

            const studentUpdate = await findPersonById.save();
            if (!studentUpdate) {
                return next(
                    ApiError.badRequest(
                        `Ush bu ${id} id tegishli malumotlarni o'zgartirib bo'lmadi`
                    )
                );
            }
            res.json({ studentUpdate });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async studentGetOne(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const student = await StudentPending.findOne({
                where: { id, status: "active" },
            });

            let studentList = {
                firstname: student.firstname,
                lastname: student.lastname,
                fathername: student.fathername,
                gender: student.gender,
                birthday: student.birthday,
                address: student.address,
                fatherPhone: student.fatherPhone,
                motherPhone: student.motherPhone,
                class: student.class
            };

            res.json(studentList);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async studentGroupGetList(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const pendingGroup = await PendingGroups.findOne({
                where: {
                    status: 'active',
                    id
                }
            });

            const teacherGroup = await TeacherGroups.findAll({
                where: {
                    status: "active",
                },
            });
            const group = await Groups.findAll({
                where: {
                    status: "active",
                },
            });
            const teachers = await Teachers.findAll({
                where: { status: "active" },
            });
            const groupName = teacherGroup && group && teacherGroup.map((el) => {
                const groupOne = group.find((e) => e.id == el.group_id);
                return groupOne && {
                    teacher_id: el.teacher_id,
                    name: groupOne.name,
                    id: groupOne.id,
                    month_payment: groupOne.month_payment
                }
            }).filter((e) => e && e);



            const groupData = groupName && teacherGroup && group && teachers && teachers.map((el) => {
                const groupOne = groupName.filter((e) => e.teacher_id == el.id);
                return {
                    id: el.id,
                    name: el.firstname + ' ' + el.lastname,
                    group: groupOne ? groupOne : []
                }
            });

            const pending_student = await StudentPending.findAll({
                where: {
                    status: 'active'
                }
            });

            const students = pending_student && pendingGroup && pendingGroup.students && pendingGroup.students.length > 0 && pendingGroup.students.map((el) => {
                const studentOne = pending_student.find((e) => e.id == el)
                return studentOne
            }).filter((el) => el && el);

            const studentSort = students && students.sort((a, b) => a.firstname.localeCompare(b.firstname));

            const studentList =
                studentSort &&
                pendingGroup &&
                studentSort.map((el) => {
                    const data = {
                        id: el.id,
                        firstname: el.firstname,
                        lastname: el.lastname,
                        Fphone: el.fatherPhone,
                        address: el.address,
                        Mphone: el.motherPhone,
                    };
                    return data;
                });

            return res.json({ studentList, pendingGroup, groupData });
        } catch (error) {
            console.log(245, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async studentCreateStudentTable(req, res, next) {
        try {
            const { pendingGroupId, group_id, student_id, summa } = req.body;

            if (!pendingGroupId) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };

            if (summa >= 0) {
                let inNumber = typeof summa;
                if (inNumber !== "number") {
                    return next(ApiError.badRequest("Summani raqamda kiriting"));
                }
            } else {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            }



            if (!group_id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };

            if (!student_id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            };


            const groups = await Groups.findOne({
                where: {
                    id: group_id,
                    status: 'active'
                }
            });
            if (!groups) {
                return next(
                    ApiError.badRequest("Groups not found")
                );
            };
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
            const pendingStudent = await StudentPending.findOne({
                where: {
                    id: student_id,
                    status: 'active'
                }
            });
            if (!pendingStudent) {
                return next(
                    ApiError.badRequest("pendingStudent not found")
                );
            };

            await GroupStudents.create({
                student_id,
                group_id,
                month_payment: summa
            });
            await Students.create({
                id: student_id,
                firstname: pendingStudent.firstname,
                gender: pendingStudent.gender,
                birthday: pendingStudent.birthday,
                lastname: pendingStudent.lastname,
                fathername: pendingStudent.fathername,
                address: pendingStudent.address,
                fatherPhone: pendingStudent.fatherPhone,
                motherPhone: pendingStudent.motherPhone,
                science: [],
                class: pendingStudent.class
            })
            const day = new Date().getDate();
            await groupStudentCreate({ student_id, group_id, day, summa });
            groups.count_students = String(Number(groups.count_students) + 1);
            const groupCount = await groups.save();

            let studentsData = pendingGroup.students && pendingGroup.students;
            studentsData && studentsData.splice(studentsData.indexOf(student_id), 1);
            pendingGroup.students = [...[], []];
            pendingGroup.count_students = String(Number(pendingGroup.count_students) - 1);
            await pendingGroup.save();
            pendingGroup.students = studentsData;
            await pendingGroup.save();

            const studentDelete = await StudentPending.destroy({
                where: {
                    id: student_id,
                    status: 'active'
                }
            });

            return res.json({ groupCount, pendingGroup, studentDelete })
        } catch (error) {
            console.log(331, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

}

module.exports = new NewPendingStudentController();
