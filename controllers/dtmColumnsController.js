const { Students , DTMColumns, Sciences} = require("../models/models");
const ApiError = require("../error/ApiError");
const validateFun = require("./validateFun");
class ColumsController {
    async columsItemsPut(req, res, next) {
        try {
         const {result, columns} = req.body; 
         const { source, destination } = result;
         const columnsStart = await DTMColumns.findOne({where:{
           id: columns.id,
           status:'active'
         }});
         const student = await Students.findOne({
          where:{
            status:'active',
            dtmcolumns_id: columns.id
          }
         });

         const column = columns;
         const copiedItems = [...column.items];
         const [removed] = copiedItems.splice(source.index, 1);
         copiedItems.splice(destination.index, 0, removed);
         const id = copiedItems.map((e)=> e.id);
         columnsStart.items=[...[], [] ];
         await columnsStart.save()
         student.science = [...[], []];
         await student.save();
         student.science = id;
         columnsStart.items=id;
         await columnsStart.save();
         await student.save();
  
       return res.json(columnsStart);     
    } catch (error) {
      console.log(26, error);
       return next(ApiError.badRequest(error));
    }
    }
}

module.exports = new ColumsController();
