function isLessonAvailable(lesson1, lesson2) {
    const [start1, end1] = lesson1.split('-').map(time => new Date(`2000-01-01T${time}:00`));
    const [start2, end2] = lesson2.split('-').map(time => new Date(`2000-01-01T${time}:00`));   
    return end1 <= start2 || end2 <= start1;
}
module.exports = isLessonAvailable
