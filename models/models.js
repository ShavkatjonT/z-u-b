const sequelize = require("../db");
const { DataTypes, Model } = require("sequelize");
const { Sequelize } = require("../db");
const User = sequelize.define("user", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  email: { type: DataTypes.STRING, unique: true },
  password: { type: DataTypes.STRING },
  teacher_id: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  lastname: { type: DataTypes.STRING },
  firstname: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  gender: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const FreezeUsers = sequelize.define('freeze_users', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  user_id: { type: DataTypes.STRING },
  start_date: { type: DataTypes.STRING },
  start_time: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  end_date: { type: DataTypes.STRING },
  end_time: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const Students = sequelize.define("students", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  firstname: { type: DataTypes.STRING },
  gender: { type: DataTypes.STRING },
  birthday: { type: DataTypes.STRING },
  lastname: { type: DataTypes.STRING },
  fathername: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  fatherPhone: { type: DataTypes.STRING },
  motherPhone: { type: DataTypes.STRING },
  science: { type: DataTypes.JSON },
  dtmcolumns_id: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  blacklist_id: { type: DataTypes.JSON },
  rating: { type: DataTypes.STRING, defaultValue: 10 },
  class: { type: DataTypes.STRING },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const Groups = sequelize.define("groups", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  room_id: { type: DataTypes.STRING },
  name: { type: DataTypes.STRING },
  wallet: { type: DataTypes.INTEGER },
  sale: { type: DataTypes.INTEGER },
  month_payment: { type: DataTypes.INTEGER },
  count_students: { type: DataTypes.STRING, defaultValue: "0" },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const Teachers = sequelize.define("teachers", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  firstname: { type: DataTypes.STRING },
  lastname: { type: DataTypes.STRING },
  fathername: { type: DataTypes.STRING },
  wallet: { type: DataTypes.INTEGER },
  gender: { type: DataTypes.STRING },
  birthday: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const Sciences = sequelize.define("sciences", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const Payments = sequelize.define("payments", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  group_student_id: {
    type: DataTypes.STRING,
  },
  amount: { type: DataTypes.INTEGER },
  teacher_sum: { type: DataTypes.INTEGER },
  sale: { type: DataTypes.INTEGER },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  debtors_id: { type: DataTypes.JSON },
  debtors_active: { type: DataTypes.INTEGER, defaultValue: 0 },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const Debtors = sequelize.define("debtors", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.STRING,
  },
  group_id: {
    type: DataTypes.STRING,
  },
  amount: { type: DataTypes.INTEGER },
  all_summa: { type: DataTypes.INTEGER },
  month: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const GroupStudents = sequelize.define("group_students", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  wallet: { type: DataTypes.INTEGER, defaultValue: 0 },
  student_id: {
    type: DataTypes.STRING,
  },
  group_id: {
    type: DataTypes.STRING,
  },
  month_payment: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const TeacherGroups = sequelize.define("teacher_groups", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  teacher_id: {
    type: DataTypes.STRING,
  },
  group_id: {
    type: DataTypes.STRING,
  },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const Messages = sequelize.define("messages", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  student_id: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING
  },
  group_id: {
    type: DataTypes.STRING,
  },
  message: {
    type: DataTypes.STRING,
  },
  time: {
    type: DataTypes.STRING,
  },
  createdAt: { type: DataTypes.DATE },
});
const Monthly = sequelize.define("monthlies", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  teacher_id: {
    type: DataTypes.STRING,
  },
  payment: { type: DataTypes.INTEGER },
  month: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const StudentPending = sequelize.define('studentPending', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  firstname: { type: DataTypes.STRING },
  gender: { type: DataTypes.STRING },
  birthday: { type: DataTypes.STRING },
  lastname: { type: DataTypes.STRING },
  fathername: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING },
  fatherPhone: { type: DataTypes.STRING },
  group_id: { type: DataTypes.STRING },
  motherPhone: { type: DataTypes.STRING },
  class: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const PendingGroups = sequelize.define("pendingGroups", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING },
  students: { type: DataTypes.JSON },
  count_students: { type: DataTypes.STRING, defaultValue: "0" },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const DTMColumns = sequelize.define("dtmcolumns", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING },
  items: { type: DataTypes.JSON },
  order: { type: DataTypes.INTEGER },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const Blacklist = sequelize.define('blacklists', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING },
  marks: { type: DataTypes.INTEGER },
  student_id: { type: DataTypes.JSON },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const SmsToken = sequelize.define('SmsToken', {
  token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expirationDate: {
    field: 'expiration_date',
    type: DataTypes.DATE,
    allowNull: true,
  },
});
const Rooms = sequelize.define('rooms', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  count_students: { type: DataTypes.INTEGER, defaultValue: 0 },
  name: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const LessonGroup = sequelize.define('lesson_group', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  group_id: { type: DataTypes.STRING },
  lesson_time: { type: DataTypes.STRING },
  lesson_day: { type: DataTypes.STRING },
  teacher_id: { type: DataTypes.STRING },
  room_id: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const Exams = sequelize.define('exams', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING },
  date: { type: DataTypes.STRING },
  summa_self: { type: DataTypes.INTEGER },
  summa_other: { type: DataTypes.INTEGER },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const ExamsTimes = sequelize.define('exams_times', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  exam_id: { type: DataTypes.STRING },
  time_1: { type: DataTypes.STRING },
  time_2: { type: DataTypes.STRING },
  time_3: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const StudentOther = sequelize.define("student_others", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  firstname: { type: DataTypes.STRING },
  lastname: { type: DataTypes.STRING },
  fathername: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  class: { type: DataTypes.STRING },
  science: { type: DataTypes.JSON },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },

});
const ExamStudents = sequelize.define("exam_students", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  student_id: { type: DataTypes.STRING },
  student_other_id: { type: DataTypes.STRING },
  exam_id: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const ExamStudentPoint = sequelize.define("exam_student_points", {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  exam_student_id: { type: DataTypes.STRING },
  exam_id: { type: DataTypes.STRING },
  block_1: { type: DataTypes.STRING },
  block_2: { type: DataTypes.STRING },
  block_3: { type: DataTypes.STRING },
  block_4: { type: DataTypes.STRING },
  block_5: { type: DataTypes.STRING },
  student_exam_id: { type: DataTypes.INTEGER, },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const GroupSchedule = sequelize.define('group_schedule', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  group_id: { type: DataTypes.STRING },
  lesson_time: { type: DataTypes.STRING },
  day_of_week: { type: DataTypes.INTEGER },
  teacher_id: { type: DataTypes.STRING },
  room_id: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE },
});
const TeacherStatistics = sequelize.define('teacher_statistics', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  group_id: { type: DataTypes.STRING },
  student_id: { type: DataTypes.STRING },
  student_status: { type: DataTypes.STRING },
  teacher_id: { type: DataTypes.STRING },
  student_count: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
});
const TeacherWedms = sequelize.define('teacher_wedms', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false,
    primaryKey: true,
  },
  group_id: { type: DataTypes.STRING },
  teacher_id: { type: DataTypes.STRING },
  amount: { type: DataTypes.STRING, defaultValue: 0 },
  teacher_sum: { type: DataTypes.STRING, defaultValue: 0 },
  center_sum: { type: DataTypes.STRING, defaultValue: 0 },
  sale_sum: { type: DataTypes.STRING, defaultValue: 0 },
  payment_id: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: "active" },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' },
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
});

// const Columns = sequelize.define("columns", {
//   id: {
//     type: Sequelize.UUID,
//     defaultValue: Sequelize.UUIDV4,
//     allowNull: false,
//     primaryKey: true,
//   },
//   name:{type:DataTypes.STRING},
//   items:{type:DataTypes.JSON},
//   order:{type:DataTypes.INTEGER},
//   status: { type: DataTypes.STRING, defaultValue: "active" },
//   updatedAt: { type: DataTypes.DATE },
//   createdAt: { type: DataTypes.DATE },
// });



module.exports = {
  User,
  Students,
  Groups,
  Teachers,
  Sciences,
  Payments,
  Debtors,
  GroupStudents,
  TeacherGroups,
  Messages,
  Monthly,
  PendingGroups,
  StudentPending,
  DTMColumns,
  Blacklist,
  SmsToken,
  Rooms,
  LessonGroup,
  GroupSchedule,
  Exams,
  StudentOther,
  ExamStudents,
  ExamStudentPoint,
  TeacherStatistics,
  FreezeUsers,
  TeacherWedms,
  ExamsTimes
};
