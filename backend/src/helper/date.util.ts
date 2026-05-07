import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TZ = 'Asia/Ho_Chi_Minh';

export class DateUtil {
  // 🔥 core: build range by offset (days)
  static lastNDaysUTC(days: number, tz = DEFAULT_TZ) {
    const end = dayjs().tz(tz).endOf('day');
    const start = end.subtract(days - 1, 'day').startOf('day');

    return {
      start: start.utc().toDate(),
      end: end.utc().toDate(),
    };
  }

  // 🔥 core: month offset (0=this, -1=last, -2=2 months ago)
  static monthRangeUTC(offset = 0, tz = DEFAULT_TZ) {
    const base = dayjs().tz(tz).add(offset, 'month');

    return {
      start: base.startOf('month').utc().toDate(),
      end: base.endOf('month').utc().toDate(),
    };
  }

  // 🔥 custom range from FE (string/date)
  static customRangeUTC(
    startInput: string | Date,
    endInput: string | Date,
    tz = DEFAULT_TZ,
  ) {
    return {
      start: dayjs.tz(startInput, tz).startOf('day').utc().toDate(),
      end: dayjs.tz(endInput, tz).endOf('day').utc().toDate(),
    };
  }

  static todayUTC(tz = DEFAULT_TZ) {
    const start = dayjs().tz(tz).startOf('day');
    const end = dayjs().tz(tz).endOf('day');

    return {
      start: start.utc().toDate(),
      end: end.utc().toDate(),
    };
  }
}
