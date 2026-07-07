import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../constants/BaseURL";

const maskToken = (token) => {
  if (!token) return "";
  return token.length > 12 ? `${token.slice(0, 12)}...` : `${token}...`;
};

const summarizeBody = (body) => {
  if (typeof body !== "string") return body;
  return body.length > 1000 ? `${body.slice(0, 1000)}... [truncated]` : body;
};

export const appLaunchApi = {
  recordAppLaunch: async () => {
    const url = `${BASE_URL}/app_launch`;

    try {
      const idToken = await AsyncStorage.getItem("id_token");
      const headers = {
        Authorization: `Bearer ${idToken || ""}`,
      };

      console.log(
        `${url} request :`,
        JSON.stringify(
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${maskToken(idToken)}`,
            },
            body: null,
            hasToken: Boolean(idToken),
          },
          null,
          2,
        ),
      );

      const response = await fetch(url, {
        method: "POST",
        headers,
      });

      const responseText = await response.text();
      let responseBody = responseText;

      try {
        responseBody = responseText ? JSON.parse(responseText) : null;
      } catch {
        // Keep non-JSON responses as text so HTML error pages are visible.
      }

      console.log(
        `${url} response :`,
        JSON.stringify(
          {
            status: response.status,
            ok: response.ok,
            contentType: response.headers.get("content-type"),
            body: summarizeBody(responseBody),
          },
          null,
          2,
        ),
      );
    } catch (error) {
      // Analytics-only event. Ignore failures and do not retry.
      console.log(
        `${url} failed :`,
        JSON.stringify(
          {
            method: "POST",
            error: error?.message || String(error),
          },
          null,
          2,
        ),
      );
    }
  },
};
