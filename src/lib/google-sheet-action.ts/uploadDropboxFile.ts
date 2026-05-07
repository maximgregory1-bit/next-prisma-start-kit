import { Dropbox } from "dropbox";
import fetch from "node-fetch";

export async function uploadDropboxFile(
  accessToken: string,
  uploadPath: string,
  fileBuffer: Buffer,
) {
  try {
    const dbx = new Dropbox({
      fetch,
      clientId: process.env.DROPBOX_APP_KEY || "",
      clientSecret: process.env.DROPBOX_APP_SECRET || "",
      selectUser: process.env.DROPBOX_TEAM_MEMBER_ID || "",
      accessToken: accessToken,
      pathRoot: JSON.stringify({
        ".tag": "root",
        root: process.env.DROPBOX_ROOT_NAMESPACE_ID || "",
      }),
    });

    const teamUploadPath = process.env.DROPBOX_UPLOAD_FOLDER || "";
    const fileUploadPath = "/" + teamUploadPath + uploadPath;

    await dbx.filesUpload({
      path: fileUploadPath,
      contents: Buffer.from(fileBuffer),
      mode: { ".tag": "overwrite" },
    });

    const sharedResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: fileUploadPath,
    });

    const tmp = await dbx.filesGetTemporaryLink({ path: fileUploadPath });

    return {
      success: true,
      link: sharedResponse?.result?.url ?? null,
      directLink: tmp?.result?.link ?? null,
    };
  } catch (error) {
    return {
      success: false,
      error: error,
    };
  }
}

export default uploadDropboxFile;
