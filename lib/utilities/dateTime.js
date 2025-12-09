import moment from "../localizedMoment.js";

/**
 * vrací boolean: pokud je time před dateTime
 * @param time
 * @param dateTime
 * @returns {boolean}
 */
export const isTimeBeforeDateTime = (time, dateTime) => {
  const mTime = moment(dateTime.format("HH:mm:ss"), "HH:mm:ss");
  const targetTime = moment(time, "HH:mm:ss");

  return targetTime.isBefore(mTime);
};

/**
 * vrací boolean: pokud je time po dateTime - to samé jako isTimeBeforeDateTime() arokrát naopak
 * je to zde kvůli lepší přehlenosti
 * @param time
 * @param dateTime
 * @returns {boolean}
 */
export const isTimeAfterDateTime = (time, dateTime) => {
  const mTime = moment(dateTime.format("HH:mm:ss"), "HH:mm:ss");
  const targetTime = moment(time, "HH:mm:ss");

  return targetTime.isAfter(mTime);
};
