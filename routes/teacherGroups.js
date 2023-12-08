const Router = require("express");
const router = new Router();
const {
  teacherGroupsAdd,
  teacherGroupsDelete,
  teacherGroupsGet,
  teacherGroupsPut
} = require("../controllers/teacherGroupsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, teacherGroupsAdd);
router.post("/delete/:id", authMiddleware, teacherGroupsDelete);
router.post("/put/:id", authMiddleware, teacherGroupsGet);
router.get("/get", authMiddleware, teacherGroupsPut);

module.exports = router;