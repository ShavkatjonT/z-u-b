const { Debtors, GroupStudents, Teachers, Students, TeacherWedms } = require("../models/models");
const Sequelize = require("sequelize");
const sendMessage = require("./sendMessageController");

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        dialect: "postgres",
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
        },
    }
);

class cronController {
    async eachStudents(student) {
        return new Promise(async resolve => {
            const monthOne = new Date().getMonth() + 1;
            const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;
            let debt = student.month_payment
            let status = "active"
            if (student.wallet > 0) {
                let teacher_sum = student.wallet;
                let newWallet = 0;
                if (student.wallet > student.month_payment) {
                    teacher_sum = student.month_payment
                    newWallet = student.wallet - student.month_payment
                    debt = 0
                    status = 'inactive'
                }
                debt -= student.wallet;
                let gr_student = await GroupStudents.findOne({ where: student.group_student_id });

                if (gr_student.dataValues) {
                    await GroupStudents.update({ wallet: newWallet }, { where: { group_id: student.group_id, student_id: student.student_id } })
                }

                const teacher = await Teachers.findOne({ where: { id: student.teacher_id } });
                if (teacher) {
                    teacher.wallet = teacher.wallet + teacher_sum;
                    await TeacherWedms.create({
                        group_id: gr_student && gr_student?.group_id ? gr_student?.group_id : '',
                        teacher_id: teacher.id,
                        teacher_sum: teacher_sum
                    });
                    await teacher.save();
                }
            }

            if (debt > 0) {
                await Debtors.create({
                    student_id: student.student_id,
                    group_id: student.group_id,
                    month: currentMonth,
                    amount: debt,
                    all_summa: student.month_payment,
                    status: status
                });
            }

            resolve("done")
        })

    }

    async fiveDay() {
        try {
            const monthOne = new Date().getMonth() + 1;
            const currentMonth = new Date().getFullYear() + "-" + (monthOne <= 9 ? "0" : '') + '' + monthOne;
            const query = `
      SELECT 
        gs.wallet AS wallet, 
        gs.student_id AS student_id, 
        gs.group_id AS group_id,
        gr.name AS group_name,
        gr.sale AS sale,
        gs.month_payment AS month_payment,
        tch.id as teacher_id,
        tch.wallet as teacher_wallet
      FROM group_students AS gs 
      INNER JOIN groups gr ON gr.id::VARCHAR(255) = gs.group_id
      INNER JOIN teacher_groups AS tchg ON tchg.group_id = gs.group_id
      INNER JOIN teachers AS tch ON tch.id::VARCHAR(255) = tchg.teacher_id
      WHERE gs.status = 'active' AND gr.status = 'active' AND tchg.status = 'active';
      `;
            const students = await sequelize.query(query, {
                model: GroupStudents,
                mapToModel: true,
                nest: true,
                raw: true,
            });

            if (students && students.length > 0) {
                try {
                    for (const student of students) {
                        if (
                            student.student_id &&
                            student.group_id &&
                            currentMonth &&
                            student.month_payment > 0
                        ) {
                            let res = await this.eachStudents(student);
                            console.log(101, res);
                        }
                    };
                } catch (e) {
                    throw new Error(e);
                }
            }
            return "saved to debtors";
        } catch (e) {
            console.log(e);
        }
    }

    async twentyDay() {
        try {
            const query = `
        SELECT 
            dbt.student_id,
            SUM(amount),
            array_to_string(ARRAY_AGG(dbt.group_id),';') As groups,
            array_to_string(ARRAY_AGG(dbt.month),';') As months,
            st.firstname,
            st.lastname,
            st."fatherPhone",
            st."motherPhone"
        FROM debtors dbt
        INNER JOIN students st ON st.id::varchar(255) = dbt.student_id AND st.status = 'active'
        WHERE 
            dbt.status = 'active'
        GROUP BY
            dbt.student_id,
            st.firstname,
            st.lastname,
            st."fatherPhone",
            st."motherPhone";
            `;
            let students = await sequelize.query(query, {
                model: Debtors,
                mapToModel: true,
                nest: true,
                raw: true,
            });


            if (students && students.length > 0) {
                students = students.map((student) => {
                    let data = {
                        student_id: student.student_id,
                        name: student.firstname + " " + student.lastname,
                        amount: student.sum,
                        groups:
                            student.groups &&
                            student.groups.length > 0 &&
                            student.groups.split(";"),
                        months:
                            student.months &&
                            student.months.length > 0 &&
                            student.months.split(";"),
                        fatherPhone: student.fatherPhone,
                        motherPhone: student.motherPhone,
                    };
                    return data;
                });

                this.sendMessage(students);
            }
            return "send sms";
        } catch (e) {
            console.log(e);
        }
    }

    async sendMessage(students) {
        if (students && students.length > 0) {
            students.forEach(async (student) => {
                const groupFuc = async () => {
                    const sendData = [
                        {
                            phone: student.fatherPhone
                                ? student.fatherPhone
                                : student.motherPhone,
                            text: `"Zukko INM" o'quv markazi: Eslatib o'tmoqchimiz farzandingiz ${student.name
                                } ${student.amount
                                } so'm qarzdorligi mavjud. Iltimos qarzdorlik summasini to'lang.`,
                        },
                    ];

                    sendMessage(sendData);
                };
                const groupResult = groupFuc();
                return groupResult;
            });
        }
    }

    async secondSms() {
        try {
            const students = await sequelize.query(`SELECT * FROM Students WHERE status = 'active';`);
            const gr_student = await GroupStudents.findAll({
                where: {
                    status: 'active'
                }
            });
            const monthOne = new Date().getMonth() + 1;
            const monthFun = (arr) => {
                let monthPay;
                switch (arr) {
                    case "01":
                        monthPay = "Fevral";
                        break;
                    case "02":
                        monthPay = "Mart";
                        break;
                    case "03":
                        monthPay = "Aprel";
                        break;
                    case "04":
                        monthPay = "May";
                        break;
                    case "05":
                        monthPay = "Iyun";
                        break;
                    case "06":
                        monthPay = "Iyul";
                        break;
                    case "07":
                        monthPay = "Avgust";
                        break;
                    case "08":
                        monthPay = "Sentabr";
                        break;
                    case "09":
                        monthPay = "Oktabr";
                        break;
                    case "10":
                        monthPay = "Noyabr";
                        break;
                    case "11":
                        monthPay = "Dekabr";
                        break;
                    case "12":
                        monthPay = "Yanvar";
                        break;

                    default:
                        break;
                }
                return monthPay;
            };


            students && students[0].forEach((el) => {
                const gr_student_one = gr_student.filter((e) => e.student_id == el.id);

                let gr_wallet = 0;
                let gr_amount = 0;
                gr_student_one && gr_student_one.forEach((e) => {
                    gr_amount = gr_amount + e.month_payment;
                    gr_wallet = gr_wallet + e.wallet
                });

                const amount = gr_amount - gr_wallet

                const sendData = [{
                    phone: el.fatherPhone
                        ? el.fatherPhone
                        : el.motherPhone,
                    text: `Farzandingizning ${monthFun((monthOne <= 9 ? "0" : '') + '' + monthOne)} oyi uchun ${amount}  so'm miqdorda to'lovini oyning 5-sanasigacha amalga oshirishni unutmang! ZUKKO INM +998-90-700-45-00`,
                },
                ];
                if (amount != 0 || amount > 0) {
                    sendMessage(sendData);
                }


            });
            return "smslar yuborildi "
        } catch (error) {
            console.log(204, error);
        }
    }

    async updateStudentClass() {
        try {

            const students = await Students.findAll();

            for (const student of students) {
                switch (student.class) {
                    case "1-sinf":
                        student.class = "2-sinf";
                        break;
                    case "2-sinf":
                        student.class = "3-sinf";
                        break;
                    case "3-sinf":
                        student.class = "4-sinf";
                        break;
                    case "4-sinf":
                        student.class = "5-sinf";
                        break;
                    case "6-sinf":
                        student.class = "7-sinf";
                        break;
                    case "7-sinf":
                        student.class = "8-sinf";
                        break;
                    case "8-sinf":
                        student.class = "9-sinf";
                        break;
                    case "9-sinf":
                        student.class = "10-sinf";
                        break;
                    case "10-sinf":
                        student.class = "11-sinf";
                        break;
                    case "11-sinf":
                        student.class = "Bitirgan";
                        break;
                }

                await student.save();
            }

            console.log('All student classes updated successfully.');
        } catch (error) {
            console.error('Error updating student classes:', error);
        }
    }
}

module.exports = new cronController();


