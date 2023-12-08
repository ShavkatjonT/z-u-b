const ApiError = require("../error/ApiError");
const bcrypt = require("bcrypt");
const { User, Teachers, FreezeUsers } = require("../models/models");
const jwt = require("jsonwebtoken");
const validateFun = require("./validateFun");
const generateJwt = (id, email, role) => {
    return jwt.sign({ id, email, role }, process.env.SECRET_KEY, {
        expiresIn: "50m",
    });
};
const { Op } = require("sequelize");
class userController {
    async registration(req, res, next) {
        const { email, password, role, teacher_id } = req.body;

        if (!email || !password) {
            return next(ApiError.badRequest("Email yoki parol kiritilmadi!"));
        }

        const candidate = await User.findOne({ where: { email } });
        if (candidate) {
            return next(
                ApiError.badRequest(`Ushbu elektron pochta ro'yxattan o'tkazilgan`)
            );
        }

        const hashPassword = await bcrypt.hash(password, 5);
        const user = await User.create({
            email,
            password: hashPassword,
            teacher_id,
            role,
        });

        const token = generateJwt(user.id, user.email, user.role);
        return res.json({ token });
    }

    async registrationSuper(req, res, next) {
        const { email, password, lastname, firstname, gender, phone } = req.body;
        if (!email || !password) {
            return next(ApiError.badRequest("Email yoki parol kiritilmadi!"));
        }

        if (!lastname || !firstname || !gender || !phone) {
            return next(
                ApiError.badRequest('Incomplete data entry')
            )
        };

        const candidate = await User.findOne({
            where: {
                email,
                [Op.or]: [
                    { status: "frozen" },
                    { status: "active" },
                ],
            }
        });
        if (candidate) {
            return next(
                ApiError.badRequest(`Ushbu elektron pochta ro'yxattan o'tkazilgan`)
            );
        };



        const hashPassword = await bcrypt.hash(password, 5);
        const user = await User.create({
            email,
            password: hashPassword,
            role: 'super',
            lastname,
            firstname,
            gender,
            phone
        });

        const token = generateJwt(user.id, user.email, user.role);
        return res.json({ token });
    }

    async registrationAdmin(req, res, next) {
        const role = jwt.verify(
            req.headers.authorization.split(' ')[1],
            process.env.SECRET_KEY
        );

        if (role && role.role == 'super') {
            const { email, password, lastname, firstname, gender, phone } = req.body;

            if (!email || !password) {
                return next(ApiError.badRequest("Email yoki parol kiritilmadi!"));
            };

            if (!lastname || !firstname || !gender || !phone) {
                return next(
                    ApiError.badRequest('Incomplete data entry')
                )
            };

            const candidate = await User.findOne({
                where: {
                    email, [Op.or]: [
                        { status: "frozen" },
                        { status: "active" },
                    ],
                }
            });
            if (candidate) {
                return next(
                    ApiError.badRequest(`Ushbu elektron pochta ro'yxattan o'tkazilgan`)
                );
            }

            const hashPassword = await bcrypt.hash(password, 5);
            const user = await User.create({
                email,
                password: hashPassword,
                role: 'admin',
                lastname,
                firstname,
                gender,
                phone
            });

            const token = generateJwt(user.id, user.email, user.role);
            return res.json({ token });
        } else {
            return next(
                ApiError.badRequest('Changing user data is not allowed')
            )
        }


    }

    async registrationTeacher(req, res, next) {
        const { email, password, teacher_id } = req.body;

        if (!teacher_id || !validateFun.isValidUUID(teacher_id)) {
            return next(
                ApiError.badRequest('Teacher not found')
            )
        } else {
            const teacher = await Teachers.findOne({
                where: {
                    status: 'active',
                    id: teacher_id
                }
            })
            if (!teacher) {
                return next(
                    ApiError.badRequest('Teacher not found')
                )
            }
        }

        if (!email || !password) {
            return next(ApiError.badRequest("Email yoki parol kiritilmadi!"));
        }

        const candidate = await User.findOne({
            where: {
                email, [Op.or]: [
                    { status: "frozen" },
                    { status: "active" },
                ],
            }
        });
        if (candidate) {
            return next(
                ApiError.badRequest(`Ushbu elektron pochta ro'yxattan o'tkazilgan`)
            );
        }

        const hashPassword = await bcrypt.hash(password, 5);
        const user = await User.create({
            email,
            password: hashPassword,
            teacher_id,
            role: 'teacher',
        });

        const token = generateJwt(user.id, user.email, user.role);
        return res.json({ token });
    }

    async login(req, res, next) {
        const { email, password } = req.body;
        const user = await User.findOne({ where: { email, status: 'active' } });
        if (!user) {
            return next(ApiError.internal("Bunday foydalanuvchi topilmadi"));
        }

        let comparePassword = bcrypt.compareSync(password, user.password);
        if (!comparePassword) {
            return next(ApiError.internal("Parol notogri kiritildi"));
        }
        const teacher = user.teacher_id && {
            id: user.teacher_id,
        };

        const token = generateJwt(user.id, user.email, user.role);
        res.json({ token, teacher, role: user.role });

    }

    async delete(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );
            if (role.role == 'admin' || role.role == 'super') {
                const { id } = req.body;
                if (!id || !validateFun.isValidUUID(id)) {
                    return next(
                        ApiError.badRequest('no data found')
                    )
                }
                if (id && validateFun.isValidUUID(id)) {
                    const user = role.role == 'admin' ? await User.findOne({ where: { id, status: "active", role: 'teacher' } }) : await User.findOne({
                        where: {
                            id,
                             [Op.or]: [
                                { status: "frozen" },
                                { status: "active" },
                            ],
                        }
                    });
                    if (!user) {
                        return next(ApiError.badRequest("user topilmadi"));
                    }
                }
                const userDelete = await User.destroy({ where: { id } });
                res.json(userDelete);
            } return next(
                ApiError.badRequest('Changing user data is not allowed')
            )

        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async update(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );

            if (role && role.role == 'super') {
                const { id, email, password, lastname, firstname, gender, phone } = req.body;

                if (!id || !validateFun.isValidUUID(id)) {
                    return next(
                        ApiError.badRequest('no data found')
                    )
                }

                if (id && validateFun.isValidUUID(id)) {
                    const user = await User.findOne({ where: { id, status: "active" } });
                    if (!user) {
                        return next(ApiError.badRequest("user topilmadi"));
                    }
                }

                const user = await User.findOne({
                    where: {
                        id,
                        [Op.or]: [
                            { status: "frozen" },
                            { status: "active" },
                            { role: "teacher" },
                            { role: "admin" },
                        ],
                    },
                });


                if (email) {
                    const candidate = await User.findOne({ where: { email, status: 'active' } });
                    if (candidate && candidate.id !== id) {
                        return next(
                            ApiError.badRequest(`Ushbu elektron pochta ro'yxattan o'tkazilgan`)
                        );
                    }
                    user.email = email;
                };

                if (password) {
                    const hashPassword = await bcrypt.hash(password, 5);
                    user.password = hashPassword;
                }

                if (gender) user.gender = gender;
                if (lastname) user.lastname = lastname;
                if (firstname) user.firstname = firstname;
                if (phone) user.phone = phone;

                const userSave = await user.save();
                return res.json({ userSave });
            } else {
                return next(
                    ApiError.badRequest('Changing user data is not allowed')
                )
            }



        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async updateAdminTeacher(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );

            if (role && role.role == 'admin') {
                const { id, email, password, } = req.body;

                if (!id || !validateFun.isValidUUID(id)) {
                    return next(
                        ApiError.badRequest('no data found')
                    )
                }

                if (id && validateFun.isValidUUID(id)) {
                    const user = await User.findOne({
                        where: {
                            id,
                            status: "active",
                            role: "teacher"
                        }
                    });
                    if (!user) {
                        return next(ApiError.badRequest("user topilmadi"));
                    }
                }

                const user = await User.findOne({
                    where: {
                        id,
                        status: "active",
                        role: "teacher"
                    },
                });


                if (email) {
                    const candidate = await User.findOne({ where: { email, status: 'active' } });
                    if (candidate && candidate.id !== id) {
                        return next(
                            ApiError.badRequest(`Ushbu elektron pochta ro'yxattan o'tkazilgan`)
                        );
                    }
                    user.email = email;
                };

                if (password) {
                    const hashPassword = await bcrypt.hash(password, 5);
                    user.password = hashPassword;
                }



                const userSave = await user.save();
                return res.json({ userSave });
            } else {
                return next(
                    ApiError.badRequest('Changing user data is not allowed')
                )
            }



        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async updateAdmin(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );

            if (role.role == 'admin') {
                const { id, email, password, lastname, firstname, gender, phone } = req.body;

                if (!id || !validateFun.isValidUUID(id)) {
                    return next(
                        ApiError.badRequest('no data found')
                    )
                }

                if (id && validateFun.isValidUUID(id)) {
                    const user = await User.findOne({ where: { id, status: "active", role: 'admin' } });
                    if (!user) {
                        return next(ApiError.badRequest("user topilmadi"));
                    };

                    if (role.email != user.email) {
                        return next(
                            ApiError.badRequest('Changing user data is not allowed')
                        )
                    }

                }

                const user = await User.findOne({ where: { id, status: "active", role: 'admin' } });


                if (email) {
                    const candidate = await User.findOne({ where: { email, status: 'active' } });
                    if (candidate && candidate.id !== id) {
                        return next(
                            ApiError.badRequest(`Ushbu elektron pochta ro'yxattan o'tkazilgan`)
                        );
                    }
                    user.email = email;
                };

                if (password) {
                    const hashPassword = await bcrypt.hash(password, 5);
                    user.password = hashPassword;
                }

                if (gender) user.gender = gender;
                if (lastname) user.lastname = lastname;
                if (firstname) user.firstname = firstname;
                if (phone) user.phone = phone;

                const userSave = await user.save();
                return res.json({ userSave });

            } else {
                return next(
                    ApiError.badRequest('Changing user data is not allowed')
                )
            }

        } catch (error) {
            return next(ApiError.badRequest(error));
        }
    }

    async updateSuper(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );

            if (role.role == 'super') {
                const { id, email, password, lastname, firstname, gender, phone } = req.body;

                if (!id || !validateFun.isValidUUID(id)) {
                    return next(
                        ApiError.badRequest('no data found')
                    )
                }

                if (id && validateFun.isValidUUID(id)) {
                    const user = await User.findOne({ where: { id, status: "active", role: 'super' } });
                    if (!user) {
                        return next(ApiError.badRequest("user topilmadi"));
                    };

                    if (role.email != user.email) {
                        return next(
                            ApiError.badRequest('Changing user data is not allowed')
                        )
                    }

                }

                const user = await User.findOne({ where: { id, status: "active", role: 'super' } });


                if (email) {
                    const candidate = await User.findOne({ where: { email, status: 'active' } });
                    if (candidate && candidate.id != id) {
                        return next(
                            ApiError.badRequest(`Ushbu elektron pochta ro'yxattan o'tkazilgan`)
                        );
                    }
                    console.log(465, email);
                    user.email = email;
                };

                if (password) {
                    const hashPassword = await bcrypt.hash(password, 5);
                    user.password = hashPassword;
                }

                if (gender) user.gender = gender;
                if (lastname) user.lastname = lastname;
                if (firstname) user.firstname = firstname;
                if (phone) user.phone = phone;

                const userSave = await user.save();
                return res.json({ userSave });

            } else {
                return next(
                    ApiError.badRequest('Changing user data is not allowed')
                )
            }

        } catch (error) {
            console.log(488, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async userGet(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );

            const email = role.email;
            const user = await User.findOne({
                where: {
                    status: 'active',
                    email: email
                }
            });

            const newData = user ? {
                id: user.id,
                email: user.email,
                lastname: user?.lastname ? user.lastname : '',
                firstname: user?.firstname ? user.firstname : '',
                gender: user?.gender ? user.gender : '',
                phone: user?.phone ? user.phone : '',
            } : null


            res.json(newData)

        } catch (error) {
            console.log(446, error.stack);
            return next(ApiError.badRequest(error));
        }
    }

    async userAddFreezeUser(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );
            if (role.role == 'super') {
                const { id } = req.body;
                if (!id || !validateFun.isValidUUID(id)) {
                    return next(
                        ApiError.badRequest('no data found')
                    )
                };
                const user = await User.findOne({
                    where: {
                        id,
                        status: 'active',
                        role: 'admin'
                    }
                });
                if (!user) {
                    return next(
                        ApiError.badRequest('No data found')
                    );
                };

                const [date, time] = validateFun.isLocatonTime().split(' ')

                user.status = 'frozen';
                await FreezeUsers.create({
                    user_id: id,
                    start_date: date,
                    start_time: time,
                    description: ''
                });
                await user.save();

                return res.send('Admin has been frozen')
            } else {
                return next(
                    ApiError.badRequest('Changing user data is not allowed')
                )
            };
        } catch (error) {
            console.log(455, error.stack);
            return next(ApiError.badRequest(error));

        }
    }

    async userDeleteFreezeUser(req, res, next) {
        try {
            const role = jwt.verify(
                req.headers.authorization.split(' ')[1],
                process.env.SECRET_KEY
            );
            if (role.role == 'super') {
                const { id } = req.body;
                if (!id || !validateFun.isValidUUID(id)) {
                    return next(
                        ApiError.badRequest('no data found')
                    )
                };
                const user = await User.findOne({
                    where: {
                        id,
                        status: 'frozen',
                        role: 'admin'
                    }
                });
                if (!user) {
                    return next(
                        ApiError.badRequest('No data found')
                    );
                };

                const [date, time] = validateFun.isLocatonTime().split(' ')

                user.status = 'active';
                const freezeUser = await FreezeUsers.findOne({
                    where: {
                        status: 'active',
                        user_id: id
                    }
                });
                if (freezeUser) {
                    freezeUser.end_date = date;
                    freezeUser.end_time = time;
                    freezeUser.status = 'inactive';
                    freezeUser.description = '';
                    await freezeUser.save()
                }

                await user.save();

                return res.send('Admin unfrozen')
            } else {
                return next(
                    ApiError.badRequest('Changing user data is not allowed')
                )
            };
        } catch (error) {
            console.log(455, error.stack);
            return next(ApiError.badRequest(error));

        }
    }




    async check(req, res, next) {
        const token = generateJwt(req.user.id, req.user.email, req.user.role);
        res.json({ token });
    }
}
module.exports = new userController();
