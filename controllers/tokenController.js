const {
    SmsToken
} = require("../models/models");
const { Op } = require('sequelize');
const moment = require('moment');
const axios = require('axios')
const zlib = require('zlib');
const FormData = require('form-data');
const validateFun = require("./validateFun");
class TokenController {
    isTokenExpired(expirationDate) {
        const now = moment();
        const expiration = moment(expirationDate);
        return now.isAfter(expiration);
    }

    async generateNewToken() {
        try {
            const userConfig = {
                email: 'tuitcoder@gmail.com',
                password: '4dHp1tEMhnK1zl9NLXjxAvPizsYCy5LN3QSbJABS'
            }

            let userData = new FormData();
            userData.append('email', userConfig.email);
            userData.append('password', userConfig.password);

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://notify.eskiz.uz/api/auth/login',
                headers: {
                    ...userData.getHeaders()
                },
                data: userData
            };

            axios.request(config).then(async (response) => {
                if (response?.data?.data?.token) {
                    const expirationDate = moment().add(15, 'days').toDate();
                    await SmsToken.create({
                        token: response.data.data.token,
                        expirationDate: expirationDate,
                    });
                }
            }).catch((error) => {
                console.log(43, error);
            });

            // const response = await axios.post(
            //     'https://notify.eskiz.uz/api/auth/login',
            //     {
            //         email: userConfig.email,
            //         password: userConfig.email,
            //     },
            //     { responseType: 'arraybuffer' }
            // );
            return 'update token'
            // const data = zlib.gunzipSync(response.data).toString();
            // if (data) {
            //     const newToken = JSON.parse(data).data.token;
            //     

            //     return newToken;
            // } else {
            //     throw error;
            // }

        } catch (error) {
            console.error(71, error);
            throw error;
        }
    }

    async getCurrentToken() {
        const latestToken = await SmsToken.findOne({
            order: [['createdAt', 'DESC']],
        });

        if (!latestToken) {
            return this.generateNewToken();
        }

        if (this.isTokenExpired(latestToken.expirationDate)) {
            try {
                await latestToken.destroy();
                return this.generateNewToken();
            } catch (error) {
                console.error('Error deleting expired token:', error);
                throw error;
            }
        }

        return latestToken.token;
    }

}

module.exports = new TokenController();
