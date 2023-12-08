const Router = require("express");
const router = new Router();
const {
    studentAdd,
    studentDelete,
    studentPut,
    studentGet,
    studentGetOne,
    studentGetList,
    studentGroupGetList,
    studentOneDelete,
    studentGetListSearch,
    studentAllSendMessage
} = require("../controllers/studentsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, studentAdd);
router.post("/delete/:id", authMiddleware, studentDelete);
router.post("/delete/one/:id", authMiddleware, studentOneDelete);
router.post("/put/:id", authMiddleware, studentPut);
router.get("/get", authMiddleware, studentGet);
router.get("/get/one/:id", authMiddleware, studentGetOne);
router.get("/list/get", authMiddleware, studentGetList);
router.get("/group/list/get/:group_id", authMiddleware, studentGroupGetList);
router.get("/list/get/search/", authMiddleware, studentGetListSearch);
router.post("/all-student-send-messages", authMiddleware, studentAllSendMessage);

module.exports = router;
