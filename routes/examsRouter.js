const Router = require("express");
const router = new Router();
const {
    examAdd,
    examAllGet,
    examDelete,
    examGet,
    examPut,
    examExcelGet,
    examSearch,
    examStudentActiveGet,
    examStudentAdd,
    examStudentDelete,
    examStudentUpdate,
    examStudentActiveAllGet,
    examStudentPointAdd,
    examStudentActiveAllGetExcel,
    examStudentActiveAllGetExcelResult,
    examRoomsAdd,
    examStudentActiveAllGetResultSms,
    examRoomsSendMessege,
    examStudentActiveAllGetExcelNew,
    examRoomsSendMessegeNew
} = require("../controllers/examsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, examAdd);
router.post("/delete", authMiddleware, examDelete);
router.post("/put", authMiddleware, examPut);
router.get("/get/:id", authMiddleware, examGet);
router.get("/all/get", authMiddleware, examAllGet);
router.post("/excel", authMiddleware, examExcelGet);
router.post("/search", authMiddleware, examSearch);
router.get("/active-student-exam/:id", authMiddleware, examStudentActiveGet);
router.post("/all-active-student-exam", authMiddleware, examStudentActiveAllGet);
router.post("/exam-student-add", authMiddleware, examStudentAdd);
router.post("/exam-student-delete", authMiddleware, examStudentDelete);
router.post("/exam-student-update", authMiddleware, examStudentUpdate);
router.post("/exam-student-point", authMiddleware, examStudentPointAdd);
router.post("/all-student-point-excel", authMiddleware, examStudentActiveAllGetExcelNew);
router.post("/all-student-point-excel-result", authMiddleware, examStudentActiveAllGetExcelResult);
router.post("/all-student-point-sms-result", authMiddleware, examStudentActiveAllGetResultSms);
router.get("/exam-rooms/:id", authMiddleware, examRoomsAdd);
router.post("/exam-rooms-sms", authMiddleware, examRoomsSendMessegeNew);
module.exports = router;