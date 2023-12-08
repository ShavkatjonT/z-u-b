class Validate {
    isValidUUID(value) {
      // uuid ni tekshiradigon validate
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(value);
    }
    isToday(dateString) {
      // ushbu qiymat sana va aynab shu kunga tengligini isbotlovchi validate
  
      // Parse the input as a Date object
      const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
      const date = new Date(dateString);
      const match = dateString.match(regex);
      // Get the current date
      const today = new Date();
  
      // Check if the parsed date is valid, and if it's equal to the current date
      if (
        match &&
        !isNaN(date.getTime()) &&
        date.toDateString() == today.toDateString()
      ) {
        return true;
      } else {
        return false;
      }
    }
    isToday_2(dateString) {
      // Regular expression to match "yyyy-mm-dd" format
      const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  
      // Check if the input matches the regular expression
      const match = dateString.match(regex);
      const date = new Date(dateString);
      if (match && !isNaN(date.getTime())) {
        // Extract year, month, and day from the matched groups
        const year = match[1];
        const month = match[2];
        const day = match[3];
  
        // Fill in default values for missing parts (year, month, day)
        const today = new Date();
        const formattedDate = [
          year || today.getFullYear(),
          month || String(today.getMonth() + 1).padStart(2, "0"),
          day || String(today.getDate()).padStart(2, "0"),
        ].join("-");
  
        return true;
      } else {
        return false;
      }
    }
    toCompare(startDate, endDate) {
      return new Date(startDate) <= new Date(endDate);
  }
    isLocatonTime() {
      const options = { timeZone: "Asia/Tashkent" }; // 'Asia/Tashkent' is the time zone for Uzbekistan
      const date = new Date().toLocaleString("uz-UZ", options); /// 20/09/2023, 16:43:40
      const [day, time] = date.split(",");
      const newDate =
        day.split("/")[2] + "-" + day.split("/")[1] + "-" + day.split("/")[0]+ time;
      return newDate;
    }
    isLocatonTime_2() {
      const options = { timeZone: "Asia/Tashkent" }; // 'Asia/Tashkent' is the time zone for Uzbekistan
      const date = new Date().toLocaleString("uz-UZ", options); /// 20/09/2023, 16:43:40
      return date;
    }
    validateDates(start_date, end_date) {
      // Convert the date strings to Date objects
      let startDateObj = new Date(start_date);
      let endDateObj = new Date(end_date);
  
      // Check if start_date is less than or equal to end_date
      return startDateObj <= endDateObj;
    }
    containsSQLCode(text) {
      // Define regular expressions for common SQL code patterns
      const sqlPatterns = [
        /SELECT .*? FROM/i,
        /INSERT INTO .*? VALUES/i,
        /UPDATE .*? SET/i,
        /DELETE FROM .*? WHERE/i,
        /CREATE TABLE .*? \(/i,
        /ALTER TABLE .*? ADD/i,
        /DROP TABLE .*?/i,
        /CREATE DATABASE .*?/i,
        /USE DATABASE .*?/i,
        /--.*?$/m, // SQL comments
        /\/\*[\s\S]*?\*\//, // SQL multiline comments
      ];
    
      // Iterate through each pattern and check if it exists in the text
      for (const pattern of sqlPatterns) {
        if (pattern.test(text)) {
          return true; // Found SQL code
        }
      }
    
      return false; // No SQL code found
    }
    validateMonth(dateString) {
      // Appending a day to the provided month-year string (e.g., assuming the 1st day of the month)
      const fullDateString = dateString + '-01';
      const dateObj = new Date(fullDateString);
    
      // Check if the date object is valid
      if (Object.prototype.toString.call(dateObj) === "[object Date]" && !isNaN(dateObj)) {
        return true;
      } else {
        return false;
      }
    }
  }
  
  module.exports = new Validate();
  