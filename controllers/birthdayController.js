const sendMessage = require('./sendMessageController');
const sequelize = require('../db');
const validateFun = require("./validateFun");
class BirthdayController {
    async sendBirthdayData() {
    const students =await sequelize.query(`
         SELECT *, birthday FROM students
         WHERE DATE_PART('day', birthday::date) = DATE_PART('day', CURRENT_DATE)
         AND DATE_PART('month', birthday::date) = DATE_PART('month', CURRENT_DATE);
        `);
        
        students[0].forEach((e)=>{
            const sendData = [{
                phone:e.fatherPhone?e.fatherPhone:e.motherPhone,
                text:`Zukko INM jamoasi farzandingiz ${ e.firstname +' ' + e.lastname} ni bugungi tavallud ayyomi bilan muborakbod etadi.`
            }];
            return sendMessage(sendData);
        })

        
        
        return ' Tug\'ilgan kun bilan tabriklayman'
    }
}

module.exports = new BirthdayController();
