const validateFun = require("./validateFun");
class CountWeekdays {
    countWeekdaysInMonth(month, year, weekdays) {
        const daysInMonth = new Date(year, month, 0).getDate();
        let count = 0;
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month - 1, i).getDay();
            const week = date == 0 ? 7 : date;
            if (weekdays.includes(week)) {
                count++;
            }
        }
        return count;
    }
    countWeekdaysInRange(startDay, endDay, weekdays) {
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        const daysInMonth = new Date(year, month, 0).getDate();
        let count = 0;
        for (let i = startDay; i <= endDay; i++) {
            if (i > 0 && i <= daysInMonth) {
                const date = new Date(year, month - 1, i);
                if (weekdays.includes(date.getDay() + 1)) {
                    count++;
                }
            }
        }
        return count;
    }

    validateWeekData(weekData) {
        for (let item of weekData) {
            // Check that the required properties are present
            if (!item.room_id || !item.week_day || !item.time) {
                return true
            }
            // Check that the values of the properties are of the expected type
            if (typeof item.room_id !== 'string' || typeof item.week_day !== 'number' || typeof item.time !== 'string') {
                return true
            }
        }
        return false
    }

    validateArray(arr) {
        for (let i = 0; i < arr.length; i++) {
            const num = arr[i];
            if (typeof num !== "number" || num < 1 || num > 7) {
                return false;
            }
        }
        return true;
    }

    getWeekdayOccurrences(startDate, endDate, weekDay) {
        const occurrences = [];

        const currentDate = new Date(startDate);
        const currentEndDate = new Date(endDate);

        while (currentDate <= currentEndDate) {
            if (weekDay.includes(currentDate.getDay())) {
                const occurrence = {
                    day: currentDate.getDate(),
                    month: currentDate.getMonth() + 1, // Adding 1 because months are 0-based
                    year: currentDate.getFullYear(),
                };
                occurrences.push(occurrence);
            }

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return occurrences;
    }

    calculateAttendanceStartTime(time1, time2) {
        // Split the lesson time range into start and end times
        const [lessonStartTime, lessonEndTime] = time1.split("-");

        // Parse the start and end times into Date objects
        const lessonStart = new Date(`2023-09-23T${lessonStartTime}`);
        const lessonEnd = new Date(`2023-09-23T${lessonEndTime}`);

        // Parse the freezing time into a Date object
        const freezingTime = new Date(`2023-09-23T${time2}`);

        // Check if the student was present at any time during the lesson
        if (freezingTime >= lessonStart && freezingTime < lessonEnd) {
            return 'falsevalue'; // Student attended any part of the lesson
        } else if (freezingTime < lessonStart) {
            return 'falsevalue'; // Student left before the lesson started
        } else if (freezingTime >= lessonEnd) {
            return 'truevalue'; // Student left before the lesson completed
        }
    }

    calculateAttendanceEndTime(time1, time2) {
        // Split the lesson time range into start and end times
        const [lessonStartTime, lessonEndTime] = time1.split("-");


        // Parse the start and end times into Date objects
        const lessonStart = new Date(`2023-09-23T${lessonStartTime}`);

        // Parse the freezing time into a Date object
        const freezingTime = new Date(`2023-09-23T${time2}`);
        // Check if the student was present at any time during the lesson
        if (lessonStart >= freezingTime) {
            return 'truevalue'; // Student attended any part of the lesson
        } else if (lessonStart < freezingTime) {
            return 'falsevalue'; // Student left before the lesson started
        }
    }

    countWeekdaysInRangeNew({
        start_date,
        end_date,
        start_time_1,
        end_time_1,
        start_time_2,
        end_time_2,
        week_day,
    }) {
        /*
        --------------------------------------------------------------------------------------------------
                   This function shows how many days the student has attended classes
        --------------------------------------------------------------------------------------------------
        */
        console.log(135, week_day);
        const startDate = new Date(start_date);
        console.log(136, startDate);
        const endDate = new Date(end_date);
        console.log(137, endDate);

        let current_time = 0;

        const start_time =
            start_time_2 ?
                this.calculateAttendanceStartTime(start_time_2, start_time_1) : false;
        const end_time =
            end_time_2 ?
                this.calculateAttendanceEndTime(end_time_2, end_time_1) : false;

        console.log(218, start_time);
        // Add 0 or subtract 1 from current_time based on time conditions
        if (start_time_2 && start_time && start_time == 'truevalue') {
            current_time += 0;
        } else if (start_time_2 && start_time && start_time == 'falsevalue') {
            current_time -= 1;
        }
        console.log(219, end_time);

        if (end_time_2 && end_time && end_time == 'truevalue') {
            current_time += 0;
        } else if (end_time_2 && end_time && end_time == 'falsevalue') {
            current_time -= 1;
        }

        // Convert week_day integers to lowercase day names
        const dayNames = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ];
        const selectedDays = week_day.map((day) => dayNames[day - 1]);
        console.log(175, selectedDays);
        // Calculate the number of occurrences of selectedDays within the date range
        let count = 0;
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const currentDayName = currentDate
                .toLocaleString("en-US", { weekday: "long" })
                .toLowerCase();
            if (selectedDays.includes(currentDayName)) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Add or subtract current_time from the count
        console.log(198, count);
        console.log(199, current_time);
        count += current_time;

        return count;
    }
    countWeekdaysInRangeNew_2({
        start_date,
        end_date,
        start_time_1,
        end_time_1,
        start_time_2,
        end_time_2,
        week_day,
    }) {
        /*
        --------------------------------------------------------------------------------------------------
                This function shows how many classes the student has missed
        --------------------------------------------------------------------------------------------------
        */

        const startDate = new Date(start_date);
        const endDate = new Date(end_date);

        // Initialize current_time
        let current_time = 0;
        const start_time =
            start_time_2 ?
                this.calculateAttendanceStartTime(start_time_2, start_time_1) : false;
        const end_time =
            end_time_2 ?
                this.calculateAttendanceEndTime(end_time_2, end_time_1) : false;
        // Add 0 or subtract 1 from current_time based on time conditions
        if (start_time_2 && start_time && start_time == 'truevalue') {
            current_time -= 1;
        } else if (start_time_2 && start_time && start_time == 'falsevalue') {
            current_time += 0;
        }

        if (end_time_2 && end_time && end_time == 'truevalue') {
            current_time -= 1;
        } else if (end_time_2 && end_date && end_time == 'falsevalue') {
            current_time += 0;
        }

        // Convert week_day integers to lowercase day names
        const dayNames = [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
        ];
        const selectedDays = week_day.map((day) => dayNames[day - 1]);

        // Calculate the number of occurrences of selectedDays within the date range
        let count = 0;
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const currentDayName = currentDate
                .toLocaleString("en-US", { weekday: "long" })
                .toLowerCase();
            if (selectedDays.includes(currentDayName)) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Add or subtract current_time from the count
        count += current_time;

        return count;
    }

    getLastDateOfMonth(date) {
        // Copy the input date to avoid modifying the original date
        const lastDate = new Date(date);

        // Set the date to the next month's first day
        lastDate.setMonth(lastDate.getMonth() + 1, 1);

        // Subtract one day to get the last day of the current month
        lastDate.setDate(lastDate.getDate() - 1);

        return lastDate;
    }



}

module.exports = new CountWeekdays();