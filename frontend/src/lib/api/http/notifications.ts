import { notificationRequest } from "./notificationRequest";
import type { RegisterDeviceRequest } from "../types";

/** HTTP-клиент регистрации FCM-токенов. */
export const httpNotificationsClient = {
  async registerDevice(request: RegisterDeviceRequest): Promise<void> {
    await notificationRequest("/devices", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  async unregisterDevice(userId: number, fcmToken: string): Promise<void> {
    await notificationRequest("/devices", {
      method: "DELETE",
      body: JSON.stringify({ userId, fcmToken }),
    });
  },
};
