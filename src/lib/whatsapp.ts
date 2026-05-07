const ULTRAMSG_INSTANCE = process.env.ULTRAMSG_INSTANCE || "";
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || "";

type UltraMsgGroup = {
    id?: string;
    name?: string;
};

type WhatsappGroupLookupResult = {
    groupId: string | null;
    error?: string;
};

export async function getWhatsappGroupId(groupName: string) {
    const normalizedGroupName = groupName.trim();
    if (!normalizedGroupName) {
        return {
            groupId: null,
            error: "WhatsApp group name is required.",
        } satisfies WhatsappGroupLookupResult;
    }

    if (!ULTRAMSG_INSTANCE || !ULTRAMSG_TOKEN) {
        return {
            groupId: null,
            error: "WhatsApp integration is not configured. Missing ULTRAMSG_INSTANCE or ULTRAMSG_TOKEN.",
        } satisfies WhatsappGroupLookupResult;
    }

    try {
        const urlencoded = new URLSearchParams();
        urlencoded.append("token", ULTRAMSG_TOKEN);

        const textResponse = await fetch(`https://api.ultramsg.com/${ULTRAMSG_INSTANCE}/groups?` + urlencoded, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            redirect: "follow",
        });

        if (!textResponse.ok) {
            const detail = (await textResponse.text().catch(() => "")).trim();
            return {
                groupId: null,
                error: detail || `Failed to fetch WhatsApp groups (HTTP ${textResponse.status}).`,
            } satisfies WhatsappGroupLookupResult;
        }

        const textResult = await textResponse.text();
        const parsed = JSON.parse(textResult) as unknown;
        if (!Array.isArray(parsed)) {
            return {
                groupId: null,
                error: "Unexpected WhatsApp groups response format.",
            } satisfies WhatsappGroupLookupResult;
        }

        const groupList = parsed as UltraMsgGroup[];

        for (const item of groupList) {
            if (item.name?.trim() === normalizedGroupName && item.id?.trim()) {
                return {
                    groupId: item.id.trim(),
                } satisfies WhatsappGroupLookupResult;
            }
        }

        return {
            groupId: null,
            error: `WhatsApp group \"${normalizedGroupName}\" was not found.`,
        } satisfies WhatsappGroupLookupResult;
    } catch (error) {
        return {
            groupId: null,
            error: error instanceof Error ? error.message : "Unable to resolve WhatsApp group id.",
        } satisfies WhatsappGroupLookupResult;
    }
}
