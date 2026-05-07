/* eslint-disable @typescript-eslint/no-explicit-any, prefer-const, @typescript-eslint/ban-ts-comment */

import { prisma } from "@/lib/prisma";

import FormData from "form-data";
import { promises as fs } from "fs";
import path from "path";
import ExcelJS from "exceljs";

import { getFormattedDateStr, getInvoiceFormattedDateStr } from "@/lib/google-sheet-action.ts/getDateString";
import { getCurrentInvoiceIndex } from "@/lib/google-sheet-action.ts/getCurrentInvoiceIndex";

import getDropboxToken from "@/lib/google-sheet-action.ts/getDropboxToken";
import uploadDropboxFile from "@/lib/google-sheet-action.ts/uploadDropboxFile";

const blackFont = {
    size: 8,
    name: "Arial",
    bold: true,
    color: { argb: "00000000" },
};

const redFont = {
    size: 8,
    name: "Arial",
    bold: true,
    color: { argb: "FFFF0000" },
};

const dayOfWeekAsString = (dayIndex: number) => {
    const weekDayList = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return weekDayList[dayIndex] || "";
};

export async function makeInvoice(excelInfo: any) {
    const data = excelInfo;

    try {
        //****************************** find customer model *************************/
        if (!data.customer || data.customer == "") {
            return {
                success: false,
                error: "Customer name is invalid",
            };
        }

        const customer = await prisma.customer.findUnique({
            where: {
                name: data.customer,
            },
            include: {
                campaigns: true,
                agents: true,
            },
        });

        if (!customer) {
            return {
                success: false,
                error: "Cannot find customer named " + data.customer,
            };
        }
        //********************************************************************************* */

        //****************************** open new excel file ****************************** */
        const sampleExcelPath = path.join(process.cwd(), "/data/invoice/sample.xlsx");

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(sampleExcelPath);
        const worksheet = workbook.getWorksheet(1);
        //********************************************************************************* */

        if (!worksheet) {
            return {
                success: false,
                error: "Cannot open invoice sample file",
            };
        }

        //****************************** Edit excel file ****************************** */

        /************************** Invoice date & Customer name **********************/
        worksheet.getCell(6, 15).value = getFormattedDateStr(data.date);
        worksheet.getCell(7, 15).value = customer.contactName ?? customer.name;

        let invoiceRowNumber = 8;

        if (customer.email) {
            const emailList = JSON.parse(customer.email);
            if (emailList.length) {
                worksheet.getCell(8, 15).value = emailList[0];
                worksheet.getCell(8, 15).border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                };
                invoiceRowNumber = 9;
            }
        }

        if (invoiceRowNumber === 8) {
            worksheet.getCell(9, 14).value = "";
            worksheet.getCell(9, 15).value = "";
        }

        if (!customer.invoiceIndex) {
            worksheet.getCell(invoiceRowNumber, 14).value = "";
            worksheet.getCell(invoiceRowNumber, 15).value = "";
        } else {
            const invoiceNumber = await getCurrentInvoiceIndex(customer.id);

            worksheet.getCell(invoiceRowNumber, 14).value = "Invoice # ";
            worksheet.getCell(invoiceRowNumber, 15).value = invoiceNumber ?? "";
            worksheet.getCell(invoiceRowNumber, 15).border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        }

        if (!customer.extraText) {
            worksheet.getCell(11, 15).value = "";
        } else {
            worksheet.getCell(11, 15).value = customer.extraText;
        }

        let additional_row_num = 0;

        const active_campaigns = customer.campaigns.filter((campaign: any) => campaign.status === true);
        let row = worksheet.getRow(14);
        let startColNum = 15 - active_campaigns.length;

        if (customer.isBundle && customer.isWeekly && customer.weeklyLead) {
            let old_style = worksheet.getCell(11, 17).style;
            worksheet.mergeCells(11, 5, 11, 17);
            worksheet.getCell(11, 17).style = old_style;
            worksheet.getCell(11, 17).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFF00" },
                bgColor: { argb: "FF0000FF" },
            };

            worksheet.getCell(11, 17).value = `$ ${customer.bundlePrice.toLocaleString()} per week Bundle ${customer.weeklyLead} Leads`;
        }
        /************************** Campaign Names **********************/
        for (let i = 0; i < active_campaigns.length; i++) {
            let keyName = active_campaigns[i].abbreviation ?? "";
            row.getCell(startColNum + i).value = keyName;
        }

        if (!customer.isBundle || !customer.isShowSaved) {
            worksheet.getCell(14, 16).value = "";
            worksheet.getCell(14, 17).value = "Due";
            worksheet.getColumn(16).width = 0.01;
        }

        /************************** Prior Due Amount **********************/
        if (data.prior.date) {
            worksheet.getCell(15, 4).value = "Prior Invoice " + getFormattedDateStr(data.prior.date);

            if (data.prior.amount < 0) {
                let origin_style = worksheet.getCell(15, 4).style;
                worksheet.getCell(15, 4).style = {
                    font: redFont,
                    alignment: origin_style.alignment,
                    numFmt: origin_style.numFmt,
                };
            }
        } else {
            worksheet.getCell(15, 4).value = "";
        }

        worksheet.getCell(15, 17).value = parseInt(data.prior.amount.toString());

        if (data.prior.amount < 0) {
            let origin_style = worksheet.getCell(15, 17).style;
            worksheet.getCell(15, 17).style = {
                font: redFont,
                alignment: origin_style.alignment,
                numFmt: origin_style.numFmt,
            };
        }

        const lead_qty_data = data.lead;
        const lead_qty_len = lead_qty_data.length;

        let lead_row_index: number = 0;
        let current_row_num: number = 17;

        let totalLeadQty = 0;
        let totalLeadQtyPrice = 0;
        let leadQtyPerCampaign: any = {};

        /************************** Lead Qty data **********************/
        for (let item of lead_qty_data) {
            if (lead_row_index) {
                worksheet.duplicateRow(current_row_num, 1, true);
                current_row_num += 1;
            }

            let row = worksheet.getRow(current_row_num);
            row.height = 15;

            row.getCell(3).value = item.date;
            row.getCell(4).value = item.day;

            let rowLeadQtySum = 0;
            let startColNum = 15 - active_campaigns.length;

            for (let i = 0; i < active_campaigns.length; i++) {
                let keyName = active_campaigns[i].abbreviation ?? "";

                row.getCell(startColNum + i).value = item[keyName] ?? 0;
                rowLeadQtySum += item[keyName] ?? 0;

                if (item[keyName]) {
                    if (leadQtyPerCampaign[keyName] === undefined) {
                        leadQtyPerCampaign[keyName] = parseInt(item[keyName].toString());
                    } else {
                        leadQtyPerCampaign[keyName] += parseInt(item[keyName].toString());
                    }
                } else {
                    if (leadQtyPerCampaign[keyName] === undefined) {
                        leadQtyPerCampaign[keyName] = 0;
                    } else {
                        leadQtyPerCampaign[keyName] += 0;
                    }
                }
            }

            totalLeadQty += rowLeadQtySum;

            if (!customer.isBundle || customer.isShowSaved) {
                row.getCell(15).value = parseFloat(customer.price.toFixed(2));

                let original_amount = parseInt(rowLeadQtySum.toString()) * customer.price;
                if (customer.isBundle && customer.isShowSaved) {
                    row.getCell(16).style = {
                        font: blackFont,
                        alignment: { vertical: "middle", horizontal: "right", wrapText: true },
                        numFmt: '_($* #,##0_);_($* (#,##0);_($* "-"??_);_(@_)',
                    };
                    row.getCell(16).value = original_amount;
                } else {
                    row.getCell(17).value = original_amount;
                }

                totalLeadQtyPrice += parseInt(rowLeadQtySum.toString()) * customer.price;
            }

            lead_row_index += 1;
        }

        /************************** Custom Credit **********************/
        let total_custom_credit_amount = 0;
        if (!customer.isBundle && customer.customCredit) {
            worksheet.duplicateRow(current_row_num, 1, true);
            current_row_num += 1;

            let row = worksheet.getRow(current_row_num);

            row.getCell(3).value = "";
            row.getCell(4).value = "Credit";

            let origin_style = row.getCell(4).style;
            row.getCell(4).style = {
                font: redFont,
                alignment: origin_style.alignment,
                numFmt: origin_style.numFmt,
            };

            let customCreditTotal = 0;
            for (let i = 0; i < active_campaigns.length; i++) {
                let keyName = active_campaigns[i].abbreviation ?? "";

                let customCreditValuePerCampaign = Math.round(parseFloat((leadQtyPerCampaign[keyName] * customer.customCredit).toString()) / 100.0);

                let old_style = row.getCell(startColNum + i).style;
                row.getCell(startColNum + i).style = {
                    font: redFont,
                    alignment: old_style.alignment,
                    numFmt: '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)',
                };
                row.getCell(startColNum + i).value = -customCreditValuePerCampaign;

                customCreditTotal += customCreditValuePerCampaign;
            }

            let old_style = row.getCell(15).style;
            row.getCell(15).style = {
                font: redFont,
                alignment: old_style.alignment,
                numFmt: old_style.numFmt,
            };
            row.getCell(15).value = parseFloat(customer.price.toFixed(2));

            row.getCell(16).value = "";

            old_style = row.getCell(17).style;
            row.getCell(17).style = {
                font: redFont,
                alignment: old_style.alignment,
                numFmt: '_($* #,##0_);_($* (#,##0);_($* "-"??_);_(@_)',
            };

            total_custom_credit_amount = customCreditTotal * customer.price;
            row.getCell(17).value = -total_custom_credit_amount;

            totalLeadQtyPrice -= total_custom_credit_amount;
        }

        /************************** Percentage **********************/
        if (customer.isShowPercent) {
            worksheet.duplicateRow(current_row_num, 1, true);
            current_row_num += 1;

            let row = worksheet.getRow(current_row_num);

            row.getCell(3).value = "";
            row.getCell(4).value = "";

            for (let i = 0; i < active_campaigns.length; i++) {
                let keyName = active_campaigns[i].abbreviation ?? "";
                row.getCell(startColNum + i).value = leadQtyPerCampaign[keyName];
            }

            let old_style = row.getCell(15).style;
            row.getCell(15).style = {
                font: old_style.font,
                alignment: old_style.alignment,
                numFmt: '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)',
            };
            row.getCell(15).value = totalLeadQty;
            row.getCell(16).value = "";
            row.getCell(17).value = "";

            worksheet.duplicateRow(current_row_num, 1, true);
            current_row_num += 1;

            row = worksheet.getRow(current_row_num);
            for (let i = 0; i < active_campaigns.length; i++) {
                let keyName = active_campaigns[i].abbreviation ?? "";
                let percent = Math.round(parseFloat((leadQtyPerCampaign[keyName] * 100).toString()) / parseFloat(totalLeadQty.toString()));

                let old_style = row.getCell(startColNum + i).style;
                row.getCell(startColNum + i).style = {
                    font: old_style.font,
                    alignment: old_style.alignment,
                    numFmt: '#,#0"%"',
                };

                row.getCell(startColNum + i).value = parseInt(percent.toString());
            }
            row.getCell(15).value = "";
            row.getCell(17).value = "";
        }

        /************************** Credit **********************/
        let total_credit_amount = 0;
        if (data.credit.length) {
            //@ts-ignore
            total_credit_amount = data.credit.reduce((n, item) => n + item, 0);

            if (total_credit_amount > 0) {
                totalLeadQty -= total_credit_amount;

                worksheet.duplicateRow(current_row_num, 1, true);
                current_row_num += 1;

                let row = worksheet.getRow(current_row_num);

                row.values = [];

                row.getCell(3).value = "";
                row.getCell(4).style = {
                    font: redFont,
                    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
                };
                row.getCell(4).value = "Credit";

                row.getCell(14).style = {
                    font: redFont,
                    alignment: { vertical: "middle", horizontal: "right", wrapText: true },
                    numFmt: '_(* #,##0_);_(* (#,##0);_(* "-"??_);_(@_)',
                };

                row.getCell(14).value = -total_credit_amount;

                if (!customer.isBundle) {
                    let original_numFmt = worksheet.getCell(current_row_num, 15).style.numFmt;
                    row.getCell(15).style = {
                        font: redFont,
                        alignment: { vertical: "middle", horizontal: "right", wrapText: true },
                        numFmt: original_numFmt,
                    };
                    row.getCell(15).value = parseFloat(customer.price.toFixed(2));

                    row.getCell(17).style = {
                        font: redFont,
                        alignment: { vertical: "middle", horizontal: "right", wrapText: true },
                        numFmt: '_($* #,##0_);_($* (#,##0);_($* "-"??_);_(@_)',
                    };
                    row.getCell(17).value = -(total_credit_amount * customer.price);

                    totalLeadQtyPrice -= total_credit_amount * customer.price;
                } else {
                    row.getCell(15).style = {
                        font: redFont,
                        alignment: { vertical: "middle", horizontal: "right", wrapText: true },
                        numFmt: '_($* #,##0.00_);_($* (#,##0.00);_($* "-"??_);_(@_)',
                    };
                    row.getCell(15).value = parseFloat(customer.price.toFixed(2));

                    row.getCell(17).style = {
                        font: redFont,
                        alignment: { vertical: "middle", horizontal: "right", wrapText: true },
                        numFmt: '_($* #,##0_);_($* (#,##0);_($* "-"??_);_(@_)',
                    };
                    row.getCell(17).value = -(total_credit_amount * customer.price);
                }
            }
        }

        /************************** Foster **********************/
        const isFoster: boolean = customer.name.toString().toLocaleLowerCase().includes("foster");

        if (customer.isTotalLeadQty) {
            worksheet.duplicateRow(current_row_num, 1, true);
            current_row_num += 1;

            let row = worksheet.getRow(current_row_num);

            row.getCell(3).value = "";
            row.getCell(4).value = "Total Qty of Leads:";

            for (let i = 0; i < active_campaigns.length - 1; i++) {
                row.getCell(startColNum + i).value = "";
            }
            row.getCell(startColNum + active_campaigns.length - 1).value = totalLeadQty;
            row.getCell(15).value = "";
            row.getCell(17).value = "";
        }

        let lead_qty_due = 0;
        let weekly_custom_price = 0;
        if (customer.isBundle) {
            if (customer.isWeekly && customer.weeklyLead) {
                /************************** Show weekly custom price **********************/
                current_row_num += 1;

                let lastRowNum: number = 17 + lead_qty_len - 1;
                let centerRowNum: number = Math.round((17 + lastRowNum) / 2);

                worksheet.getCell(centerRowNum, 15).value = "Bundle";

                let weeklyLeadQty = parseInt(customer.weeklyLead.toString());
                let bundlePrice = parseInt(customer.bundlePrice.toString());

                if (totalLeadQty >= weeklyLeadQty) {
                    weekly_custom_price = parseInt(customer.bundlePrice.toString());
                } else {
                    weekly_custom_price = (parseFloat(totalLeadQty.toString()) / parseFloat(weeklyLeadQty.toString())) * parseFloat(bundlePrice.toString());
                }

                worksheet.getCell(centerRowNum, 17).value = parseInt(weekly_custom_price.toString());

                let old_style = worksheet.getCell(current_row_num, 3).style;

                worksheet.mergeCells(current_row_num, 3, current_row_num, 14);
                worksheet.getCell(current_row_num, 3).style = old_style;
                worksheet.getCell(current_row_num, 3).value = "Total " + totalLeadQty;

                lead_qty_due = parseInt(data.prior.amount.toString()) + parseInt(weekly_custom_price.toString());
                worksheet.getCell(current_row_num, 17).value = lead_qty_due;
            } else {
                if (!customer.isShowSaved) {
                    /************************** Show bundle price **********************/
                    current_row_num += 1;

                    let lastRowNum: number = 17 + lead_qty_len - 1;
                    let centerRowNum: number = Math.round((17 + lastRowNum) / 2);

                    worksheet.getCell(centerRowNum, 15).value = "Bundle";
                    worksheet.getCell(centerRowNum, 17).value = parseInt(customer.bundlePrice.toString());
                } else {
                    let lastRowNum: number = 17 + lead_qty_len - 1;
                    let centerRowNum: number = Math.round((17 + lastRowNum) / 2);

                    worksheet.getCell(centerRowNum, 17).value = parseInt(customer.bundlePrice.toString());

                    /************************** Show origin value on additional line **********************/
                    worksheet.duplicateRow(current_row_num, 1, true);
                    current_row_num += 1;
                    let row = worksheet.getRow(current_row_num);
                    let original_numFmt = row.getCell(16).style.numFmt;
                    row.values = [];

                    row.getCell(16).style = {
                        font: blackFont,
                        alignment: { vertical: "middle", horizontal: "right", wrapText: true },
                        numFmt: original_numFmt,
                    };
                    row.getCell(16).value = totalLeadQtyPrice;

                    current_row_num += 1;
                }

                if (data.holiday.length && customer.isHoliday) {
                    let holiday_count = 0;

                    for (const item of data.holiday) {
                        let date = new Date(Date.parse(item.date));
                        let weekDay = date.getUTCDay();
                        let weekDayStr = dayOfWeekAsString(weekDay).toString().toLowerCase();

                        let weekDayList = item.weekDay.toString().replace(/\s+/g, " ").split(" ");

                        if (weekDayList.length > 1) {
                            if (weekDayList[0].toString().toLowerCase() === weekDayStr) {
                                if (
                                    weekDayList[weekDayList.length - 1].toString().toLowerCase() === "8am" ||
                                    weekDayList[weekDayList.length - 1].toString().toLowerCase() === "2pm"
                                ) {
                                    holiday_count += 1;
                                }
                            }
                        } else {
                            if (weekDayList[0].toString().toLowerCase() === weekDayStr) {
                                holiday_count += 2;
                            }
                        }
                    }

                    let weekTotalQty = 12;
                    if (customer.noHolidayList) {
                        const noHolidayCount = JSON.parse(customer.noHolidayList).length;
                        weekTotalQty -= noHolidayCount * 2;
                    }

                    /************************** Show Prorated Deduction on additional line **********************/
                    additional_row_num += 1;

                    current_row_num -= 1;
                    worksheet.duplicateRow(current_row_num, 1, true);
                    current_row_num += 1;
                    let row = worksheet.getRow(current_row_num);
                    row.values = [];

                    row.getCell(4).value = "Prorated Deduction";
                    let origin_style = row.getCell(4).style;
                    row.getCell(4).style = {
                        font: redFont,
                        alignment: origin_style.alignment,
                        numFmt: origin_style.numFmt,
                    };

                    origin_style = row.getCell(17).style;
                    row.getCell(17).style = {
                        font: redFont,
                        alignment: origin_style.alignment,
                        numFmt: '_($* #,##0_);_($* (#,##0);_($* "-"??_);_(@_)',
                    };

                    let prorated_deduction = (parseFloat(customer.bundlePrice.toString()) * holiday_count) / weekTotalQty;
                    row.getCell(17).value = -prorated_deduction;

                    current_row_num += 1;
                    /**************************************************************************************/

                    lead_qty_due = parseInt(data.prior.amount.toString()) + (parseFloat(customer.bundlePrice.toString()) * (weekTotalQty - holiday_count)) / weekTotalQty;
                    worksheet.getCell(current_row_num, 15).value = "Prorated Total Due";
                    // worksheet.getCell(current_row_num, 17).value = lead_qty_due;
                } else {
                    lead_qty_due = parseInt(data.prior.amount.toString()) + parseInt(customer.bundlePrice.toString());
                    // worksheet.getCell(current_row_num, 17).value = lead_qty_due;
                }
            }
        } else {
            current_row_num += 1;
            lead_qty_due = parseInt(data.prior.amount.toString()) + totalLeadQtyPrice;
            // worksheet.getCell(current_row_num, 17).value = lead_qty_due;
        }

        // Deduct credit amount from bundle price
        if (customer.isBundle && data.credit.length) {
            //@ts-ignore
            let credit_amount = data.credit.reduce((n, item) => n + item, 0);
            lead_qty_due -= credit_amount * customer.price;
        }

        worksheet.getCell(current_row_num, 17).value = parseInt(lead_qty_due.toString());
        if (lead_qty_due < 0) {
            let origin_style = worksheet.getCell(current_row_num, 17).style;
            worksheet.getCell(current_row_num, 17).style = {
                font: redFont,
                alignment: origin_style.alignment,
                numFmt: origin_style.numFmt,
                fill: origin_style.fill,
            };

            origin_style = worksheet.getCell(current_row_num, 15).style;
            worksheet.getCell(current_row_num, 15).style = {
                font: redFont,
                alignment: origin_style.alignment,
                numFmt: origin_style.numFmt,
                fill: origin_style.fill,
            };
        }

        let total_due_invoice = lead_qty_due;
        /************************** Agent working hours **********************/
        const agent_data = data.agent;
        const agent_data_len = agent_data.length;
        if (agent_data_len) {
            let agent_index: number = 0;
            current_row_num += 4;
            for (let item of agent_data) {
                // decide row number
                if (agent_index) {
                    worksheet.duplicateRow(current_row_num, 1, true); //lead_qty_data.length - 2, true);
                    current_row_num += 1;
                }

                let row = worksheet.getRow(current_row_num);
                row.height = 15;

                row.getCell(3).value = item.name;
                row.getCell(4).value = item.date;

                worksheet.mergeCells(current_row_num, 5, current_row_num, 7);
                let weekdayStr = item.day.split(" ");
                if (weekdayStr.length) row.getCell(5).value = weekdayStr[0];
                else row.getCell(5).value = item.day;

                worksheet.mergeCells(current_row_num, 13, current_row_num, 14);
                row.getCell(13).value = item.hours;

                row.getCell(15).value = item.appt;
                row.getCell(17).value = item.due;

                agent_index += 1;
            }

            //@ts-ignore
            let agent_working_due = agent_data.reduce((n, { due }) => n + due, 0);
            worksheet.getCell(current_row_num + 1, 17).value = agent_working_due;

            //@ts-ignore
            total_due_invoice += agent_working_due;

            let total_due_row = 23 + lead_qty_len + agent_data_len + additional_row_num;

            if (data.credit.length && total_credit_amount > 0) {
                total_due_row += 1;
            }

            if (customer.isShowSaved) {
                total_due_row += 1;
            }

            if (isFoster) {
                total_due_row += 1;
            }

            if (customer.isShowPercent) {
                total_due_row += 2;
            }

            worksheet.getCell(total_due_row, 17).value = parseInt(total_due_invoice.toString());

            if (total_due_invoice < 0) {
                let origin_style = worksheet.getCell(total_due_row, 17).style;
                worksheet.getCell(total_due_row, 17).style = {
                    font: redFont,
                    alignment: origin_style.alignment,
                    numFmt: origin_style.numFmt,
                    fill: origin_style.fill,
                };

                origin_style = worksheet.getCell(total_due_row, 15).style;
                worksheet.getCell(total_due_row, 15).style = {
                    font: redFont,
                    alignment: origin_style.alignment,
                    numFmt: origin_style.numFmt,
                    fill: origin_style.fill,
                };
            }
        } else {
            worksheet.spliceRows(current_row_num + 2, 6);
        }

        /************************** Define total range **********************/
        let lastRange: number = agent_data_len ? 46 + (lead_qty_len + agent_data_len - 2) : 46 + lead_qty_len - 1 - 6;
        if (data.credit.length && total_credit_amount > 0) {
            lastRange += 1;
        }

        if (customer.isShowSaved) {
            lastRange += 1;
        }

        if (isFoster) {
            lastRange += 1;
        }

        if (customer.isShowPercent) {
            lastRange += 2;
        }

        lastRange += additional_row_num;

        /************************** Foster block **********************/
        if (isFoster) {
            current_row_num += 2;
            let row = worksheet.getRow(current_row_num);

            const fontSetting = {
                size: 8,
                name: "Arial",
                bold: true,
                color: { argb: "FF000000" },
            };

            worksheet.mergeCells(current_row_num, 3, current_row_num, 4);
            row.getCell(3).style = {
                font: fontSetting,
                alignment: { vertical: "middle", horizontal: "center", wrapText: true },
                numFmt: "@",
            };
            row.getCell(3).value = "Total Amount Per State";

            let excludeList = ["or", "ie"];
            let temp_campaigns = active_campaigns.filter((item: any) => {
                return !excludeList.includes(item.abbreviation.toString().toLowerCase());
            });

            let startColNum = 17 - temp_campaigns.length * 2;
            for (let i = 0; i < temp_campaigns.length; i++) {
                let keyName = temp_campaigns[i].abbreviation ?? "";

                worksheet.mergeCells(current_row_num, startColNum + i * 2, current_row_num, startColNum + i * 2 + 1);
                row.getCell(startColNum + i * 2).style = {
                    font: fontSetting,
                    alignment: { vertical: "middle", horizontal: "right", wrapText: true },
                    numFmt: "@",
                };
                row.getCell(startColNum + i * 2).value = keyName;
            }

            current_row_num += 1;
            row = worksheet.getRow(current_row_num);
            for (let i = 0; i < temp_campaigns.length; i++) {
                worksheet.mergeCells(current_row_num, startColNum + i * 2, current_row_num, startColNum + i * 2 + 1);
                row.getCell(startColNum + i * 2).style = {
                    font: fontSetting,
                    alignment: { vertical: "middle", horizontal: "center", wrapText: true },
                    numFmt: '_($* #,##0_);_($* (#,##0);_($* "-"??_);_(@_)',
                };
                row.getCell(startColNum + i * 2).value = total_due_invoice / 4;
            }
        }

        /************************** Set Row height & Column width **********************/
        for (let i = 0; i < lead_qty_len; i++) {
            worksheet.getRow(17 + i).height = 15;
        }

        for (let i = 0; i < agent_data_len; i++) {
            worksheet.getRow(21 + lead_qty_len + i).height = 15;
        }

        /************************** Set unneccessary columns' width to zero **********************/
        let start_remove_index = 8;
        let remove_column_count = 7 - active_campaigns.length;

        if (agent_data_len == 0) {
            start_remove_index = 5;
            remove_column_count = 10 - active_campaigns.length;
        }

        // if (!isFoster) {
        for (let i = 0; i < remove_column_count; i++) {
            let remove_column = worksheet.getColumn(start_remove_index + i);
            remove_column.width = 0.01;
        }

        // Set unneccessary rows' height to zero
        for (let i = 0; i < remove_column_count; i++) {
            let remove_row = worksheet.getRow(lastRange - 18 + i);
            remove_row.height = 0.01;
        }
        // }

        /************************** Insert image on invoice **********************/
        const imgFilePath = path.join(process.cwd(), "/data/invoice/img/2.png");

        const logoBuffer = await fs.readFile(imgFilePath);
        const imageId = workbook.addImage({
            //@ts-ignore
            buffer: logoBuffer,
            extension: "png",
        });

        worksheet.addImage(imageId, {
            //@ts-ignore
            tl: { col: 2, row: lastRange - 20 + remove_column_count },
            //@ts-ignore
            br: { col: 17, row: lastRange - 4 },
        });

        /************************** Setup Print range **********************/
        worksheet.pageSetup.printArea = "B4:R" + lastRange;

        worksheet.mergeCells(lastRange - 1, 3, lastRange - 1, 17);
        worksheet.getCell(lastRange - 1, 3).value = "Your Success in Our Success!!!";
        worksheet.getCell(lastRange - 1, 3).alignment = { vertical: "middle", horizontal: "center" };

        /************************** Get Output invoice file name **********************/

        // let formattedDate = getFormattedDateStrWithTimezone();
        let formattedDate = getInvoiceFormattedDateStr(data.date);
        let destExcelFileName = "Invoice_" + customer.name + "_" + formattedDate + ".xlsx";

        /************************** Write file for test (localhost) **********************/
        if (process.env.NODE_ENV === "development") {
            // const tmpFileName = uuidv4();

            let destExcelPath = path.join(process.cwd(), "/tmp/" + destExcelFileName);
            await workbook.xlsx.writeFile(destExcelPath);

            return {
                success: true,
                data: null,
            };
        }

        /************************** Upload Excel File to Dropbox **********************/
        const excelArrayBuffer = await workbook.xlsx.writeBuffer();
        const excelBuffer = Buffer.from(excelArrayBuffer as any);

        const tokenResponse = await getDropboxToken();
        if (!tokenResponse.success) {
            return {
                success: false,
                error: "Failed to get Dropbox token",
            };
        }

        let uploadPath = `/${customer.name || customer.contactName}/${destExcelFileName}`;

        //@ts-ignore
        let uploadResponse: any = await uploadDropboxFile(tokenResponse.token, uploadPath, excelBuffer as Buffer);
        if (!uploadResponse.success) {
            return {
                success: false,
                error: "Unexpected error during Excel to dropbox uploading",
            };
        }

        const excelFileUrl = uploadResponse.link.toString().replace("&dl=0", "&dl=1");
        //********************************************************************************* */

        /************************** Convert Excel File to Image and Upload to Dropbox **********************/
        const converApiSecret = process.env.CONVERT_API_SECRET || "";
        if (!converApiSecret) {
            return { success: false, error: "Missing CONVERT_API_SECRET" };
        }

        const pageOrientationStr = lastRange <= 53 ? "landscape" : "portrait";

        const form = new FormData();
        form.append("File", excelBuffer, {
            filename: destExcelFileName,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        form.append("PageOrientation", pageOrientationStr);
        form.append("TextAntialiasing", "4");
        form.append("GraphicsAntialiasing", "4");
        form.append("StoreFile", "true");

        // IMPORTANT: buffer the form and set Content-Length
        const bodyBuffer = form.getBuffer();
        const headers = {
            ...form.getHeaders(),
            "Content-Length": String(bodyBuffer.length),
        };

        let convertData: any;
        try {
            const resp = await fetch(`https://v2.convertapi.com/convert/xlsx/to/png?Secret=${converApiSecret}`, {
                method: "POST",
                headers: headers,
                body: bodyBuffer as unknown as BodyInit,
            });
            if (!resp.ok) {
                const errorText = await resp.text();
                throw new Error(errorText || `ConvertAPI conversion failed: ${resp.status}`);
            }
            convertData = await resp.json();
        } catch (e: any) {
            return {
                success: false,
                error: e?.message || "ConvertAPI conversion failed",
            };
        }

        const pngUrl = convertData?.Files?.[0]?.Url;
        if (!pngUrl) {
            return { success: false, error: "Unexpected error on Excel to Image conversion (no output URL)" };
        }

        const pngResp = await fetch(pngUrl);
        if (!pngResp.ok) {
            return { success: false, error: `Failed to download converted image: ${pngResp.status}` };
        }
        const pngArrayBuffer = await pngResp.arrayBuffer();
        const imageData = Buffer.from(pngArrayBuffer);

        // Upload PNG to Dropbox
        const imageFileName = `Invoice_${customer.name}_${formattedDate}.png`;
        const imageUploadPath = `/${customer.name || customer.contactName}/images/${imageFileName}`;

        const imageUploadResponse: any = await uploadDropboxFile(tokenResponse.token, imageUploadPath, imageData);

        if (!imageUploadResponse.success) {
            return { success: false, error: "Unexpected error on Image to Dropbox uploading" };
        }

        const imageDownloadUrl = imageUploadResponse.link.toString().replace("&dl=0", "&dl=1");

        const newInvoice = await prisma.invoice.create({
            data: {
                customerId: customer.id,
                startDate: new Date(Date.parse(data.lead[0].date)),
                endDate: new Date(Date.parse(data.lead[data.lead.length - 1].date)),
                sendDate: new Date(),
                amount: parseInt(total_due_invoice.toString()),
                prior: parseInt(data.prior.amount.toString()),
                excelFile: JSON.stringify({
                    name: destExcelFileName,
                    url: excelFileUrl,
                }),
                imageFile: JSON.stringify({
                    name: imageFileName,
                    url: imageDownloadUrl,
                }),
                pageOrientation: pageOrientationStr === "landscape",
            },
        });

        return {
            success: true,
            data: newInvoice,
        };
    } catch (error) {
        console.error(error);

        return {
            success: false,
            error: error,
        };
    }
}
