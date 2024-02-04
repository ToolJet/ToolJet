export const valueinTimeStamp = (timestamp) => {
  // Create a new Date object using the timestamp (in milliseconds)
  const date = new Date(timestamp);

  // Format the date as a string
  // const formattedDate = date.toLocaleString(); // You can customize the format using options

  console.log('formattedDate', date);
  return date;
};

// export const setTimeFunction = (newTimeString) => {
//   // Parse the date string
//   const dateObject = new Date(date);

//   // Parse the new time string
//   const newTimeArray = newTimeString.split(':');
//   const newHours = parseInt(newTimeArray[0], 10);
//   const newMinutes = parseInt(newTimeArray[1], 10);
//   const newSeconds = parseInt(newTimeArray[2], 10);

//   // Update the time components of the existing Date object
//   dateObject.setHours(newHours);
//   dateObject.setMinutes(newMinutes);
//   dateObject.setSeconds(newSeconds);

//   setDate(dateObject);
// };
