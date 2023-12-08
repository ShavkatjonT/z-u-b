const Router = require("express");
const router = new Router();
const {
   messageAddOne,
   messageGet,
   messageAddGroup,
   messageAddList,
   messageAddPendingGroup,
   messageAddPendingStudentOne,
   messageAllStudentSendMessage
} = require("../controllers/messagesController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add/one", authMiddleware, messageAddOne);
router.post("/add/group", authMiddleware, messageAddGroup);
router.post("/add/list", authMiddleware, messageAddList);
router.post("/all/list", authMiddleware, messageAllStudentSendMessage);
router.post("/add/pending-group", authMiddleware, messageAddPendingGroup);
router.post("/add/pending-student", authMiddleware, messageAddPendingStudentOne);
router.get("/get",authMiddleware, messageGet);

module.exports = router