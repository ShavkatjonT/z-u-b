const jwt = require('jsonwebtoken');

module.exports = function (role) {
  return function (req, res, next) {
    if (req.method === 'OPTIONS') {
      next();
    }

    try {
      const token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(403).json({ message: "Ro'yxattan o'tmagan foydalanuvchi!" });
      }

      const decoded = jwt.verify(token, process.env.SECRET_KEY);
      if(decoded.role !== role) {
          return res.status(403).json({ message: "Ruxsat berilmagan" });
      }
      req.user = decoded;
      next();
    } catch (error) {
      res.status(403).json({ message: "Ro'yxattan o'tmagan foydalanuvchi!" });
    }
  };
};
