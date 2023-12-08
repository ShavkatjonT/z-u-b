// const { Columns, Students } = require("../models/models");
// const ApiError = require("../error/ApiError");
// class ColumsController {
//   async columsAdd(req, res, next) {
//     try {
//       const { name } = req.body;
//       const columsData = await Columns.findAll();
//       const colums = await Columns.create({
//         name,
//         items: [],
//         order: columsData && columsData.length + 1,
//       });
//       return res.json(colums);
//     } catch (error) {
//       return next(ApiError.badRequest(error));
//     }
//   }

//   async columsDelete(req, res, next) {
//     try {
//       const { id } = req.body;

//       const columnsDelete = await Columns.findOne({
//         where: {
//           id,
//           status: "active",
//         },
//       });

//       const columnsDefault = await Columns.findOne({
//         where: {
//           order: 1,
//           status: "active",
//         },
//       });

//       if (columnsDelete.items && columnsDelete.items.length > 0) {
//         columnsDelete.items.forEach(async (el) => {
//           columnsDefault.items = [...columnsDefault.items, el];
//           await columnsDefault.save();
//           return;
//         });
//       }
//       columnsDelete.status = "inactive";
//       await columnsDelete.save();

//       return res.json({ columnsDelete });
//     } catch (error) {
//       return next(ApiError.badRequest(error));
//     }
//   }

//   async columsPut(req, res, next) {
//     try {
//       const { result } = req.body;
//       const columnsStart = await Columns.findOne({
//         where: {
//           id: result.source.droppableId,
//           status: "active",
//         },
//       });
//       const columnsEnd = await Columns.findOne({
//         where: {
//           id: result.destination.droppableId,
//           status: "active",
//         },
//       });
//       let upData = columnsStart.items;
//       upData.splice(upData.indexOf(result.draggableId), 1);
//       columnsStart.items = [...[], []];
//       await columnsStart.save();
//       columnsStart.items = upData;
//       columnsEnd.items = [...columnsEnd.items, result.draggableId];
//       await columnsEnd.save();
//       await columnsStart.save();
//       return res.json(result);
//     } catch (error) {
//       return next(ApiError.badRequest(error));
//     }
//   }

//   async columsGet(req, res, next) {
//     try {
//       const colums = await Columns.findAll({
//         where: {
//           status: "active",
//         },
//       });
//       const items = await Students.findAll({
//         where: {
//           status: "pending",
//         },
//       });
//       const sortData = colums && colums.sort((a, b) => {
//         return a.order - b.order;
//       });

//       let columnsData = {};
//       items && colums.length > 0 && sortData.forEach((el) => {
//         let itemsOne = [];
//         el.items &&  el.items.forEach((e) => {
//           const data = items && items.find((value) => e == value.id);
          
//           itemsOne.push(data);
//           return;
//         });
//         columnsData[el.id] = {
//           order: el.order,
//           name: el.name,
//           id: el.id,
//           items: itemsOne && itemsOne,
//         };
//         return;
//       });
//       let defaultItem = [];
//        colums.length > 0 &&  sortData[0].items.forEach((e) => {
//         const data = items && items.find((value) => e == value.id);
//         defaultItem.push(data);
//       });
//       const defaultData = sortData[0] && {
//         id: sortData[0].id,
//         name: sortData[0].name,
//         items: defaultItem && defaultItem.length > 0 && defaultItem,
//         order: sortData[0].order,
//       };
//       return res.json({ columnsData, defaultData });
//     } catch (error) {
//       console.log(129, error.stack);
//       return next(ApiError.badRequest(error));
//     }
//   }
// }

// module.exports = new ColumsController();
