const Router = require("express");
const router = new Router();
const {
    groupAdd,
    groupDelete,
    groupGet,
    groupPut,
    groupGetOne,
    groupTeacherGet,
    groupLesson,
    groupLessonPut,
    groupDeleteNew
} = require("../controllers/groupsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, groupAdd);
router.post("/lesson-add", authMiddleware, groupLesson);
router.post("/delete/:id", authMiddleware, groupDeleteNew);
router.post("/put/:id", authMiddleware, groupPut);
router.post("/lesson-put/:id", authMiddleware, groupLessonPut);
router.get("/get/:id", authMiddleware, groupGet);
router.get("/teacher-groups/get", authMiddleware, groupTeacherGet);
router.get("/get/one/:id", authMiddleware, groupGetOne);

module.exports = router;
