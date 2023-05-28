

module.exports.getFormattedDate = async(bookingDate) => {
    const date = new Date(bookingDate);
    const formattedDate =date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    return formattedDate
}