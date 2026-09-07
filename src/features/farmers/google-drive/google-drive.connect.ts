import { config } from "dotenv";
import { googleDriveService } from "@/features/farmers/google-drive/google-drive.service.js";

config();

const state = googleDriveService.createOAuthState();
const url = googleDriveService.getAuthUrl(state);

console.log("Open this URL, sign in as the shared Google Drive account, and approve Drive access.");
console.log("After redirect, GOOGLE_DRIVE_REFRESH_TOKEN will be written to .env automatically.\n");
console.log(url);
