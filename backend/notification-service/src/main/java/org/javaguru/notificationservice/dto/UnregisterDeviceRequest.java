package org.javaguru.notificationservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * Запрос удаления FCM-токена устройства.
 */
public record UnregisterDeviceRequest(
        @NotNull Long userId,
        @NotBlank String fcmToken
) {
}
