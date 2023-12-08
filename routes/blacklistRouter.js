const Router = require("express");
const router = new Router();
const {
    blacklistAdd,
    blacklistGet,
    blacklistCheked,
    blacklistStudentGet,
    blacklistDelete,
    blacklistPut
} = require("../controllers/blacklistController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, blacklistAdd);
router.post("/cheked", authMiddleware, blacklistCheked);
router.post("/delete",authMiddleware,  blacklistDelete);
router.post("/put",authMiddleware,  blacklistPut);
router.get("/get", authMiddleware, blacklistGet);
router.get("/student/get", authMiddleware, blacklistStudentGet);

module.exports = router;
