import { formatInTimeZone as formatTZ } from "date-fns-tz";

const TIMEZONE = "America/New_York";

export function getFormattedPadDateStr(dateStr?: string) {
    let date = new Date();

    if (dateStr) {
        date = new Date(Date.parse(dateStr));
    }

    // let year = date.getUTCFullYear();
    // let month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    // let day = date.getUTCDate().toString().padStart(2, '0');

    const localeUSDateStr = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const dateStrWithoutTime = localeUSDateStr.split(",")[0].split("/");

    const year = dateStrWithoutTime[2];
    const month = dateStrWithoutTime[0].toString().padStart(2, "0");
    const day = dateStrWithoutTime[1].toString().padStart(2, "0");

    return `${month}/${day}/${year}`;
}

export function getFormattedDateStr(dateStr?: string) {
    let date = new Date();

    if (dateStr) {
        date = new Date(Date.parse(dateStr));
    }

    // let year = date.getUTCFullYear();
    // let month = (date.getUTCMonth() + 1).toString();
    // let day = date.getUTCDate().toString();

    const localeUSDateStr = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const dateStrWithoutTime = localeUSDateStr.split(",")[0].split("/");

    const year = dateStrWithoutTime[2];
    const month = dateStrWithoutTime[0];
    const day = dateStrWithoutTime[1];

    return `${month}/${day}/${year}`;
}

export function getStrFromDate(value: Date) {
    const date = new Date(value);

    // let year = date.getUTCFullYear();
    // let month = (date.getUTCMonth() + 1).toString();
    // let day = date.getUTCDate().toString();

    const localeUSDateStr = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    const dateStrWithoutTime = localeUSDateStr.split(",")[0].split("/");

    const year = dateStrWithoutTime[2];
    const month = dateStrWithoutTime[0];
    const day = dateStrWithoutTime[1];

    return `${month}/${day}/${year}`;
}

export function getStrFromDateWithoutUTC(value: Date) {
    const date = new Date(value);

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString();
    const day = date.getDate().toString();

    return `${month}/${day}/${year}`;
}

export function getStrFromDateWithTimezone(value: Date) {
    const date = new Date(value);

    return formatTZ(date, TIMEZONE, "MM/dd/yyyy");
}

export function getFormattedDateStrWithTimezone(dateStr?: string) {
    let date = new Date();

    if (dateStr) {
        date = new Date(Date.parse(dateStr));
    }

    return formatTZ(date, TIMEZONE, "MMddyyyy_HHmmss");
}

export function getFormattedDatePadStrWithTimezone(date: Date) {
    return formatTZ(date, TIMEZONE, "MM/dd/yyyy");
}

export function getInvoiceFormattedDateStr(dateStr: string) {
    const invoiceDate = new Date(Date.parse(dateStr));
    const current = new Date();

    const year = invoiceDate.getUTCFullYear();
    const month = (invoiceDate.getUTCMonth() + 1).toString().padStart(2, "0");
    const day = invoiceDate.getUTCDate().toString().padStart(2, "0");

    const createdTime = formatTZ(current, TIMEZONE, "MMddyyyy-HHmmss");

    return `${month}${day}${year}_[${createdTime}]`;
}

export function getInvoiceDateStrWithTimezone(dateStr?: string) {
    let date = new Date();

    if (dateStr) {
        date = new Date(Date.parse(dateStr));
    }

    return formatTZ(date, TIMEZONE, "M/dd/yyyy");
}

export function getFormattedWeekDay(dateStr?: string) {
    let date = new Date();

    if (dateStr) {
        date = new Date(Date.parse(dateStr));
    }

    return date.getDay();

    // const weekDayStr = formatTZ(date, 'EEEE', {timeZone: timezone});
    // return getWeekNumber(weekDayStr);
}
