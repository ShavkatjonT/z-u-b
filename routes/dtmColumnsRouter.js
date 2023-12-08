const Router = require("express");
const router = new Router();
const {
 columsItemsPut
} = require("../controllers/dtmColumnsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/items/put", authMiddleware, columsItemsPut);

module.exports = router;