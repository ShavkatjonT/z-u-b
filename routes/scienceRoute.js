const Router = require("express");
const router = new Router();

const {
    sciencesAdd,
    sciencesDelete,
    sciencesGet,
    sciencesPut,
    sciencesStudentGet
} = require("../controllers/sciencesController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, sciencesAdd);
router.post("/delete", authMiddleware, sciencesDelete);
router.post("/put", authMiddleware, sciencesPut);
router.get("/get", authMiddleware, sciencesGet);
router.get("/student/get", authMiddleware, sciencesStudentGet);

module.exports = router;
