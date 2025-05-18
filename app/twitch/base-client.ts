import { authProvider } from "./auth.js";
import { ApiClient } from "@twurple/api";

export const baseClient = new ApiClient({ authProvider });
