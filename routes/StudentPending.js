const Router = require("express");
const router = new Router();
const {
   studentPendingAdd,
   studentPendingDelete,
   studentPendingGet,
   studentPendingGetOne,
   studentPendingGetList,
   studentPendingAllGetList,
   studentPendingPut,
   studentPendingGroupAdd,
   studentPendingAllGetListNew
} = require("../controllers/StudentPendingController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, studentPendingAdd);
router.post("/delete/:id", authMiddleware, studentPendingDelete);
router.post("/put/:id", authMiddleware, studentPendingPut);
router.post("/group-add-student", authMiddleware, studentPendingGroupAdd);
router.get("/get", authMiddleware, studentPendingGet);
router.get("/get/one/:id", authMiddleware, studentPendingGetOne);
router.post("/list/get/:id", authMiddleware, studentPendingGetList);
router.get("/all/list/get", authMiddleware, studentPendingAllGetListNew);

module.exports = router;
