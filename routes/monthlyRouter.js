const Router = require("express");
const router = new Router();
const {
  monthlyDelete,
  monthlyGet,
  monthlyPut
} = require("../controllers/monthlyControlerr");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/delete", authMiddleware, monthlyDelete);
router.post("/put", authMiddleware, monthlyPut);
router.post("/get/:id", authMiddleware, monthlyGet);


module.exports = router