import { NextRequest, NextResponse } from "next/server";

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// import prisma from "@/lib/db";
import { prisma } from "@/lib/prisma";
import type { Campaign } from "@/generated/prisma";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds
export const dynamic = "force-dynamic";

import { getFormattedDateStr, getFormattedWeekDay, getStrFromDateWithoutUTC } from "@/lib/google-sheet-action.ts/getDateString";

const weekDayList = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type LeadDataSource = Record<string, Array<string | number | null | undefined>>;

type LeadQtyResult = {
    type: "credit" | "lead";
    value: number;
} | null;

type SheetCellValue = {
    value: unknown;
    formattedValue: string | null;
};

type SheetLike = {
    rowCount: number;
    loadCells: () => Promise<void>;
    getCell: (rowIndex: number, colIndex: number) => SheetCellValue;
};

type DateItem = {
    date: string;
    weekDay: string;
};

type RequestPayload = {
    customerId: number;
    date: DateItem[];
    value: LeadDataSource;
    prior?: number | string | null;
};

type AgentWorkingRow = {
    agent: string;
    date: string;
    weekDay: number;
    hours: string | null;
    appt: string | null;
};

type LeadQtyItem = Record<string, string | number>;

type AgentWorkingItem = {
    date: string;
    day: string;
    name: string;
    hours: number;
    appt: number;
    due: number;
};

type AgentLike = {
    name: string;
    sheet?: string | null;
    tab?: string | null;
    status?: boolean;
};

const getLeadQty = (data: LeadDataSource, campaign: Campaign, row: number): LeadQtyResult => {
    if (data[campaign.name] == undefined || !data[campaign.name].length) {
        return null;
    }

    const sheetData = data[campaign.name][row];
    if (sheetData == null || sheetData.toString() == "") {
        return null;
    }

    const dataArray = sheetData.toString().replace(/\+/g, " ").split(" ");
    let result = 0;
    let isCreditFlag = false;

    if (dataArray.length) {
        for (const item of dataArray) {
            const value = item.toString().trim();

            if (value.toLowerCase() === "credits") {
                isCreditFlag = true;
            }

            if (value.indexOf("$") == -1) {
                const parsed = parseInt(value, 10);
                if (!isNaN(parsed)) {
                    if (isCreditFlag) {
                        return {
                            type: "credit",
                            value: parsed,
                        };
                    }
                    result += parsed;
                }
            }
        }
    } else {
        const value = sheetData.toString().trim();
        if (value.indexOf("$") == -1) {
            const parsed = parseInt(value, 10);
            if (!isNaN(parsed)) result = parsed;
        }
    }

    if (isCreditFlag) {
        return {
            type: "credit",
            value: result,
        };
    }

    return {
        type: "lead",
        value: result,
    };
};

const correctMonthSpelling = (dateString: string) => {
    const monthCorrections = {
        Janaury: "January",
        Febuary: "February",
        Marchh: "March",
        Aprl: "April",
        Mayy: "May",
        Juun: "June",
        Jull: "July",
        Augst: "August",
        Agust: "August",
        Septmber: "September",
        Octber: "October",
        Novembr: "November",
        Decembr: "December",
    };

    for (const [wrong, correct] of Object.entries(monthCorrections)) {
        if (dateString.includes(wrong)) {
            dateString = dateString.replace(wrong, correct);
        }
    }

    return dateString;
};

const isDateValid = (dateStr: string) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
};

const parseFloatMax2 = (value: unknown) => {
    const num = parseFloat(value?.toString().trim() ?? "");
    if (isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
};

function convertGoogleSheetDate(serialNumber: number): Date {
    // Google Sheets epoch is December 30, 1899
    const googleSheetEpoch = new Date(1899, 11, 30);

    // Add the serial number as days to the epoch
    const jsDate = new Date(googleSheetEpoch.getTime() + serialNumber * 24 * 60 * 60 * 1000);

    return jsDate;
}

const getAgentWorkingHours = async (customer: { name: string }, agent: AgentLike, sheet: SheetLike | null, dateStrList: string[]) => {
    const result: AgentWorkingRow[] = [];

    if (!sheet) return result;

    await sheet.loadCells();

    for (const dateStr of dateStrList) {
        const formattedDate = getFormattedDateStr(dateStr);
        const weekDay = getFormattedWeekDay(dateStr);

        let startIndex = 1;
        if (agent.name.toLowerCase().includes("rosa")) {
            if (customer.name.toLowerCase().includes("fency")) {
                startIndex = 1;
            } else {
                startIndex = 0;
            }
        }

        let loopIndex = 0;
        if (agent.name.toLowerCase().includes("rosa")) {
            for (let i = sheet.rowCount - 1; i >= 0; i--) {
                const cellValue = sheet.getCell(i, startIndex + 1).value;
                if (!cellValue) continue;

                const serialDate = Number(cellValue);
                if (isNaN(serialDate)) continue;

                const dateVal = convertGoogleSheetDate(serialDate);
                if (!isNaN(dateVal.getTime())) {
                    const formattedSheetDate = getStrFromDateWithoutUTC(dateVal);

                    if (formattedSheetDate === formattedDate) {
                        result.push({
                            agent: agent.name,
                            date: formattedDate,
                            weekDay: weekDay,
                            hours: sheet.getCell(i, startIndex + 3).formattedValue,
                            appt: sheet.getCell(i, startIndex + 4).formattedValue,
                        });

                        break;
                    }
                }

                if (++loopIndex > 100) {
                    break;
                }
            }
        } else if (agent.name.toLowerCase().includes("robert")) {
            for (let i = 0; i < sheet.rowCount; i++) {
                const dateVal = sheet.getCell(i, startIndex + 1).formattedValue;

                if (dateVal && isDateValid(dateVal.toString())) {
                    const correctDateStr = correctMonthSpelling(dateVal);
                    const formattedSheetDate = getFormattedDateStr(correctDateStr);

                    if (formattedSheetDate === formattedDate) {
                        result.push({
                            agent: agent.name,
                            date: formattedDate,
                            weekDay: weekDay,
                            hours: sheet.getCell(i, startIndex + 3).formattedValue,
                            appt: sheet.getCell(i, startIndex + 4).formattedValue,
                        });

                        break;
                    }

                    if (++loopIndex > 1000) {
                        break;
                    }
                }
            }
        } else {
            for (let i = sheet.rowCount - 1; i >= 0; i--) {
                const dateVal = sheet.getCell(i, startIndex + 1).formattedValue;

                if (dateVal && isDateValid(dateVal.toString())) {
                    const correctDateStr = correctMonthSpelling(dateVal);
                    const formattedSheetDate = getFormattedDateStr(correctDateStr);

                    if (formattedSheetDate === formattedDate) {
                        result.push({
                            agent: agent.name,
                            date: formattedDate,
                            weekDay: weekDay,
                            hours: sheet.getCell(i, startIndex + 3).formattedValue,
                            appt: sheet.getCell(i, startIndex + 4).formattedValue,
                        });

                        break;
                    }

                    if (++loopIndex > 500) {
                        break;
                    }
                }
            }
        }
    }

    return result;
};

export async function POST(request: NextRequest) {
    // let authToken = (request.headers.get("authorization") || "").split("Bearer").at(1);
    // if (authToken) authToken = authToken.trim().normalize().toLowerCase();

    // if (!authToken || authToken !== process.env.SHEET_API_SECRET) {
    //     return Response.json(
    //         {
    //             success: false,
    //             error: "Unauthorized",
    //         },
    //         { status: 401 },
    //     );
    // }

    const data = (await request.json()) as RequestPayload;
    if (!data) {
        return NextResponse.json(
            {
                success: false,
                error: "input_error",
                message: "missing data",
            },
            { status: 400 },
        );
    }

    try {
        //*************************** Get Customer from Campaign Name *********************************/
        const customer = await prisma.customer.findUnique({
            where: {
                id: data.customerId,
            },
            include: {
                campaigns: true,
                agents: true,
            },
        });

        if (!customer) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cannot find customer",
                },
                { status: 500 },
            );
        }

        const dateList = data.date;
        let totalDue = 0;

        // ********* Start of Lead Qty Data **************** //
        let totalLeadQty = 0;
        const leadQtyData: LeadQtyItem[] = [];
        const creditData: number[] = [];
        let rowIndex = 0;
        const holidayData: DateItem[] = [];

        for (const item of dateList) {
            const leadQtyItem: LeadQtyItem = {};

            leadQtyItem["date"] = getFormattedDateStr(item.date);
            leadQtyItem["day"] = item.weekDay.charAt(0).toUpperCase() + item.weekDay.slice(1);

            let dayLeadQty = 0;
            for (const campaign of customer.campaigns) {
                const campaignAbbre = campaign.abbreviation?.toString() ?? " ";
                const campaignLeadQty = getLeadQty(data.value, campaign, rowIndex);

                if (campaignLeadQty?.type === "lead") {
                    totalLeadQty += campaignLeadQty.value;
                    dayLeadQty += campaignLeadQty.value;

                    leadQtyItem[campaignAbbre] = campaignLeadQty.value;
                } else if (campaignLeadQty?.type === "credit") {
                    creditData.push(campaignLeadQty.value);
                    leadQtyItem[campaignAbbre] = 0;
                }
            }

            leadQtyItem["price"] = customer.isBundle ? 0 : customer.price;
            leadQtyItem["due"] = customer.isBundle ? 0 : Math.ceil(customer.price * dayLeadQty);

            if (dayLeadQty) {
                leadQtyData.push(leadQtyItem);
            } else {
                const weekDay = getFormattedWeekDay(item.date);

                if (weekDay !== 6) {
                    if (customer.noHolidayList) {
                        if (!JSON.parse(customer.noHolidayList).includes(weekDayList[weekDay])) {
                            holidayData.push(item);
                        }
                    } else {
                        holidayData.push(item);
                    }
                }
            }

            rowIndex += 1;
        }

        let total_lead_due = 0;
        if (customer.isBundle) {
            total_lead_due += customer.price;
        } else {
            total_lead_due += Math.ceil(totalLeadQty * customer.price);
        }
        // ********* End of Lead Qty Data **************** //

        // ********* Start of Agent Working Hours **************** //
        const agentWorking: AgentWorkingItem[] = [];
        const agents = customer.agents.filter((a) => a.status === true);

        if (agents.length) {
            // ** Open agent working hours sheet
            const serviceAccountAuth = new JWT({
                email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                key: process.env.GOOGLE_PRIVATE_KEY?.toString().replace(/\\n/g, "\n"),
                scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly", "https://www.googleapis.com/auth/spreadsheets"],
            });

            const sheets: Array<SheetLike | null> = [];
            let agentIndex = 0;

            try {
                for (const agent of agents) {
                    if (agent.sheet && agent.sheet !== "") {
                        const sheetDoc = new GoogleSpreadsheet(agent.sheet, serviceAccountAuth);
                        await sheetDoc.loadInfo();

                        const workingTabName = agent.tab ?? "Hours";
                        const workingHoursSheet = sheetDoc.sheetsByTitle[workingTabName];
                        sheets[agentIndex] = workingHoursSheet;
                    } else {
                        sheets[agentIndex] = null;
                    }

                    agentIndex += 1;
                }
            } catch (error) {
                console.error(error);

                return NextResponse.json(
                    {
                        success: false,
                        error: error,
                    },
                    { status: 500 },
                );
            }

            // ** Parse agent working hours sheet
            const total_agent_due = 0;

            agentIndex = 0;

            const agentDateList = [];
            for (const item of dateList) {
                const item_day_array = item.weekDay.toString().replace(/\s+/g, " ").split(" ");
                if (item_day_array.length > 1) {
                    if (item_day_array[item_day_array.length - 1].toString().toLowerCase() === "8am") {
                        continue;
                    }
                }
                agentDateList.push(item.date);
            }

            for (const agent of agents) {
                const dayAgentWorkingList = await getAgentWorkingHours(customer, agent, sheets[agentIndex], agentDateList);

                // console.log(JSON.stringify(dayAgentWorkingList, null, 2));

                for (const dayAgentWorking of dayAgentWorkingList) {
                    const agentWorkItem: AgentWorkingItem = {
                        date: dayAgentWorking.date,
                        day: weekDayList[dayAgentWorking.weekDay],
                        name: dayAgentWorking.agent ?? agent.name,
                        hours: dayAgentWorking.hours ? parseFloatMax2(dayAgentWorking.hours) : 0,
                        appt: dayAgentWorking.appt ? parseFloatMax2(dayAgentWorking.appt) : 0,
                        due: 0,
                    };

                    agentWorkItem.due = agentWorkItem.hours * 10 + agentWorkItem.appt * 2;

                    if (agentWorkItem.due > 0) {
                        agentWorking.push(agentWorkItem);
                    }
                }

                agentIndex += 1;
            }

            totalDue = total_lead_due + total_agent_due;
        } else {
            totalDue = total_lead_due;
        }

        // ********* End of Agent Working Hours **************** //

        const invoiceInfo = {
            customer: customer.name,
            prior: data.prior,
            lead: leadQtyData,
            credit: creditData,
            agent: agentWorking,
            due: totalDue,
            holiday: holidayData,
            date: dateList[dateList.length - 1].date,
        };

        return NextResponse.json(
            {
                success: true,
                data: invoiceInfo,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: error,
            },
            { status: 500 },
        );
    }
}
