const Router = require("express");
const router = new Router();
const userController = require("../controllers/userController");
const {
    registration,
    registrationAdmin,
    registrationSuper,
    registrationTeacher,
    userGet,
    update,
    updateAdmin,
    updateSuper,
    check,
    updateAdminTeacher,
    login,
    userAddFreezeUser,
    userDeleteFreezeUser
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
// router.post("/registration", userController.registration);
router.post("/registration-supper", registrationSuper);
router.post("/registration", authMiddleware, registrationAdmin);
router.post("/teacher-registration", authMiddleware, registrationTeacher);
router.post("/login", login);
router.get("/auth", authMiddleware, check);
router.post("/delete", authMiddleware, userController.delete);
router.post("/put", authMiddleware, update);
router.post("/put-teacher", authMiddleware, updateAdminTeacher);
router.post("/put-admin", authMiddleware, updateAdmin);
router.post("/put-super", authMiddleware, updateSuper);
router.post("/add-freeze", authMiddleware, userAddFreezeUser);
router.post("/delete-freeze", authMiddleware, userDeleteFreezeUser);
router.get("/get", authMiddleware, userGet);

module.exports = router;
