const Router = require("express");
const router = new Router();
const {
   studentAdd,
   studentDelete,
   studentGetOne,
   studentGroupGetList,
//    studentOneDelete,
   studentPut,
   studentCreateStudentTable
} = require("../controllers/newPendingStudent");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, studentAdd);
router.post("/delete", authMiddleware, studentDelete);
router.post("/put/:id", authMiddleware,studentPut );
router.post("/student-create", authMiddleware,studentCreateStudentTable );
// router.get("/get", authMiddleware, );
router.get("/get/one/:id", authMiddleware, studentGetOne);
router.get("/list/get/:id", authMiddleware, studentGroupGetList );


module.exports = router;
