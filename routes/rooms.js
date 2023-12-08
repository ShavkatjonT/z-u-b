const Router = require("express");
const router = new Router();
const {
  roomAdd,
  roomAllGet,
  roomDeleteOne,
  roomPut,
  roomLessonGet
} = require("../controllers/roomsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, roomAdd);
router.post("/delete",authMiddleware,  roomDeleteOne);
router.post("/put",authMiddleware,  roomPut);
router.get("/get", authMiddleware, roomAllGet);
router.get("/lesson/get", authMiddleware,  roomLessonGet);

module.exports = router;