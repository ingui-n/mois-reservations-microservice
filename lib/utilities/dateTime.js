import moment from "../localizedMoment.js";

export const isTimeBeforeDateTime = (time, dateTime) => {
  const mTime = moment(dateTime.format("HH:mm:ss"), "HH:mm:ss");
  const targetTime = moment(time, "HH:mm:ss");

  return targetTime.isBefore(mTime);
};

export const isTimeAfterDateTime = (time, dateTime) => {
  const mTime = moment(dateTime.format("HH:mm:ss"), "HH:mm:ss");
  const targetTime = moment(time, "HH:mm:ss");

  return targetTime.isAfter(mTime);
};
