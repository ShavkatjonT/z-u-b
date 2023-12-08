const Router = require("express");
const router = new Router();
const {
    PendingGroupsAdd,
    PendingGroupsDelete,
    PendingGroupsGet,
    PendingGroupsPut,
    GroupsCreateGroupTable,
    GroupsCreateGroupLeessonTable
} = require("../controllers/pendingGroup");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, PendingGroupsAdd);
router.post("/lesson-add", authMiddleware, GroupsCreateGroupLeessonTable);
router.post("/delete", authMiddleware, PendingGroupsDelete);
router.post("/put", authMiddleware, PendingGroupsPut);
router.post("/groups-create", authMiddleware, GroupsCreateGroupTable);
router.get("/get", authMiddleware, PendingGroupsGet);

module.exports = router;