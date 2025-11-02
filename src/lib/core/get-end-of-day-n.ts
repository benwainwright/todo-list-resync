import { DateTime } from "luxon";

export const getEndOfDayN = (offset: number) => {
  return DateTime.now().endOf("day").plus({
    days: offset,
  });
};
