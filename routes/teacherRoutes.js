const Router = require("express");
const router = new Router();
const {
    teacherAdd,
    teacherDelete,
    teacherGet,
    teacherPut,
    teacherLabelGet,
    teacherGetOne,
    teacherAllListGet,
    teacherAddPaymet,
    teacherAllListLoginGet,
    teacherAllListCabinet,
    teacherStatisticsGetApi,
    teacherWedms,
    teacherCenterWedms,
    teacherWedmsNew,
    teacherCenterWedmsNew
} = require("../controllers/TeacherController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, teacherAdd);
router.post("/delete/:id", authMiddleware, teacherDelete);
router.post("/put/:id", authMiddleware, teacherPut);
router.post("/payment/:id", authMiddleware, teacherAddPaymet);
router.post("/statistics", authMiddleware, teacherStatisticsGetApi);
router.post("/wedms", authMiddleware, teacherWedmsNew);
router.get("/get", authMiddleware, teacherGet);
router.post("/center-wedms", authMiddleware, teacherCenterWedmsNew);
router.get("/label/get", authMiddleware, teacherLabelGet);
router.get("/all/list/get", authMiddleware, teacherAllListGet);
router.get("/all/login/list/get", authMiddleware, teacherAllListLoginGet);
router.get("/all/cabinet/list/get", authMiddleware, teacherAllListCabinet);
router.get("/get/one/:id", authMiddleware, teacherGetOne);

module.exports = router;
