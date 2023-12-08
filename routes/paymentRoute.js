const Router = require("express");
const router = new Router();
const {
    paymentDelete,
    paymentGet,
    paymentAdd,
    paymentPut,
    paymentExcelData,
    paymentChartGet,
    paymentDeleteData
} = require("../controllers/paymentsController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/add", authMiddleware, paymentAdd);
router.post("/delete", authMiddleware, paymentDelete);
router.post("/put", authMiddleware, paymentPut);
router.post("/excel/list", authMiddleware, paymentExcelData);
router.get("/chart/list", authMiddleware, paymentChartGet);
router.post("/data", authMiddleware, paymentGet);
router.post("/get-delete-data", authMiddleware, paymentDeleteData);
module.exports = router;
