import { prisma } from "@/lib/prisma";
import { getInvoiceDateStrWithTimezone } from "@/lib/google-sheet-action.ts/getDateString";

export async function getCurrentInvoiceIndex(id: number) {
	const customer = await prisma.customer.findUnique({
		where: {
			id: id,
		}
	});

	if (!customer) {
		return null;
	}

	if (!customer.invoiceIndex) {
		return null;
	}

	const invoiceNumberInfo = JSON.parse(customer.invoiceIndex);

	const currentDate = getInvoiceDateStrWithTimezone();
	// const date1 = new Date(invoiceNumberInfo.date);
	// const date2 = new Date(currentDate);

	// const timestamp1 = date1.getTime();
	// const timestamp2 = date2.getTime();

	// const differenceInMilliseconds = timestamp2 - timestamp1;
	// const millisecondsInWeek = 7 * 24 * 60 * 60 * 1000;

	// const differenceInWeeks = differenceInMilliseconds / millisecondsInWeek;

	let currentInvoiceNumber = invoiceNumberInfo.number;

	// if (differenceInWeeks >= 1) {
	// 	currentInvoiceNumber += differenceInWeeks;

	// 	await prisma.customer.update({
	// 		where: { id: id },
	// 		data: {
	// 			invoiceIndex: JSON.stringify({
	// 				number: parseInt(currentInvoiceNumber.toString()),
	// 				date: currentDate
	// 			})
	// 		},
	// 	});
	// }

	currentInvoiceNumber += 1;

	await prisma.customer.update({
		where: { id: id },
		data: {
			invoiceIndex: JSON.stringify({
				number: parseInt(currentInvoiceNumber.toString()),
				date: currentDate
			})
		},
	});

	return currentInvoiceNumber;	
}