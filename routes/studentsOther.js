const Router = require("express");
const router = new Router();
const {
   studentAdd,
   studentDelete,
   studentGet,
   studentPut,
} = require("../controllers/studentsOther");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, studentAdd);
router.post("/delete", authMiddleware, studentDelete);
router.post("/put", authMiddleware, studentPut);
router.get("/get/:id", authMiddleware, studentGet);


module.exports = router;
