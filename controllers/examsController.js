const ApiError = require("../error/ApiError");
const {
    Exams,
    Students,
    StudentOther,
    ExamStudents,
    Sciences,
    DTMColumns,
    ExamStudentPoint,
    Rooms,
    TeacherGroups,
    Teachers,
    GroupStudents,
    Groups,
    ExamsTimes
} = require("../models/models");
const sequelize = require("../db");
const sendMessage = require("./sendMessageController");
const validateFun = require("./validateFun");
function assignStudentsToRooms({ studentsArray, roomsArray, unallStudent, maxStudentsPerSubject }) {
    try {
        // Sort the rooms in ascending order based on their count_studentss
        roomsArray.sort((a, b) => a.count_students - b.count_students);
        // Initialize an array to store the allocated rooms for each student
        const allocatedRooms = [];
        const unallocatedStudents = [];
        // Iterate over each student
        // if (studentsArray && studentsArray.length > 0) {
        for (const data of studentsArray) {
            data.students.forEach(student => {
                const { science } = student;
                let allocated = false;
                const firstStudyUnit = science[0];
                let classNumber = parseInt(student.class.split('-')[0]);
                if (classNumber <= 7) {
                    if (student.class != 'Bitirgan') {
                        unallocatedStudents.push(student);
                        return
                    }
                }
                // Iterate over the rooms to find an available room
                for (let i = 0; i < roomsArray.length; i++) {
                    const room = roomsArray[i];
                    // Check if the room has enough space for the student
                    if (room.count_students > 0) {
                        // Allocate the room to the student
                        allocatedRooms.push({
                            student: student,
                            room: room
                        });

                        // Update the count_students of the room
                        room.count_students--;

                        allocated = true;
                        break;
                    }
                }

                // If no available room is found, add the student to the unallocatedStudents array
                if (!allocated) {
                    unallocatedStudents.push(student);
                }
            });
        }

        if (unallStudent && unallStudent.length > 0) {
            unallStudent.forEach(student => {
                const { science } = student;
                let allocated = false;
                const firstStudyUnit = science[0];
                // Iterate over the rooms to find an available room
                for (let i = 0; i < roomsArray.length; i++) {
                    const room = roomsArray[i];

                    // Check if the room has enough space for the student
                    if (room.count_students > 0) {
                        // Allocate the room to the student
                        allocatedRooms.push({
                            student: student,
                            room: room
                        });

                        // Update the count_students of the room
                        room.count_students--;

                        allocated = true;
                        break;
                    }
                }

                // If no available room is found, add the student to the unallocatedStudents array
                if (!allocated) {
                    unallocatedStudents.push(student);
                }
            });
        }


        return { allocatedRooms, unallocatedStudents, };

    } catch (error) {
        console.log(98, error.stack);
        return error
    }
}
function countStudentsWithSubject(allocatedRooms, studentsArray, subject) {
    let count = 0;
    for (const allocatedRoom of allocatedRooms) {
        const allocatedStudent = studentsArray.find(student => student.id === allocatedRoom.studentId);
        if (allocatedStudent && allocatedStudent.science[0].name === subject) {
            count++;
        }
    }
    return count;
}
function assignStudents(studentsArray, roomsArray) {
    try {
        const newData = []
        const rooms = JSON.parse(JSON.stringify(roomsArray))
        const data = assignStudentsToRooms({ studentsArray: studentsArray, roomsArray: rooms, unallStudent: [], maxStudentsPerSubject: 4 });
        if (data.allocatedRooms && data.allocatedRooms.length > 0) {
            newData.push(data.allocatedRooms)
        }
        if (data && data.unallocatedStudents && data.unallocatedStudents.length > 0) {
            let updateData = data.unallocatedStudents;
            for (let i = 0; i < 100; i++) {
                const room = JSON.parse(JSON.stringify(roomsArray))
                const result = assignStudentsToRooms({ studentsArray: [], roomsArray: room, unallStudent: updateData, maxStudentsPerSubject: 4 });
                if (result.allocatedRooms && result.allocatedRooms.length > 0) {
                    newData.push(result.allocatedRooms)
                }
                if (result.unallocatedStudents && result.unallocatedStudents.length > 0) {
                    updateData = result.unallocatedStudents
                } else {
                    break;
                }
            }
        }
        return newData
    } catch (error) {
        console.log(108, error.stack);
        return error
    }
}
function formatDate(dateString) {
    let parts = dateString.split('-');
    let formattedDate = parts[1] + '.' + parts[0] + '.' + parts[2];
    return formattedDate;
}
function formatDate2(dateString) {
    let parts = dateString.split('-');
    let formattedDate = parts[0] + '.' + parts[1] + '.' + parts[2];
    return formattedDate;
}

class ExamsController {
    async examAdd(req, res, next) {
        try {
            const { name, date, summa_self, summa_other, time_1, time_2, time_3 } = req.body;
            if (!name) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!date) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!summa_self) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!summa_other) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!time_1 || !time_2 || !time_3) {
                return next(ApiError.badRequest("The data is incomplete"));
            };
            const exams = await Exams.create({
                name,
                date,
                summa_self: Math.trunc(summa_self),
                summa_other: Math.trunc(summa_other),
            });
            await ExamsTimes.create({
                time_1,
                time_2,
                time_3,
                exam_id: exams.id
            });

            return res.json(exams);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async examDelete(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                return next(ApiError.badRequest("No data found"));
            }

            const exam = await Exams.findOne({ where: { id, status: "active" } });

            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }

            exam.status = "inactive";
            await exam.save();

            return res.send("The information has been deleted");
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async examPut(req, res, next) {
        try {
            const { id, name, date, summa_self, summa_other, time_1, time_2, time_3 } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("No data found"));
            }
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }

            if (!time_1 || !time_2 || !time_3) {
                return next(ApiError.badRequest("The data is incomplete"));
            };

            if (!name) {
                return next(ApiError.badRequest("The data is incomplete"));
            } else {
                exam.name = name;
            }

            if (!date) {
                return next(ApiError.badRequest("The data is incomplete"));
            } else {
                exam.date = date;
            }

            if (!summa_self) {
                return next(ApiError.badRequest("The data is incomplete"));
            } else {
                exam.summa_self = summa_self;
            }

            if (!summa_other) {
                return next(ApiError.badRequest("The data is incomplete"));
            } else {
                exam.summa_other = summa_other;
            }

            const exams_times = await ExamsTimes.findOne({
                where: {
                    status: 'active',
                    exam_id: id
                }
            });

            if (exams_times) {
                exams_times.time_1 = time_1;
                exams_times.time_2 = time_2;
                exams_times.time_3 = time_3;
                await exams_times.save();
            } else if (!exams_times) {
                await ExamsTimes.create({
                    time_1,
                    time_2,
                    time_3,
                    exam_id: id
                });
            }

            await exam.save();

            return res.json(exam);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async examGet(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }

            const exam = await Exams.findOne({ where: { id, status: "active" } });

            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            };

            const exam_time = await ExamsTimes.findOne({
                where: {
                    status: 'active',
                    exam_id: id
                }
            });


            return res.json({ exam, exam_time: exam_time ? exam_time : {} });
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async examAllGet(req, res, next) {
        try {
            const exams = await Exams.findAll({
                where: {
                    status: "active",
                },
            });

            const exam_time = await ExamsTimes.findAll({
                where: {
                    status: 'active',
                }
            });
            const examsAll = exams && exams.length > 0 && exam_time && exams.map((el) => {
                const end_time_one = exam_time.length > 0 && exam_time.find((e) => e.exam_id == el.id);
                return {
                    id: el.id,
                    date: el.date,
                    name: el.name,
                    summa_other: el.summa_other,
                    summa_self: el.summa_self,
                    status: el.status,
                    time: end_time_one ? end_time_one : {}
                }
            });

            return res.json(examsAll);
        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }
    async examExcelGet(req, res, next) {
        try {
            const { id } = req.body;
            const query = `SELECT
            teachers.id AS teachers_id,
            teachers.lastname AS lastname,
            teachers.firstname AS firstname,
            json_agg(
              students
            ) AS students
          FROM teachers 
          LEFT JOIN (
            SELECT DISTINCT ON (group_students.student_id)
              group_students.student_id,
              teacher_groups.teacher_id
            FROM group_students
            INNER JOIN teacher_groups ON group_students.group_id::VARCHAR(255) = teacher_groups.group_id::VARCHAR(255) AND teacher_groups.status = 'active' AND group_students.status='active'
            ORDER BY group_students.student_id
          ) AS student_teacher ON teachers.id::VARCHAR(255) = student_teacher.teacher_id::VARCHAR(255)
          LEFT JOIN students ON student_teacher.student_id::VARCHAR(255) = students.id::VARCHAR(255) AND students.status = 'active'
          WHERE  teachers.status = 'active'
          GROUP BY teachers.id;
            `;
            const student = await Students.findAll({
                where: {
                    status: 'active'
                }
            });
            const data = await sequelize.query(query);
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });


            const dataFilter = data[0]
                .map((el) => {
                    const student = el.students && el.students.filter((e) => e && e);
                    const newData = student &&
                        student.length > 0 && {
                        id: el.teachers_id,
                        name: el.firstname + " " + el.lastname,
                        students: student.map((e) => {
                            const sciencesData =
                                e.science &&
                                e.science.map((els) => {
                                    const scienceOne = sciences.find((ele) => ele.id == els);
                                    return {
                                        id: scienceOne && scienceOne.id && scienceOne.id,
                                        name: scienceOne && scienceOne.name && scienceOne.name,
                                    };
                                });
                            return {
                                id: e.id,
                                name: e.firstname + " " + e.lastname,
                                phone: e.fatherPhone,
                                class: e.class ? e.class : '',
                                science:
                                    sciencesData && sciencesData.length > 0 ? sciencesData : [],
                            };
                        }),
                    };
                    return newData;
                })
                .filter((e) => e && e);
            const student_id = []

            data[0].forEach((el) => {
                el.students && el.students.forEach((e) => {
                    e && student_id.push(e.id);
                })
            });

            if (student_id.length != student.length) {
                const studentList = student.map((el) => {
                    const studentOne = student_id.find((e) => e == el.id)
                    if (!studentOne) {
                        const sciencesData =
                            el.science &&
                            el.science.map((els) => {
                                const scienceOne = sciences.find((ele) => ele.id == els);
                                return {
                                    id: scienceOne && scienceOne.id && scienceOne.id,
                                    name: scienceOne && scienceOne.name && scienceOne.name,
                                };
                            });
                        return {
                            id: el.id,
                            name: el.firstname + " " + el.lastname,
                            phone: el.fatherPhone,
                            class: el.class ? el.class : '',
                            science:
                                sciencesData && sciencesData.length > 0 ? sciencesData : [],
                        };
                    }
                }).filter((e) => e && e);

                const adminData = studentList && studentList.length > 0 && {
                    id: 'admin',
                    name: 'Admin ',
                    students: studentList
                }
                dataFilter.push(adminData)
            }





            return res.json(dataFilter);
        } catch (error) {
            console.log(error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examSearch(req, res, next) {
        try {
            const { id } = req.body;

            if (!id) {
                return next(ApiError.badRequest("No data found"));
            }
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }

            const students = await Students.findAll({ where: { status: "active" } });

            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: 'active'
                },
            });
            const studentList = [];
            students &&
                students.forEach((el) => {
                    const groupStudentList =
                        examStudents &&
                        examStudents.find((e) => e.student_id && e.student_id == el.id);
                    if (!groupStudentList) {
                        studentList.push(el);
                    }
                });

            const studentFilter = studentList
                .map((el) => {
                    const data = {
                        id: el.id,
                        name: el.firstname + " " + el.lastname,
                        class: el.class,
                        science: el.science,
                    };
                    return data;
                })
                .filter((e) => e && e)
                .sort((a, b) => a.name.localeCompare(b.name));

            return res.json(studentFilter);
        } catch (error) {
            console.log(error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentActiveAllGet(req, res, next) {
        try {
            const { id, studentClass } = req.body;
            if (!id) {
                return next(ApiError.badRequest("No data found"));
            }
            if (!studentClass) {
                return next(ApiError.badRequest("No data found"));
            }  // studentClass = initial || medium || high

            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const examStudentPoint = await ExamStudentPoint.findAll({
                where: {
                    status: 'active',
                    exam_id: id
                }
            })
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students`
            );
            const studentOther = await StudentOther.findAll();
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: "active"
                },
            });
            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne &&
                                    studentOne.fatherPhone &&
                                    studentOne.fatherPhone,
                                student_id: studentOne?.student_id,
                            }
                        );
                    } else if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne?.student_other_id,
                            }
                        );
                    }
                })
                .filter((e) => e && e);

            let resData;
            if (studentClass == 'initial') {
                resData = data.filter(item => {
                    let classNumber = parseInt(item.class.split('-')[0]);
                    return classNumber >= 1 && classNumber <= 4;
                }).map((el) => {
                    const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                    return {
                        id: el.id,
                        class: el.class,
                        science: el.science,
                        firstname:
                            el && el.firstname && el.firstname,
                        lastname:
                            el && el.lastname && el.lastname,
                        phone:
                            el &&
                            el.phone &&
                            el.phone,
                        student_id: el.student_id,
                        block_1: examStudentPointOne && {
                            point: examStudentPointOne.block_1,
                            result: (examStudentPointOne.block_1 * 2.1).toFixed(2),
                        },
                        block_2: examStudentPointOne && {
                            point: examStudentPointOne.block_2,
                            result: (examStudentPointOne.block_2 * 2.1).toFixed(2),

                        },
                        block_3: examStudentPointOne && {
                            result: (examStudentPointOne.block_3 * 2.1).toFixed(2),
                            point: examStudentPointOne.block_3
                        },
                        block_4: examStudentPointOne && {
                            result: (examStudentPointOne.block_4 * 2.1).toFixed(2),
                            point: examStudentPointOne.block_4
                        },
                        block_5: examStudentPointOne && {
                            result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                            point: examStudentPointOne.block_5
                        },
                        all_result: examStudentPointOne && (Number(examStudentPointOne.block_1) * 2.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 2.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 2.1).toFixed(2)
                    }
                }).filter((e) => e && e);
            } else if (studentClass == 'medium') {
                resData = data.filter(item => {
                    let classNumber = parseInt(item.class.split('-')[0]);
                    return classNumber >= 5 && classNumber <= 9;
                }).map((el) => {
                    const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                    return {
                        id: el.id,
                        class: el.class,
                        science: el.science,
                        firstname:
                            el && el.firstname && el.firstname,
                        lastname:
                            el && el.lastname && el.lastname,
                        phone:
                            el &&
                            el.phone &&
                            el.phone,
                        student_id: el.student_id,
                        block_1: examStudentPointOne && {
                            result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
                            point: examStudentPointOne.block_1
                        },
                        block_2: examStudentPointOne && {
                            result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
                            point: examStudentPointOne.block_2
                        },
                        block_3: examStudentPointOne && {
                            result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                            point: examStudentPointOne.block_3
                        },
                        block_4: examStudentPointOne && {
                            result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
                            point: examStudentPointOne.block_4
                        },
                        block_5: examStudentPointOne && {
                            result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
                            point: examStudentPointOne.block_5
                        },
                        all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)

                    }

                }).filter((e) => e && e);
            } else if (studentClass == 'high') {
                resData = data.filter(item => {
                    let classNumber = parseInt(item.class.split('-')[0]);
                    return (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan';
                }).map((el) => {
                    const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                    return {
                        id: el.id,
                        class: el.class,
                        science: el.science,
                        firstname:
                            el && el.firstname && el.firstname,
                        lastname:
                            el && el.lastname && el.lastname,
                        phone:
                            el &&
                            el.phone &&
                            el.phone,
                        student_id: el.student_id,
                        block_1: examStudentPointOne && {
                            result: (examStudentPointOne.block_1 * 1.1).toFixed(2),
                            point: examStudentPointOne.block_1
                        },
                        block_2: examStudentPointOne && {
                            result: (examStudentPointOne.block_2 * 1.1).toFixed(2),
                            point: examStudentPointOne.block_2
                        },
                        block_3: examStudentPointOne && {
                            result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                            point: examStudentPointOne.block_3
                        },
                        block_4: examStudentPointOne && {
                            result: (examStudentPointOne.block_4 * 3.1).toFixed(2),
                            point: examStudentPointOne.block_4
                        },
                        block_5: examStudentPointOne && {
                            result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                            point: examStudentPointOne.block_5
                        },
                        all_result: examStudentPointOne && (examStudentPointOne.block_1 * 1.1 + examStudentPointOne.block_2 * 1.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 3.1).toFixed(2)
                    }


                }).filter((e) => e && e);
            }


            return res.json(resData);
        } catch (error) {
            console.log(344, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentActiveGet(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students WHERE status='active'`
            );
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: 'active'
                },
            });

            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne && studentOne.class && studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne &&
                                    studentOne.fatherPhone &&
                                    studentOne.fatherPhone,
                                student_id: el.student_id,
                            }
                        );
                    }
                })
                .filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));

            return res.json(data);
        } catch (error) {
            console.log(344, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentAdd(req, res, next) {
        try {
            const { student_id, exam_id, studentClass, science } = req.body;

            if (!student_id) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!exam_id) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!studentClass) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!science) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            const exam = await Exams.findOne({
                where: { id: exam_id, status: "active" },
            });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await Students.findOne({
                where: { id: student_id, status: "active" },
            });
            if (!student) {
                return next(ApiError.badRequest("No data found"));
            }

            const dtm = await DTMColumns.findOne({
                where: {
                    status: "active",
                    id: student.dtmcolumns_id,
                },
            });

            if (dtm) {
                dtm.status = "inactive";
                await dtm.save();
            }

            const createDTM = await DTMColumns.create({
                name: "DTM sciencelar",
                items: science,
                order: 1,
            });

            if (science) student.class = studentClass;
            if (science) student.science = [...[], []];
            await student.save();
            if (science) student.science = science;
            student.dtmcolumns_id = createDTM && createDTM.id;
            await student.save();
            const examStudents = await ExamStudents.create({
                exam_id,
                student_id: student.id,
            });

            const sendData = [{
                text: `Farzandingiz ${formatDate(exam.date)}-kuni bo'ladigan test sinoviga ro'yxatdan o'tdi. Imtihon vaqti va xonasi haqida qo'shimcha ma'lumot beriladi.
907024500
ZUKKO INM`,
                phone: student.fatherPhone
            }]

            sendMessage(sendData);

            return res.json(examStudents);
        } catch (error) {
            console.log(340, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentDelete(req, res, next) {
        try {
            const { id, exam_id } = req.body;
            if (!id) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!exam_id) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            const examStudent = await ExamStudents.findOne({
                where: {
                    status: "active",
                    id,
                    exam_id,
                },
            });
            if (!examStudent) {
                return next(ApiError.badRequest("No data found"));
            }
            const exam = await Exams.findOne({
                where: {
                    status: "active",
                    id: exam_id,
                },
            });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }

            examStudent.status = "inactive";
            await examStudent.save();

            return res.send("Reference deleted");
        } catch (error) {
            console.log(429, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentUpdate(req, res, next) {
        try {
            const { student_id, exam_id, studentClass, science, id } = req.body;
            console.log(555, req.body);

            if (!student_id) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!exam_id) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!studentClass) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            if (!science) {
                return next(ApiError.badRequest("The data is incomplete"));
            }
            const exam = await Exams.findOne({
                where: { id: exam_id, status: "active" },
            });
            if (!exam) {
                console.log(592);
                return next(ApiError.badRequest("No data found"));
            }
            const examStudent = await ExamStudents.findOne({
                where: {
                    status: "active",
                    id: id,
                    exam_id
                },
            });
            if (!examStudent) {
                console.log(585);
                return next(ApiError.badRequest("No data found"));
            }

            const student = await Students.findOne({
                where: { id: student_id, status: "active" },
            });
            if (!student) {
                console.log(599);
                return next(ApiError.badRequest("No data found"));
            }

            const dtm = await DTMColumns.findOne({
                where: {
                    status: "active",
                    id: student.dtmcolumns_id,
                },
            });

            if (dtm) {
                dtm.status = "inactive";
                await dtm.save();
            }
            const createDTM = await DTMColumns.create({
                name: "DTM sciencelar",
                items: science,
                order: 1,
            });
            if (science) student.class = studentClass;
            if (science) student.science = [...[], []];
            await student.save();
            if (science) student.science = science;
            student.dtmcolumns_id = createDTM && createDTM.id;
            await student.save();
            return res.send('update ')
        } catch (error) {
            console.log(437, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentPointAdd(req, res, next) {
        try {
            const { id, exam_id, block_1, block_2, block_3, block_4, block_5 } = req.body;
            if (!id) {
                return next(ApiError.badRequest("No data found"));
            }
            if (!exam_id) {
                return next(ApiError.badRequest("No data found"));
            }

            // if (!studentClass) {
            //   return next(ApiError.badRequest("No data found"));
            // }  // studentClass = initial || medium || high
            if (block_1 < 0 || block_2 < 0 || block_3 < 0 || block_4 < 0 || block_5 < 0) {
                return next(ApiError.badRequest("re-enter the blocks"));
            }
            if (typeof block_1 != 'number' || typeof block_2 != 'number' || typeof block_3 != 'number' || typeof block_4 != 'number' || typeof block_5 != 'number') {
                return next(ApiError.badRequest("re-enter the blocks"));
            }

            const exam = await Exams.findOne({ where: { id: exam_id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }

            const examStudent = await ExamStudents.findOne({
                where: {
                    status: "active",
                    id,
                    exam_id,
                },
            });
            if (!examStudent) {
                return next(ApiError.badRequest("No data found"));
            }

            const examStudentPoint = await ExamStudentPoint.findOne({
                where: {
                    exam_student_id: id,
                    status: 'active',
                    exam_id
                }
            });

            const lastActiveData = await ExamStudentPoint.findOne({
                where: {
                    status: 'active',
                    exam_id
                },
                order: [['createdAt', 'DESC']], // Order the results by the 'createdAt' column in descending order
                limit: 1 // Retrieve only the first result
            });


            if (examStudentPoint) {
                examStudentPoint.block_1 = block_1;
                examStudentPoint.block_2 = block_2;
                examStudentPoint.block_3 = block_3;
                examStudentPoint.block_4 = block_4;
                examStudentPoint.block_5 = block_5;
                await examStudentPoint.save();
            } else {

                await ExamStudentPoint.create({
                    exam_student_id: id,
                    exam_id,
                    block_1,
                    block_2,
                    block_3,
                    block_4,
                    block_5,
                    student_exam_id: lastActiveData ? lastActiveData.student_exam_id + 1 : 1000000
                })
            }

            return res.send('The data was saved correctly')
        } catch (error) {
            console.log(626, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentActiveAllGetExcel(req, res, next) {
        try {
            const { id } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("No data found"));
            }
            // if (!studentClass) {
            //   return next(ApiError.badRequest("No data found"));
            // }  // studentClass = initial || medium || high

            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const examStudentPoint = await ExamStudentPoint.findAll({
                where: {
                    status: 'active',
                    exam_id: id
                }
            })
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students`
            );
            const studentOther = await StudentOther.findAll();
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: "active"
                },
            });
            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne &&
                                    studentOne.fatherPhone &&
                                    studentOne.fatherPhone,
                                student_id: studentOne?.student_id,
                            }
                        );
                    } //else if (el.student_other_id) {
                    //     const studentOne = studentOther.find(
                    //         (e) => (e.id == el.student_other_id)
                    //     );
                    //     const sciencesStudentOtherOne =
                    //         studentOne &&
                    //         studentOne.science &&
                    //         studentOne.science.map((e) => {
                    //             const scienceOne = sciences.find((ele) => ele.id == e);
                    //             return {
                    //                 id: scienceOne && scienceOne.id && scienceOne.id,
                    //                 name: scienceOne && scienceOne.name && scienceOne.name,
                    //             };
                    //         });
                    //     return (
                    //         studentOne && {
                    //             id: el.id,
                    //             class: studentOne.class,
                    //             science: sciencesStudentOtherOne,
                    //             firstname:
                    //                 studentOne && studentOne.firstname && studentOne.firstname,
                    //             lastname:
                    //                 studentOne && studentOne.lastname && studentOne.lastname,
                    //             phone: studentOne && studentOne.phone && studentOne.phone,
                    //             student_id: studentOne?.student_other_id,
                    //         }
                    //     );
                    // }
                })
                .filter((e) => e && e);

            const dataStudentOther = examStudents
                .map((el) => {
                    if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne?.student_other_id,
                            }
                        );
                    }
                })
                .filter((e) => e && e);

            let resData = [];
            const studentClass = ['initial', 'medium', 'high']
            if (data && data.length > 0) {
                if (studentClass[0] == 'initial') {
                    const initialStudent = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 1 && classNumber <= 4;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                point: examStudentPointOne.block_1,
                                result: (examStudentPointOne.block_1 * 2.1).toFixed(2),
                            },
                            block_2: examStudentPointOne && {
                                point: examStudentPointOne.block_2,
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),

                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (Number(examStudentPointOne.block_1) * 2.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 2.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 2.1).toFixed(2)
                        }
                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'initial',
                        'name': '1-4 sinflar',
                        'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
                    })

                }
                if (studentClass[1] == 'medium') {
                    const medium = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 5 && classNumber <= 9;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)

                        }

                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'medium',
                        'name': '5-9 sinflar',
                        'students': medium && medium.length > 0 ? medium : []
                    })

                }
                if (studentClass[2] == 'high') {
                    const high = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan';
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 1.1 + examStudentPointOne.block_2 * 1.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 3.1).toFixed(2)
                        }


                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'high',
                        'name': '10-sinf va undan yuqori sinflar',
                        'students': high && high.length > 0 ? high : []
                    })
                }
            }
            if (dataStudentOther && dataStudentOther.length > 0) {
                if (studentClass[0] == 'initial') {
                    const initialStudent = dataStudentOther.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 1 && classNumber <= 4;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                point: examStudentPointOne.block_1,
                                result: (examStudentPointOne.block_1 * 2.1).toFixed(2),
                            },
                            block_2: examStudentPointOne && {
                                point: examStudentPointOne.block_2,
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),

                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (Number(examStudentPointOne.block_1) * 2.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 2.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 2.1).toFixed(2)
                        }
                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'initial-other',
                        'name': 'Boshqa o\'quvchilar 1-4 sinflar',
                        'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
                    })

                }
                if (studentClass[1] == 'medium') {
                    const medium = dataStudentOther.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 5 && classNumber <= 9;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)

                        }

                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'medium-other',
                        'name': 'Boshqa o\'quvchilar 5-9 sinflar',
                        'students': medium && medium.length > 0 ? medium : []
                    })

                }
                if (studentClass[2] == 'high') {
                    const high = dataStudentOther.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan';
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 1.1 + examStudentPointOne.block_2 * 1.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 3.1).toFixed(2)
                        }


                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'high-other',
                        'name': "Boshqa o'quvchilar 10-sinf va undan yuqori sinflar ",
                        'students': high && high.length > 0 ? high : []
                    })
                }
            }

            return res.json(resData);
        } catch (error) {
            console.log(344, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentActiveAllGetExcelNew(req, res, next) {
        try {
            const { id } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("No data found"));
            }
            // if (!studentClass) {
            //   return next(ApiError.badRequest("No data found"));
            // }  // studentClass = initial || medium || high

            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const examStudentPoint = await ExamStudentPoint.findAll({
                where: {
                    status: 'active',
                    exam_id: id
                }
            })
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students`
            );
            const studentOther = await StudentOther.findAll();
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: "active"
                },
            });
            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne &&
                                    studentOne.fatherPhone &&
                                    studentOne.fatherPhone,
                                student_id: studentOne?.student_id,
                            }
                        );
                    } else if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne?.student_other_id,
                            }
                        );
                    }
                })
                .filter((e) => e && e);
            let resData = [];
            const studentClass = ['initial', 'medium', 'high']
            if (data && data.length > 0) {
                if (studentClass[0] == 'initial') {
                    const initialStudent = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 1 && classNumber <= 4;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                point: examStudentPointOne.block_1,
                                result: (examStudentPointOne.block_1 * 2.1).toFixed(2),
                            },
                            block_2: examStudentPointOne && {
                                point: examStudentPointOne.block_2,
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),

                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (Number(examStudentPointOne.block_1) * 2.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 2.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 2.1).toFixed(2)
                        }
                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'initial',
                        'name': '1-4 sinflar',
                        'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
                    })

                }
                if (studentClass[1] == 'medium') {
                    const medium = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 5 && classNumber <= 9;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)

                        }

                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'medium',
                        'name': '5-9 sinflar',
                        'students': medium && medium.length > 0 ? medium : []
                    })

                }
                if (studentClass[2] == 'high') {
                    const high = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan';
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 1.1 + examStudentPointOne.block_2 * 1.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 3.1).toFixed(2)
                        }


                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'high',
                        'name': '10-sinf va undan yuqori sinflar',
                        'students': high && high.length > 0 ? high : []
                    })
                }
            }
            return res.json(resData);
        } catch (error) {
            console.log(344, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examStudentActiveAllGetExcelResult(req, res, next) {
        try {
            const { id } = req.body;
            if (!id) {
                return next(ApiError.badRequest("No data found"));
            }

            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const examStudentPoint = await ExamStudentPoint.findAll({
                where: {
                    status: 'active',
                    exam_id: id
                }
            })
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students WHERE status='active'`
            );
            const studentOther = await StudentOther.findAll({
                where: { status: "active" },
            });
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: "active"
                },
            });
            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne &&
                                    studentOne.fatherPhone &&
                                    studentOne.fatherPhone,
                                student_id: studentOne?.student_id,
                            }
                        );
                    }
                    else if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne?.student_other_id,
                            }
                        );
                    }
                })
                .filter((e) => e && e);

            const dataStudentOther = examStudents
                .map((el) => {
                    if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne?.student_other_id,
                            }
                        );
                    }
                })
                .filter((e) => e && e);

            let resData = [];
            const studentClass = ['initial', 'medium', 'high']
            if (data && data.length > 0) {
                if (studentClass[0] == 'initial') {
                    const initialStudent = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 1 && classNumber <= 4;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                point: examStudentPointOne.block_1,
                                result: (examStudentPointOne.block_1 * 2.1).toFixed(2),
                            },
                            block_2: examStudentPointOne && {
                                point: examStudentPointOne.block_2,
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),

                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (Number(examStudentPointOne.block_1) * 2.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 2.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 2.1).toFixed(2)
                        }
                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'initial',
                        'name': '1-4 sinflar',
                        'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
                    })

                }
                if (studentClass[1] == 'medium') {
                    const medium = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 5 && classNumber <= 9;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)

                        }

                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'medium',
                        'name': '5-9 sinflar',
                        'students': medium && medium.length > 0 ? medium : []
                    })

                }
                if (studentClass[2] == 'high') {
                    const high = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan';
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 1.1 + examStudentPointOne.block_2 * 1.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 3.1).toFixed(2)
                        }


                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'high',
                        'name': '10-sinf va undan yuqori sinflar',
                        'students': high && high.length > 0 ? high : []
                    })
                }
            }

            // if (dataStudentOther && dataStudentOther.length > 0) {
            //   if (studentClass[0] == 'initial') {
            //     const initialStudent = dataStudentOther.filter(item => {
            //       let classNumber = parseInt(item.class.split('-')[0]);
            //       return classNumber >= 1 && classNumber <= 4;
            //     }).map((el) => {
            //       const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
            //       return {
            //         id: el.id,
            //         class: el.class,
            //         science: el.science,
            //         firstname:
            //             el && el.firstname && el.firstname,
            //         lastname:
            //             el && el.lastname && el.lastname,
            //         phone:
            //             el &&
            //             el.phone &&
            //             el.phone,
            //         student_id: el.student_id,
            //         block_1: examStudentPointOne && {
            //           point: examStudentPointOne.block_1,
            //           result: (examStudentPointOne.block_1 * 2.1).toFixed(2),
            //         },
            //         block_2: examStudentPointOne && {
            //           point: examStudentPointOne.block_2,
            //           result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
            //
            //         },
            //         block_3: examStudentPointOne && {
            //           result: (examStudentPointOne.block_3 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_3
            //         },
            //         block_4: examStudentPointOne && {
            //           result: (examStudentPointOne.block_4 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_4
            //         },
            //         block_5: examStudentPointOne && {
            //           result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_5
            //         },
            //         all_result: examStudentPointOne && (Number(examStudentPointOne.block_1) * 2.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 2.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 2.1).toFixed(2)
            //       }
            //     }).filter((e) => e && e);
            //
            //     resData.push({
            //       'id': 'initial-other',
            //       'name': 'Boshqa o\'quvchilar 1-4 sinflar',
            //       'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
            //     })
            //
            //   }
            //   if (studentClass[1] == 'medium') {
            //     const medium = dataStudentOther.filter(item => {
            //       let classNumber = parseInt(item.class.split('-')[0]);
            //       return classNumber >= 5 && classNumber <= 9;
            //     }).map((el) => {
            //       const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
            //       return {
            //         id: el.id,
            //         class: el.class,
            //         science: el.science,
            //         firstname:
            //             el && el.firstname && el.firstname,
            //         lastname:
            //             el && el.lastname && el.lastname,
            //         phone:
            //             el &&
            //             el.phone &&
            //             el.phone,
            //         student_id: el.student_id,
            //         block_1: examStudentPointOne && {
            //           result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
            //           point: examStudentPointOne.block_1
            //         },
            //         block_2: examStudentPointOne && {
            //           result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_2
            //         },
            //         block_3: examStudentPointOne && {
            //           result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_3
            //         },
            //         block_4: examStudentPointOne && {
            //           result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_4
            //         },
            //         block_5: examStudentPointOne && {
            //           result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_5
            //         },
            //         all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)
            //
            //       }
            //
            //     }).filter((e) => e && e);
            //
            //     resData.push({
            //       'id': 'medium-other',
            //       'name': 'Boshqa o\'quvchilar 5-9 sinflar',
            //       'students': medium && medium.length > 0 ? medium : []
            //     })
            //
            //   }
            //   if (studentClass[2] == 'high') {
            //     const high = dataStudentOther.filter(item => {
            //       let classNumber = parseInt(item.class.split('-')[0]);
            //       return (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan';
            //     }).map((el) => {
            //       const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
            //       return {
            //         id: el.id,
            //         class: el.class,
            //         science: el.science,
            //         firstname:
            //             el && el.firstname && el.firstname,
            //         lastname:
            //             el && el.lastname && el.lastname,
            //         phone:
            //             el &&
            //             el.phone &&
            //             el.phone,
            //         student_id: el.student_id,
            //         block_1: examStudentPointOne && {
            //           result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
            //           point: examStudentPointOne.block_1
            //         },
            //         block_2: examStudentPointOne && {
            //           result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_2
            //         },
            //         block_3: examStudentPointOne && {
            //           result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_3
            //         },
            //         block_4: examStudentPointOne && {
            //           result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_4
            //         },
            //         block_5: examStudentPointOne && {
            //           result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_5
            //         },
            //         all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)
            //       }
            //
            //
            //     }).filter((e) => e && e);
            //
            //     resData.push({
            //       'id': 'high-other',
            //       'name': "Boshqa o'quvchilar 10-sinf va undan yuqori sinflar ",
            //       'students': high && high.length > 0 ? high : []
            //     })
            //   }
            // }

            return res.json(resData);
        } catch (error) {
            console.log(344, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    async examRoomsAdd(req, res, next) {
        try {
            const { id } = req.params;
            if (!validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("The data was entered incorrectly"));
            }
            const exam = await Exams.findOne({
                where: { id, status: "active" },
            });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students WHERE status='active'`
            );
            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const studentOther = await StudentOther.findAll({
                where: { status: "active" },
            });
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: "active"
                },
            });
            const rooms = await Rooms.findAll({
                where: {
                    status: 'active'
                }
            });

            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne?.fatherPhone,
                                student_id: el?.student_id,
                            }
                        );
                    } else if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne.id,
                            }
                        );
                    }
                })
                .filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));
            const resData = [];
            const studentClass = ['initial', 'medium', 'high']
            if (data && data.length > 0) {
                if (studentClass[0] == 'initial') {
                    const initialStudent = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 1 && classNumber <= 7;
                    }).map((el) => {
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,

                        }
                    }).filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));

                    resData.push({
                        'id': 'initial',
                        'name': '1-4 sinflar',
                        'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
                    })
                }
                // if (studentClass[1] == 'medium') {
                //   const medium = data.filter(item => {
                //     let classNumber = parseInt(item.class.split('-')[0]);
                //     return classNumber >= 5 && classNumber <= 9;
                //   }).map((el) => {
                //     return {
                //       id: el.id,
                //       class: el.class,
                //       science: el.science,
                //       firstname:
                //         el && el.firstname && el.firstname,
                //       lastname:
                //         el && el.lastname && el.lastname,
                //       phone:
                //         el &&
                //         el.phone &&
                //         el.phone,
                //       student_id: el.student_id,
                //     }

                //   }).filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));
                //   console.log(1635, high);
                //   resData.push({
                //     'id': 'medium',
                //     'name': '5-9 sinflar',
                //     'students': medium && medium.length > 0 ? medium : []
                //   })

                // }
                if (studentClass[2] == 'high') {
                    const high = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return (classNumber >= 8 || (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan');
                    }).map((el) => {
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                        }
                    }).filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));

                    resData.push({
                        'id': 'high',
                        'name': '10-sinf va undan yuqori sinflar',
                        'students': high && high.length > 0 ? high : []
                    })
                }
            }
            resData.reverse();


            const newData = assignStudents(resData, rooms)
            // newData.push(assignStudents(resData[0], rooms));
            // newData.push(assignStudents(resData[1], rooms));
            // newData.push(assignStudents(resData[2], rooms));
            newData.forEach((el) => {
                el.sort((a, b) => {
                    const firstnameA = a.student.firstname.toLowerCase();
                    const firstnameB = b.student.firstname.toLowerCase();
                    return firstnameA.localeCompare(firstnameB);
                });
            })

            return res.json(newData)


        } catch (error) {
            console.log(1324, error.stack);
            return next(ApiError.badRequest(error));
        }
    }
    // rooms sms
    async examRoomsSendMessege(req, res, next) {
        try {
            const { id } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("No data found"));
            }

            const exam = await Exams.findOne({
                where: { id, status: "active" },
            });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students WHERE status='active'`
            );
            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const studentOther = await StudentOther.findAll({
                where: { status: "active" },
            });
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: "active"
                },
            });
            const rooms = await Rooms.findAll({
                where: {
                    status: 'active'
                }
            });

            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne?.fatherPhone,
                                student_id: el?.student_id,
                            }
                        );
                    } else if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne.id,
                            }
                        );
                    }
                })
                .filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));
            const resData = [];
            const studentClass = ['initial', 'medium', 'high']
            if (data && data.length > 0) {
                if (studentClass[0] == 'initial') {
                    const initialStudent = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 1 && classNumber <= 7;
                    }).map((el) => {
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,

                        }
                    }).filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));

                    resData.push({
                        'id': 'initial',
                        'name': '1-4 sinflar',
                        'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
                    })
                }

                if (studentClass[2] == 'high') {
                    const high = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return (classNumber >= 8 || (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan');
                    }).map((el) => {
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                        }
                    }).filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));

                    resData.push({
                        'id': 'high',
                        'name': '10-sinf va undan yuqori sinflar',
                        'students': high && high.length > 0 ? high : []
                    })
                }
            }
            resData.reverse();
            const newData = assignStudents(resData, rooms)
            newData.forEach((el) => {
                el.sort((a, b) => {
                    const firstnameA = a.student.firstname.toLowerCase();
                    const firstnameB = b.student.firstname.toLowerCase();
                    return firstnameA.localeCompare(firstnameB);
                });
            });
            for (const datas of newData[0]) {
                const sendData = [
                    {
                        text: `${datas.student.firstname + ' ' + datas.student.lastname + ' ' + '22.10.2023'}.kuni soat 7-00 da ${datas.room.name.split(' ')[0]}da test topshiradi.
907024500
ZUKKO INM`,
                        phone: datas.student.phone
                    }
                ]
                await sendMessage(sendData);
            }

            for (const datas of newData[1]) {
                const sendData = [
                    {
                        text: `${datas.student.firstname + ' ' + datas.student.lastname + ' ' + '22.10.2023'}.kuni soat 9-30 da ${datas.room.name.split(' ')[0]}da test topshiradi.
907024500
ZUKKO INM`,
                        phone: datas.student.phone
                    }
                ]
                await sendMessage(sendData);
            }

            if (newData[2]) {
                for (const datas of newData[2]) {
                    const sendData = [
                        {
                            text: `${datas.student.firstname + ' ' + datas.student.lastname + ' ' + '22.10.2023'}.kuni soat 11-00 da ${datas.room.name.split(' ')[0]}da test topshiradi.
907024500
ZUKKO INM`,
                            phone: datas.student.phone
                        }
                    ]
                    await sendMessage(sendData);
                }
            }


            const obj = {
                'sms': 'send'
            }

            return obj

        } catch (error) {
            console.log(1324, error.stack);

        }
    }
    async examRoomsSendMessegeNew(req, res, next) {
        try {
            const { id } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("No data found"));
            }

            const exam = await Exams.findOne({
                where: { id, status: "active" },
            });
            const exams_times = await ExamsTimes.findOne({
                where: {
                    status: 'active',
                    exam_id: id
                }
            });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students WHERE status='active'`
            );
            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const studentOther = await StudentOther.findAll({
                where: { status: "active" },
            });
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: "active"
                },
            });
            const rooms = await Rooms.findAll({
                where: {
                    status: 'active'
                }
            });

            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne?.fatherPhone,
                                student_id: el?.student_id,
                            }
                        );
                    } else if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne.id,
                            }
                        );
                    }
                })
                .filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));
            const resData = [];
            const studentClass = ['initial', 'medium', 'high']
            if (data && data.length > 0) {
                if (studentClass[0] == 'initial') {
                    const initialStudent = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 1 && classNumber <= 7;
                    }).map((el) => {
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,

                        }
                    }).filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));

                    resData.push({
                        'id': 'initial',
                        'name': '1-4 sinflar',
                        'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
                    })
                }

                if (studentClass[2] == 'high') {
                    const high = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return (classNumber >= 8 || (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan');
                    }).map((el) => {
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                        }
                    }).filter((e) => e && e).sort((a, b) => a.firstname.localeCompare(b.firstname));

                    resData.push({
                        'id': 'high',
                        'name': '10-sinf va undan yuqori sinflar',
                        'students': high && high.length > 0 ? high : []
                    })
                }
            }
            resData.reverse();
            const newData = assignStudents(resData, rooms)
            newData.forEach((el) => {
                el.sort((a, b) => {
                    const firstnameA = a.student.firstname.toLowerCase();
                    const firstnameB = b.student.firstname.toLowerCase();
                    return firstnameA.localeCompare(firstnameB);
                });
            });
            const date = formatDate(exam.date);
            for (const datas of newData[0]) {
                const sendData = [
                    {
                        text: `${datas.student.firstname + ' ' + datas.student.lastname + ' ' + date}.kuni soat ${exams_times && exams_times?.time_1 ? exams_times?.time_1 : '7-00'} da ${datas.room.name.split(' ')[0]}da test topshiradi.
907024500
ZUKKO INM`,
                        phone: datas.student.phone
                    }
                ]
                await sendMessage(sendData);
            }

            for (const datas of newData[1]) {
                const sendData = [
                    {
                        text: `${datas.student.firstname + ' ' + datas.student.lastname + ' ' + date}.kuni soat ${exams_times && exams_times?.time_2 ? exams_times?.time_2 : '9-30'} da ${datas.room.name.split(' ')[0]}da test topshiradi.
907024500
ZUKKO INM`,
                        phone: datas.student.phone
                    }
                ]
                await sendMessage(sendData);
            }

            if (newData[2]) {
                for (const datas of newData[2]) {
                    const sendData = [
                        {
                            text: `${datas.student.firstname + ' ' + datas.student.lastname + ' ' + date}.kuni soat ${exams_times && exams_times?.time_3 ? exams_times?.time_3 : '11-00'} da ${datas.room.name.split(' ')[0]}da test topshiradi.
907024500
ZUKKO INM`,
                            phone: datas.student.phone
                        }
                    ]
                    await sendMessage(sendData);
                }
            }


            const obj = {
                'sms': 'send'
            }

            return res.json(obj)

        } catch (error) {
            console.log(1324, error.stack);

        }
    }
    // result sms 
    async examStudentActiveAllGetResultSms(req, res, next) {
        try {
            const { id } = req.body;
            if (!id || !validateFun.isValidUUID(id)) {
                return next(ApiError.badRequest("No data found"));
            }


            const sciences = await Sciences.findAll({
                where: {
                    status: "active",
                },
            });
            const examStudentPoint = await ExamStudentPoint.findAll({
                where: {
                    status: 'active',
                    exam_id: id
                }
            })
            const exam = await Exams.findOne({ where: { id, status: "active" } });
            if (!exam) {
                return next(ApiError.badRequest("No data found"));
            }
            const student = await sequelize.query(
                `SELECT * FROM Students`
            );
            const studentOther = await StudentOther.findAll();
            const examStudents = await ExamStudents.findAll({
                where: {
                    exam_id: id,
                    status: "active"
                },
            });
            const data = examStudents
                .map((el) => {
                    if (el.student_id) {
                        const studentOne = student[0].find((e) => e.id == el.student_id);
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone:
                                    studentOne &&
                                    studentOne.fatherPhone &&
                                    studentOne.fatherPhone,
                                student_id: studentOne?.student_id,
                            }
                        );
                    } else if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne?.student_other_id,
                            }
                        );
                    }
                })
                .filter((e) => e && e);

            const dataStudentOther = examStudents
                .map((el) => {
                    if (el.student_other_id) {
                        const studentOne = studentOther.find(
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
                                id: el.id,
                                class: studentOne.class,
                                science: sciencesStudentOtherOne,
                                firstname:
                                    studentOne && studentOne.firstname && studentOne.firstname,
                                lastname:
                                    studentOne && studentOne.lastname && studentOne.lastname,
                                phone: studentOne && studentOne.phone && studentOne.phone,
                                student_id: studentOne?.student_other_id,
                            }
                        );
                    }
                })
                .filter((e) => e && e);

            let resData = [];
            const studentClass = ['initial', 'medium', 'high']
            if (data && data.length > 0) {
                if (studentClass[0] == 'initial') {
                    const initialStudent = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 1 && classNumber <= 4;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                point: examStudentPointOne.block_1,
                                result: (examStudentPointOne.block_1 * 2.1).toFixed(2),
                            },
                            block_2: examStudentPointOne && {
                                point: examStudentPointOne.block_2,
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),

                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (Number(examStudentPointOne.block_1) * 2.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 2.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 2.1).toFixed(2)
                        }
                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'initial',
                        'name': '1-4 sinflar',
                        'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
                    })

                }
                if (studentClass[1] == 'medium') {
                    const medium = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return classNumber >= 5 && classNumber <= 9;
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)

                        }

                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'medium',
                        'name': '5-9 sinflar',
                        'students': medium && medium.length > 0 ? medium : []
                    })

                }
                if (studentClass[2] == 'high') {
                    const high = data.filter(item => {
                        let classNumber = parseInt(item.class.split('-')[0]);
                        return (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan';
                    }).map((el) => {
                        const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
                        return {
                            id: el.id,
                            class: el.class,
                            science: el.science,
                            firstname:
                                el && el.firstname && el.firstname,
                            lastname:
                                el && el.lastname && el.lastname,
                            phone:
                                el &&
                                el.phone &&
                                el.phone,
                            student_id: el.student_id,
                            block_1: examStudentPointOne && {
                                result: (examStudentPointOne.block_1 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_1
                            },
                            block_2: examStudentPointOne && {
                                result: (examStudentPointOne.block_2 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_2
                            },
                            block_3: examStudentPointOne && {
                                result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
                                point: examStudentPointOne.block_3
                            },
                            block_4: examStudentPointOne && {
                                result: (examStudentPointOne.block_4 * 3.1).toFixed(2),
                                point: examStudentPointOne.block_4
                            },
                            block_5: examStudentPointOne && {
                                result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
                                point: examStudentPointOne.block_5
                            },
                            all_result: examStudentPointOne && (examStudentPointOne.block_1 * 1.1 + examStudentPointOne.block_2 * 1.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 3.1).toFixed(2)
                        }


                    }).filter((e) => e && e);

                    resData.push({
                        'id': 'high',
                        'name': '10-sinf va undan yuqori sinflar',
                        'students': high && high.length > 0 ? high : []
                    })
                }
            }
            // if (dataStudentOther && dataStudentOther.length > 0) {
            //   if (studentClass[0] == 'initial') {
            //     const initialStudent = dataStudentOther.filter(item => {
            //       let classNumber = parseInt(item.class.split('-')[0]);
            //       return classNumber >= 1 && classNumber <= 4;
            //     }).map((el) => {
            //       const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
            //       return {
            //         id: el.id,
            //         class: el.class,
            //         science: el.science,
            //         firstname:
            //           el && el.firstname && el.firstname,
            //         lastname:
            //           el && el.lastname && el.lastname,
            //         phone:
            //           el &&
            //           el.phone &&
            //           el.phone,
            //         student_id: el.student_id,
            //         block_1: examStudentPointOne && {
            //           point: examStudentPointOne.block_1,
            //           result: (examStudentPointOne.block_1 * 2.1).toFixed(2),
            //         },
            //         block_2: examStudentPointOne && {
            //           point: examStudentPointOne.block_2,
            //           result: (examStudentPointOne.block_2 * 2.1).toFixed(2),

            //         },
            //         block_3: examStudentPointOne && {
            //           result: (examStudentPointOne.block_3 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_3
            //         },
            //         block_4: examStudentPointOne && {
            //           result: (examStudentPointOne.block_4 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_4
            //         },
            //         block_5: examStudentPointOne && {
            //           result: (examStudentPointOne.block_5 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_5
            //         },
            //         all_result: examStudentPointOne && (Number(examStudentPointOne.block_1) * 2.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 2.1 + examStudentPointOne.block_5 * 2.1 + examStudentPointOne.block_4 * 2.1).toFixed(2)
            //       }
            //     }).filter((e) => e && e);

            //     resData.push({
            //       'id': 'initial-other',
            //       'name': 'Boshqa o\'quvchilar 1-4 sinflar',
            //       'students': initialStudent && initialStudent.length > 0 ? initialStudent : []
            //     })

            //   }
            //   if (studentClass[1] == 'medium') {
            //     const medium = dataStudentOther.filter(item => {
            //       let classNumber = parseInt(item.class.split('-')[0]);
            //       return classNumber >= 5 && classNumber <= 9;
            //     }).map((el) => {
            //       const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
            //       return {
            //         id: el.id,
            //         class: el.class,
            //         science: el.science,
            //         firstname:
            //           el && el.firstname && el.firstname,
            //         lastname:
            //           el && el.lastname && el.lastname,
            //         phone:
            //           el &&
            //           el.phone &&
            //           el.phone,
            //         student_id: el.student_id,
            //         block_1: examStudentPointOne && {
            //           result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
            //           point: examStudentPointOne.block_1
            //         },
            //         block_2: examStudentPointOne && {
            //           result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_2
            //         },
            //         block_3: examStudentPointOne && {
            //           result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_3
            //         },
            //         block_4: examStudentPointOne && {
            //           result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_4
            //         },
            //         block_5: examStudentPointOne && {
            //           result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_5
            //         },
            //         all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)

            //       }

            //     }).filter((e) => e && e);

            //     resData.push({
            //       'id': 'medium-other',
            //       'name': 'Boshqa o\'quvchilar 5-9 sinflar',
            //       'students': medium && medium.length > 0 ? medium : []
            //     })

            //   }
            //   if (studentClass[2] == 'high') {
            //     const high = dataStudentOther.filter(item => {
            //       let classNumber = parseInt(item.class.split('-')[0]);
            //       return (classNumber === 10 || classNumber === 11) || item.class === 'Bitirgan';
            //     }).map((el) => {
            //       const examStudentPointOne = examStudentPoint.find((e) => e.exam_student_id == el.id);
            //       return {
            //         id: el.id,
            //         class: el.class,
            //         science: el.science,
            //         firstname:
            //           el && el.firstname && el.firstname,
            //         lastname:
            //           el && el.lastname && el.lastname,
            //         phone:
            //           el &&
            //           el.phone &&
            //           el.phone,
            //         student_id: el.student_id,
            //         block_1: examStudentPointOne && {
            //           result: (examStudentPointOne.block_1 * 3.1).toFixed(2),
            //           point: examStudentPointOne.block_1
            //         },
            //         block_2: examStudentPointOne && {
            //           result: (examStudentPointOne.block_2 * 2.1).toFixed(2),
            //           point: examStudentPointOne.block_2
            //         },
            //         block_3: examStudentPointOne && {
            //           result: (examStudentPointOne.block_3 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_3
            //         },
            //         block_4: examStudentPointOne && {
            //           result: (examStudentPointOne.block_4 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_4
            //         },
            //         block_5: examStudentPointOne && {
            //           result: (examStudentPointOne.block_5 * 1.1).toFixed(2),
            //           point: examStudentPointOne.block_5
            //         },
            //         all_result: examStudentPointOne && (examStudentPointOne.block_1 * 3.1 + examStudentPointOne.block_2 * 2.1 + examStudentPointOne.block_3 * 1.1 + examStudentPointOne.block_5 * 1.1 + examStudentPointOne.block_4 * 1.1).toFixed(2)
            //       }


            //     }).filter((e) => e && e);

            //     resData.push({
            //       'id': 'high-other',
            //       'name': "Boshqa o'quvchilar 10-sinf va undan yuqori sinflar ",
            //       'students': high && high.length > 0 ? high : []
            //     })
            //   }
            // }

            let resSmsData = []
            // for (const dataS of resData) {
            if (resData && resData[0]?.students && resData[0].students.length > 0) {
                resData[0].students.forEach((el) => {
                    let obj = {
                        text: `${el.firstname + ' ' + el.lastname}  ${exam.date}-kungi DTM test natijalari. 
1.${el.block_1?.point ? el.block_1?.point : 0}/${el.block_1?.result ? el.block_1.result : 0} 
2.${el.block_2?.point ? el.block_2?.point : 0}/${el.block_2?.result ? el.block_2.result : 0} 
3.${el.block_3?.point ? el.block_3?.point : 0}/${el.block_3?.result ? el.block_3.result : 0} 
4.${el.block_4?.point ? el.block_4?.point : 0}/${el.block_4?.result ? el.block_4.result : 0} 
Jami ball: ${el.all_result ? el.all_result : 0}`,
                        phone: el.phone
                    }
                    resSmsData.push(obj)
                    return;
                })

            }
            if (resData && resData[1]?.students && resData[1].students.length > 0) {
                resData[1].students.map((el) => {
                    let obj = {
                        text: `${el.firstname + ' ' + el.lastname}  ${exam.date}-kungi DTM test natijalari. 
1.${el.block_1?.point ? el.block_1.point : 0}/${el.block_1?.result ? el.block_1.result : 0} 
2.${el.block_2?.point ? el.block_2.point : 0}/${el.block_2?.result ? el.block_2.result : 0} 
3.${el.block_3?.point ? el.block_3.point : 0}/${el.block_3?.result ? el.block_3.result : 0} 
Jami ball: ${el.all_result ? el.all_result : 0}`,
                        phone: el.phone
                    }
                    resSmsData.push(obj)
                    return;
                })

            }
            if (resData && resData[2]?.students && resData[2].students.length > 0) {
                resData[2].students.map((el) => {
                    let obj = {
                        text: `${el.firstname + ' ' + el.lastname}  ${exam.date}-kungi DTM test natijalari. 
1.${el.block_1?.point ? el.block_1.point : 0}/${el.block_1?.result ? el.block_1.result : 0} 
2.${el.block_2?.point ? el.block_2.point : 0}/${el.block_2?.result ? el.block_2.result : 0} 
3.${el.block_3?.point ? el.block_3.point : 0}/${el.block_3?.result ? el.block_3.result : 0} 
4.${el.block_4?.point ? el.block_4.point : 0}/${el.block_4?.result ? el.block_4.result : 0} 
5.${el.block_5?.point ? el.block_5.point : 0}/${el.block_5?.result ? el.block_5.result : 0} 
Jami ball: ${el.all_result ? el.all_result : 0}`,
                        phone: el.phone
                    }
                    resSmsData.push(obj)
                    return;
                })

            }
            let resSmsDataFileter = resSmsData.length > 0 && resSmsData.filter((el) => el && el);
            if (resSmsDataFileter && resSmsDataFileter.length > 0) {
                await sendMessage(resSmsDataFileter);
            }
            // }
            // return res.send('SMS sent');
            return res.json(resSmsData);
        } catch (error) {
            console.log(344, error.stack);
            return next(ApiError.badRequest(error.stack));
        }
    }
}

module.exports = new ExamsController();
