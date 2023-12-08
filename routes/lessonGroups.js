const Router = require("express");
const router = new Router();
const {
   lessonAllGet,
   lessonAllWeekdayGet,
   lessonAllWeekdayExcelGet
} = require("../controllers/lessonGroup");
const authMiddleware = require("../middleware/authMiddleware");
// router.get("/lessonAllGet",authMiddleware,   lessonAllGet);
router.get("/lessonAllGet/:day", authMiddleware, lessonAllWeekdayGet);
router.get("/lessonAllExcelGet", authMiddleware, lessonAllWeekdayExcelGet);


module.exports = router;
