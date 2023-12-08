const Router = require("express");
const router = new Router();
const {
   groupStudentsAdd,
   groupStudentsDelete,
   groupStudentsGet,
   groupStudentsPut,
   groupStudentsPutSumma,
   groupStudentsExportNewGroup
} = require("../controllers/groupStudentsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, groupStudentsAdd);
router.post("/delete/:id", authMiddleware, groupStudentsDelete);
router.post("/put/:id", authMiddleware, groupStudentsPut);
router.post("/summa/put", authMiddleware, groupStudentsPutSumma);
router.post("/student-export", authMiddleware, groupStudentsExportNewGroup);
router.get("/get", authMiddleware, groupStudentsGet);

module.exports = router;