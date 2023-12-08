const Router = require("express");
const router = new Router();

const userRouter = require("./userRouter");

const studentRouter = require("./studentRoute");
const groupRouter = require("./groupRouter");
const teacherRouter = require("./teacherRoutes");
const scienceRouter = require("./scienceRoute");
const paymentRouter = require("./paymentRoute");
const debtorRouter = require("./debtorRouter");
const studentPending = require("./StudentPending");
const groupStudents = require('./groupStudents');
const teacherGroups = require('./teacherGroups');
const messageRouter = require('./messageRouter');
const monthlyRouter = require('./monthlyRouter');
const pendingGroup = require("./PendingGroupsRouter");
const newPendingStudent = require('./newPendingStudent');
const dtmColumnsRouter = require('./dtmColumnsRouter');
const blacklistRouter = require('./blacklistRouter');
const rooms = require('./rooms');
const lessonGroup = require('./lessonGroups');
const exams = require('./examsRouter')
const studentOther = require('./studentsOther')
// const columsRouter = require("./dndColumnsRouter");

router.use("/user", userRouter);
router.use("/student", studentRouter);
router.use("/student_pending", studentPending);
router.use("/group-students", groupStudents);
router.use("/teacher-groups", teacherGroups);
router.use("/group", groupRouter);
router.use("/teacher", teacherRouter);
// router.use("/colums", columsRouter);
router.use("/science", scienceRouter);
router.use("/payment", paymentRouter);
router.use("/debtor", debtorRouter);
router.use("/message", messageRouter);
router.use("/monthly", monthlyRouter);
router.use("/pending-group", pendingGroup);
router.use("/new-pending-student", newPendingStudent);
router.use("/dtm-columns", dtmColumnsRouter);
router.use("/blacklist", blacklistRouter);
router.use("/rooms", rooms);
router.use("/lesson-group", lessonGroup);
router.use("/exams", exams);
router.use("/students-other", studentOther);

module.exports = router;
