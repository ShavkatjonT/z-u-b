const ApiError = require("../error/ApiError");
const { Students, GroupStudents, TeacherGroups, Teachers, Groups } = require("../models/models");
// const { Columns } = require("../models/models");
const groupStudentCreate = require('./groupStudentCreate')
const sequelize = require("../db");
const validateFun = require("./validateFun");
let date = new Date();
class StudentPendingController {
    async studentPendingAdd(req, res, next) {
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
            } = req.body;
            if (!firstname) {
                return next(ApiError.badRequest("Data is incomplete"));
            }
            if (!fathername) {
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
            if (!fatherPhone) {
                return next(ApiError.badRequest("Data is incomplete"));
            }
            if (!motherPhone) {
                return next(ApiError.badRequest("Data is incomplete"));
            }

            // const columnsDefault = await Columns.findOne({
            //   where: {
            //     order: 1,
            //     status: "active",
            //   },
            // });

            const student = await Students.create({
                firstname: firstname,
                gender: gender,
                birthday: birthday,
                lastname: lastname,
                fathername: fathername,
                address: address,
                fatherPhone: fatherPhone,
                motherPhone: motherPhone,
                status: "pending",
            });

            // columnsDefault.items = [...columnsDefault.items, student.id]
            // await columnsDefault.save();

            return res.json({ student });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async studentPendingDelete(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const findPersonById = await Students.findOne({ where: { id } });
            if (!findPersonById) {
                return next(
                    ApiError.badRequest(`Ushbu ${id} idli malumotlar topilmadi`)
                );
            }
            findPersonById.status = 'inactive';
            await findPersonById.save()

            res.json({ findPersonById });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async studentPendingPut(req, res, next) {
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

            const findPersonById = await Students.findOne({ where: { id } });

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
            if (classStudentdent) findPersonById.class = motherPhone;

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
    async studentPendingGet(req, res, next) {
        try {
            const student = await Students.findAll({
                where: { status: "pending" },
            });
            res.json(student);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async studentPendingGetOne(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
              }
            const student = await Students.findOne({
                where: { id, status: "pending" },
            });
            res.json(student);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async studentPendingGetList(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
              }
            const student = await Students.findAll();
            const groupStudents = await GroupStudents.findAll({
                where: { status: "active", group_id: id },
            });
            let groupStudentList;
            const studentListOne = student.filter((e) => e.status !== "inactive");

            const studentList = studentListOne.map((el) => {
                groupStudentList = groupStudents.find((e) => e.student_id == el.id);
                if (!groupStudentList) {
                    return {
                        id: el.id,
                        name: el.firstname + " " + el.lastname + " " + el.fathername,
                    };
                }
            });

            const studentPendingList = studentList.filter((e) => e && e);

            const studentFuc = async () => {
                const data = await Promise.all(
                    studentPendingList.map(async (e) => await e)
                );
                return res.json(data);
            };
            const studentResult = studentFuc();
            return studentResult;

            res.json(student);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async studentPendingAllGetList(req, res, next) {
        try {
            const studentListOne = await Students.findAll({
                where: { status: "pending" },
            });
            const studentList = studentListOne.map((e) => {
                return {
                    id: e.id,
                    name: e.firstname + " " + e.lastname,
                    phone: e.fatherPhone ? e.fatherPhone : e.motherPhone,
                    age: String(date.getFullYear() - Number(e.birthday.substring(0, 4))),
                    address: e.address,
                    status: e.status,
                };
            }).sort((a, b) => a.name.localeCompare(b.name));
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

            return res.json({ groupData, studentList });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async studentPendingAllGetListNew(req, res, next) {
        try {
            const query = `WITH RankedGroupStudents AS (
                SELECT 
                    gs.id AS group_student_id,
                    gs.status AS group_student_status,
                    gs.group_id,
                    gs.student_id,
                    gs."updatedAt" As group_student_updated_at,
                    ROW_NUMBER() OVER (PARTITION BY gs.student_id ORDER BY gs."updatedAt" DESC) AS row_num
                FROM 
                    group_students gs
            )
            SELECT 
                s.id AS student_id,
                s.lastname,
                s.firstname,
                s."fatherPhone",
                s.birthday,
                s.status AS student_status,
                rgs.group_student_id,
                rgs.group_student_status,
                rgs.group_id,
                rgs.group_student_updated_at
                
            FROM 
                students s
            JOIN 
                RankedGroupStudents rgs ON s.id::VARCHAR(255) = rgs.student_id::VARCHAR(255)
            WHERE 
                s.status = 'pending'
                AND rgs.row_num = 1;
            `;

            const student = await sequelize.query(query);
            let studentUpdate = []
            if (student && student.length > 0) {
                studentUpdate = student[0].map((el) => {
                    return el && {
                        id: el?.student_id,
                        name: el?.firstname + ' ' + el?.lastname,
                        phone: el?.fatherPhone,
                        status: el?.student_status,
                        age: String(date.getFullYear() - Number(el?.birthday.substring(0, 4))),
                        createdAt: new Date(el?.group_student_updated_at).getFullYear() + '-' + (new Date(el?.group_student_updated_at).getMonth() + 1) + '-' + new Date(el?.group_student_updated_at).getDate(),
                    }
                }).filter((el) => el && el);

            }

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


            res.json({ groupData, studentList: studentUpdate })
        } catch (error) {
            console.log(272, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async studentPendingGroupAdd(req, res, next) {
        try {
            const { student_id, summa, group_id } = req.body;

            if (!student_id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            } else {
                const StudentOne = await Students.findOne({
                    where: { id: student_id, status: "pending" },
                });
                if (!StudentOne) {
                    return next(ApiError.badRequest("Bunday student topilmadi"));
                }
            };
            if (!summa) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            } else {
                let inNumber = typeof summa;

                if (inNumber !== "number") {
                    return next(ApiError.badRequest("Summani raqamda kiriting"));
                }
            }
            if (!group_id) {
                return next(
                    ApiError.badRequest('The data is incomplete')
                )
            } else {
                const groupOne = await Groups.findOne({
                    where: { id: group_id, status: "active" },
                });
                if (!groupOne) {
                    return next(ApiError.badRequest("Bunday group topilmadi"));
                }
            };
            const groups = await Groups.findOne({
                where: {
                    status: 'active',
                    id: group_id
                }
            })

            groups.count_students = String(Number(groups.count_students) + 1);
            await GroupStudents.create({
                student_id,
                group_id,
                month_payment: summa
            });
            await groups.save()
            const day = new Date().getDate();
            const groupStudentCreateRes = await groupStudentCreate({ student_id, group_id, day, summa });
            const student = await Students.findOne({
                where: { id: student_id, status: "pending" },
            });
            student.status = 'active'
            student.save();


            return res.json({ student, groupStudentCreateRes })
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

}

module.exports = new StudentPendingController();
