const ApiError = require("../error/ApiError");
const { Monthly, Teachers } = require("../models/models");
const validateFun = require("./validateFun");
class monthlyController {
  async monthlyDelete(req, res, next) {
    try {
      const { id } = req.body;
      const monthly = await Monthly.findOne({
        where: {
          id,
          status: "active",
        },
      });

      if (!monthly) {
        return next(ApiError.badRequest("no data found"));
      }

      const techer = await Teachers.findOne({
        where: {
          id: monthly.teacher_id,
          status: "active",
        },
      });

      techer.wallet = (techer.wallet ? techer.wallet : 0) + monthly.payment;

      const techerSave = techer.save();
      monthly.status = "inactive";
      const monthlySave = monthly.save();

      res.json({ techerSave, monthlySave });
    } catch (error) {
      return next(ApiError.badRequest(`${error}, monthly delete`));
    }
  }
  async monthlyPut(req, res, next) {
    try {
      const { id, sum, date } = req.body;
      const monthly = await Monthly.findOne({
        where: {
          id,
          status: "active",
        },
      });

      if (!monthly) {
        return next(ApiError.badRequest("no data found"));
      }

      const techer = await Teachers.findOne({
        where: {
          id: monthly.teacher_id,
          status: "active",
        },
      });

      techer.wallet = (techer.wallet ? techer.wallet : 0) + monthly.payment;
      techer.save();

      if (sum) {
        monthly.payment = sum;
      }

      if (date) {
        monthly.month = date;
      }
      techer.wallet = (techer.wallet ? techer.wallet : 0) - sum;
      const techerSave = techer.save();
      const monthlySave = monthly.save();

      res.json({ techerSave, monthlySave  });
    } catch (error) {
      return next(ApiError.badRequest(`${error}, monthly put`));
    }
  }
  async monthlyGet(req, res, next) {
    try {
      const { id } = req.params;
      if (!validateFun.isValidUUID(id)) {
        return next(ApiError.badRequest("The data was entered incorrectly"));
      }
      const date = new Date();

      const monthly = await Monthly.findAll({
        where: { status: "active", teacher_id: id },
      });

      const data =
        monthly &&
        monthly.map((e) => {
          const dataOne = {
            id: e.id,
            month: e.month,
            payment: e.payment,
            deleteActive:
              Math.trunc((date - e.createdAt) / 3600000) <= 24 ? true : false,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          };
          return dataOne;
        });

      const monthlySort =
        data &&
        data.sort(function (a, b) {
          return b.createdAt - a.createdAt;
        });
      res.json(monthlySort);
    } catch (error) {
      return next(ApiError.badRequest(`${error}, monthly get`));
    }
  }
}

module.exports = new monthlyController();
