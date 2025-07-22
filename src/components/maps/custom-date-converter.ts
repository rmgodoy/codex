import { CustomDate } from "@/lib/types";
import moment from "moment";

export const getYearOne = () => {
  const DEFAULT_MIN_DATE = new Date(Date.UTC(1, 0, 1));
  DEFAULT_MIN_DATE.setUTCFullYear(1);
  return DEFAULT_MIN_DATE;
};

export const dateToCustomDate = (date: Date | string): CustomDate => {
  let _date;
  if (typeof date == 'string' ) {
    _date = moment(date).utc().startOf('day').toDate();
  } else {
    _date = date;
  }

  return ({
  year: _date.getUTCFullYear(),
  monthIndex: _date.getUTCMonth(),
  day: _date.getUTCDate(),
})};

export const customDateToDate = (customDate: CustomDate | string): Date => {
  let _customDate: CustomDate;
  if (typeof customDate == 'string' ) {
    _customDate = dateToCustomDate(customDate);
  } else {
    _customDate = customDate;
  }
  const date = moment().utc().endOf("day").toDate();
  date.setUTCFullYear(_customDate.year, _customDate.monthIndex, _customDate.day);
  return date;
};