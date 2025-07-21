import { CustomDate } from "@/lib/types";
import moment from "moment";

export const getYearOne = () => {
  const DEFAULT_MIN_DATE = new Date(Date.UTC(1, 0, 1));
  DEFAULT_MIN_DATE.setUTCFullYear(1);
  return DEFAULT_MIN_DATE;
};

export const dateToCustomDate = (date: Date): CustomDate => ({
  year: date.getUTCFullYear(),
  monthIndex: date.getUTCMonth(),
  day: date.getUTCDate(),
});

export const customDateToDate = (customDate: CustomDate): Date => {
  const date = moment().utc().endOf("day").toDate();
  date.setUTCFullYear(customDate.year, customDate.monthIndex, customDate.day);
  return date;
};