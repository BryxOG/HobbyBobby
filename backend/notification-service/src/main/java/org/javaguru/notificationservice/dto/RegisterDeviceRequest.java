package org.javaguru.notificationservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.javaguru.notificationservice.entity.DevicePlatform;

/**
 * Запрос регистрации FCM-токена устройства.
 */
public record RegisterDeviceRequest(
        @NotNull Long userId,
        @NotBlank String fcmToken,
        @NotNull DevicePlatform platform
) {
}
