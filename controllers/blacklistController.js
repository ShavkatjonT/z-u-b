const ApiError = require("../error/ApiError");
const {
  Students,
  Blacklist
} = require("../models/models");
const validateFun = require("./validateFun");
class BlacklistController {
  async blacklistAdd(req, res, next) {
    try {

      const { name, marks } = req.body;

      if (!name) {
        return next(
          ApiError.badRequest('The data is incomplete')
        )
      }

      if (!marks) {
        return next(
          ApiError.badRequest('The data is incomplete')
        );
      }
      const blacklist = await Blacklist.create({
        name,
        marks
      });

      const blacklistAll = await Blacklist.findAll({
        where: {
          status: 'active'
        }
      });


      let blacklistAllMarks = 0
      if (blacklistAll) {
        blacklistAll.forEach((e) => {
          blacklistAllMarks = blacklistAllMarks + e.marks
        })
      }
      const blacklistAllChekend = blacklistAll && blacklistAll.filter((e) => e.student_id && e.student_id.length > 0 && e).map((e) => e.student_id);
      for (const blacklistOne of blacklistAllChekend) {
        for (const id of blacklistOne) {
          const studentOne = await Students.findOne({
            where: {
              status: 'active',
              id
            }
          });
          let blacklistCheked = []
          studentOne && studentOne.blacklist_id && studentOne.blacklist_id.forEach((el) => {
            const blacklistOenCheked = blacklistAll.find((e) => e.id == el);
            blacklistOenCheked && blacklistCheked.push(blacklistOenCheked);
          });
          let blacklistAllChekedMarks = 0;
          blacklistCheked && studentOne && blacklistCheked.length > 0 && blacklistCheked.forEach((el) => {
            blacklistAllChekedMarks = blacklistAllChekedMarks + el.marks
          });
          const marksInactive = (blacklistAllMarks) - blacklistAllChekedMarks;
          const activePercent = (100 * marksInactive) / (blacklistAllMarks);
          const rating = (10 * activePercent) / 100;
          let roundedNum = Number(rating.toFixed(1));
          if (studentOne) studentOne.rating = roundedNum;
          studentOne && await studentOne.save();
        }

      }




      res.json(blacklist);
    } catch (error) {
      console.log(31, error);
      return next(ApiError.badRequest(error));
    }
  }

  async blacklistDelete(req, res, next) {
    try {
      const { id } = req.body;
      if (!id) {
        return next(
          ApiError.badRequest("id not found")
        )
      }
      const blacklist = await Blacklist.findOne({
        where: {
          status: 'active',
          id
        }
      });
      const blacklistAll = await Blacklist.findAll({
        where: {
          status: 'active',
        }
      });
      if (!blacklist) {
        return next(
          ApiError.badRequest("blacklist not found")
        )
      }
      let blacklistAllMarks = 0
      if (blacklistAll) {
        blacklistAll.forEach((e) => {
          blacklistAllMarks = blacklistAllMarks + e.marks
        })
      }
      if (blacklist.student_id && blacklist.student_id.length > 0) {
        for (const student_id of blacklist.student_id) {
          const student = await Students.findOne({
            where: {
              status: 'active',
              id: student_id
            }
          });
          let blacklistChekend = [];
          if (student && student.blacklist_id && student.blacklist_id.length > 0) {
            for (const id of student.blacklist_id) {
              const blacklistOne = await Blacklist.findOne({
                where: {
                  status: 'active',
                  id
                }
              });
              blacklistOne && blacklistChekend.push({
                id: blacklistOne.id,
                marks: blacklistOne.marks
              });
            }
          };
          let blacklistChekendMarks = 0
          if (blacklistChekend && blacklistChekend.length > 0) {
            blacklistChekend.forEach((e) => {
              blacklistChekendMarks = blacklistChekendMarks + e.marks
            })
          }
          const blacklist_idList = student && [...student.blacklist_id].filter((e) => e != blacklist.id)
          const marksInactive = (blacklistAllMarks - blacklist.marks) - (blacklistChekendMarks - blacklist.marks);
          const activePercent = (100 * marksInactive) / (blacklistAllMarks - blacklist.marks);
          const rating = (10 * activePercent) / 100;
          let roundedNum = Number(rating.toFixed(1));
         if(student) student.rating = roundedNum;
         if(student) student.blacklist_id = [...[], []]
         if(student) await student.save();
         if(student) student.blacklist_id = blacklist_idList
         if(student) await student.save();
        }
      } else {
        const blacklistAllChekend = blacklistAll && blacklistAll.filter((e) => e.student_id && e.student_id.length > 0 && e).map((e) => e.student_id);
        for (const blacklistOne of blacklistAllChekend) {
          for (const id of blacklistOne) {
            const studentOne = await Students.findOne({
              where: {
                status: 'active',
                id
              }
            });
            let blacklistCheked = []
            studentOne && studentOne.blacklist_id && studentOne.blacklist_id.forEach((el) => {
              const blacklistOenCheked = blacklistAll.find((e) => e.id == el);
              blacklistOenCheked && blacklistCheked.push(blacklistOenCheked);
            });
            let blacklistAllChekedMarks = 0;
            blacklistCheked && studentOne && blacklistCheked.length > 0 && blacklistCheked.forEach((el) => {
              blacklistAllChekedMarks = blacklistAllChekedMarks + el.marks
            });
            const marksInactive = (blacklistAllMarks - blacklist.marks) - blacklistAllChekedMarks;
            const activePercent = (100 * marksInactive) / (blacklistAllMarks - blacklist.marks);
            const rating = (10 * activePercent) / 100;
            let roundedNum = Number(rating.toFixed(1));
            if (studentOne) studentOne.rating = roundedNum;
            studentOne && await studentOne.save();
          }
        }
      }
      blacklist.status = 'inactive';
      await blacklist.save();
      return res.json({ blacklist });
    } catch (error) {
      console.log(41, error);
      return next(ApiError.badRequest(error));
    }
  }

  async blacklistPut(req, res, next) {
    try {
      const { id, name, marks } = req.body;
      if (!id) {
        return next(
          ApiError.badRequest("Id not found")
        )
      }
      const blacklist = await Blacklist.findOne({
        where: {
          status: 'active',
          id
        }
      });
      if (!blacklist) {
        return next(
          ApiError.badRequest('no data found')
        )
      }
      if (name) blacklist.name = name;
      if (marks && marks != blacklist.marks) {
        if (blacklist.student_id && blacklist.student_id.length > 0) {
          const blacklistAll = await Blacklist.findAll({
            where: {
              status: 'active'
            }
          })
          let blacklistAllMarks = 0
          if (blacklistAll) {
            blacklistAll.forEach((e) => {
              blacklistAllMarks = blacklistAllMarks + e.marks
            })
          }
          for (const student_id of blacklist.student_id) {
            const student = await Students.findOne({
              where: {
                status: 'active',
                id: student_id
              }
            });
            let blacklistChekend = [];
            if (student.blacklist_id && student.blacklist_id.length > 0) {
              for (const id of student.blacklist_id) {
                const blacklistOne = await Blacklist.findOne({
                  where: {
                    status: 'active',
                    id
                  }
                });
                blacklistOne && blacklistChekend.push({
                  id: blacklistOne.id,
                  marks: blacklistOne.marks
                });
              }
            };
            let blacklistChekendMarks = 0
            if (blacklistChekend && blacklistChekend.length > 0) {
              blacklistChekend.forEach((e) => {
                blacklistChekendMarks = blacklistChekendMarks + e.marks
              })
            }
            const marksInactive = (blacklistAllMarks - blacklist.marks + marks) - (blacklistChekendMarks - blacklist.marks + marks);
            const activePercent = (100 * marksInactive) / (blacklistAllMarks - blacklist.marks + marks);
            const rating = (10 * activePercent) / 100;
            let roundedNum = Number(rating.toFixed(1));
            student.rating = roundedNum;
            await student.save();
          }
        } else {
          const blacklistAll = await Blacklist.findAll({
            where: {
              status: 'active'
            }
          })
          let blacklistAllMarks = 0
          if (blacklistAll) {
            blacklistAll.forEach((e) => {
              blacklistAllMarks = blacklistAllMarks + e.marks
            })
          }
          const blacklistAllChekend = blacklistAll && blacklistAll.filter((e) => e.student_id && e.student_id.length > 0 && e).map((e) => e.student_id);
          for (const blacklistOne of blacklistAllChekend) {
            for (const id of blacklistOne) {
              const studentOne = await Students.findOne({
                where: {
                  status: 'active',
                  id
                }
              });
              let blacklistCheked = []
              studentOne && studentOne.blacklist_id && studentOne.blacklist_id.forEach((el) => {
                const blacklistOenCheked = blacklistAll.find((e) => e.id == el);
                blacklistOenCheked && blacklistCheked.push(blacklistOenCheked);
              });
              let blacklistAllChekedMarks = 0;
              blacklistCheked && studentOne && blacklistCheked.length > 0 && blacklistCheked.forEach((el) => {
                blacklistAllChekedMarks = blacklistAllChekedMarks + el.marks
              });
              const marksInactive = (blacklistAllMarks - blacklist.marks + marks) - blacklistAllChekedMarks;
              const activePercent = (100 * marksInactive) / (blacklistAllMarks - blacklist.marks + marks);
              const rating = (10 * activePercent) / 100;
              let roundedNum = Number(rating.toFixed(1));
              if (studentOne) studentOne.rating = roundedNum;
              studentOne && await studentOne.save();
            }

          }


        }

      }

      if (marks) blacklist.marks = marks;
      await blacklist.save();
      return res.json({ blacklist })
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }

  async blacklistGet(req, res, next) {
    try {
      const blacklist = await Blacklist.findAll({
        where: {
          status: 'active'
        }
      });
      const data = blacklist && blacklist.sort((a, b) => a.name.localeCompare(b.name));
      return res.json(data);
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }

  async blacklistCheked(req, res, next) {
    try {
      const { sendCheck, student_id, in_chekend } = req.body;
      const student = await Students.findOne({
        where: {
          status: 'active',
          id: student_id
        }
      });

      const blacklist = await Blacklist.findAll({
        where: {
          status: 'active'
        }
      });

      let blacklistCheked = []
      if (sendCheck) {
        for (const id of sendCheck) {
          const blacklistOne = await Blacklist.findOne({
            where: {
              status: 'active',
              id
            }
          });
          const blacklistData = blacklistOne && {
            id,
            marks: blacklistOne.marks,
          }
          blacklistOne && blacklistCheked.push(blacklistData);
          if (blacklistOne && blacklistOne.student_id && !blacklistOne.student_id.includes(student_id)) {
            blacklistOne.student_id = [...blacklistOne.student_id, student_id]
          } else if (!blacklistOne.student_id) {
            blacklistOne.student_id = [...[], student_id]
          }
          blacklistOne && await blacklistOne.save();
        }
      }
      let blacklistInChekend = []
      if (blacklistCheked && blacklist.length != blacklistCheked) {
        blacklist.forEach((el) => {
          const data = blacklistCheked.find((e) => e.id == el.id);
          if (!data) {
            blacklistInChekend.push(el.id)
          }
        })
      };

      if (blacklistInChekend && blacklistInChekend.length > 0) {
        for (const id of blacklistInChekend) {
          const blacklistOen = await Blacklist.findOne({
            where: {
              status: 'active',
              id
            }
          });

          if (blacklistOen && blacklistOen.student_id) {
            const studentIdList = [...blacklistOen.student_id]
            const studentFilter = studentIdList && studentIdList.filter((e) => e != student_id);
            blacklistOen.student_id = [...[], []]
            await blacklistOen.save();
            blacklistOen.student_id = studentFilter;
            await blacklistOen.save();
          }
        }
      }

      let blacklistChekedMarks = 0
      if (blacklistCheked && blacklistCheked.length > 0) {
        blacklistCheked.forEach((e) => {
          blacklistChekedMarks = blacklistChekedMarks + e.marks
        })
      }
      let blacklistInChekedMarks = 0
      if (blacklist) {
        blacklist.forEach((e) => {
          blacklistInChekedMarks = blacklistInChekedMarks + e.marks
        });
      }
      const marksInactive = blacklistInChekedMarks - blacklistChekedMarks;
      const activePercent = (100 * marksInactive) / blacklistInChekedMarks;
      const rating = (10 * activePercent) / 100;
      let roundedNum = Number(rating.toFixed(1));
      student.rating = roundedNum;
      student.blacklist_id = [...[], []]
      await student.save();
      student.blacklist_id = sendCheck;
      await student.save();
      return res.json(student)
    } catch (error) {
      console.log(91, error);
      return next(ApiError.badRequest(error));
    }
  }

  async blacklistStudentGet(req, res, next) {
    try {
      const student = await Students.findAll({
        where: {
          status: 'active',

        }
      });
      const studentFilter = student && student.filter((e) => Number(e.rating) < 5)
      return res.json(studentFilter);
    } catch (error) {
      return next(ApiError.badRequest(error));
    }
  }


}

module.exports = new BlacklistController();
