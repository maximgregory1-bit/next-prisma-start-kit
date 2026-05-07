import { env } from "./env";

export async function sendMessage({ sendTo, image }: { sendTo: string; image?: string }) {
    const instance = env.ULTRAMSG_INSTANCE;
    const token = env.ULTRAMSG_TOKEN;

    if (!instance || !token) {
        console.warn("UltraMsg not configured (ULTRAMSG_INSTANCE or ULTRAMSG_TOKEN missing)");
        return { success: false, error: "UltraMsg not configured" };
    }

    try {
        const resp = await fetch(`https://api.ultramsg.com/${instance}/messages/image`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                to: sendTo,
                image: image ?? "",
                caption: "",
            }),
            redirect: "follow",
        });

        const text = await resp.text();
        return { success: true, response: text };
    } catch (error) {
        console.error("sendMessage error", error);
        return { success: false, error };
    }
}
