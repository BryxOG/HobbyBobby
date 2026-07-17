package org.javaguru.notificationservice.service;

import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.javaguru.notificationservice.dto.RegisterDeviceRequest;
import org.javaguru.notificationservice.dto.UnregisterDeviceRequest;
import org.javaguru.notificationservice.entity.DeviceToken;
import org.javaguru.notificationservice.repository.DeviceTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Регистрация и удаление FCM-токенов устройств.
 */
@Service
@RequiredArgsConstructor
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokenRepository;

    /**
     * Регистрирует или обновляет FCM-токен пользователя на платформе.
     *
     * @param request данные устройства
     */
    @Transactional
    public void register(RegisterDeviceRequest request) {
        Instant now = Instant.now();
        DeviceToken token = deviceTokenRepository
                .findByUserIdAndPlatform(request.userId(), request.platform())
                .orElseGet(DeviceToken::new);
        token.setUserId(request.userId());
        token.setFcmToken(request.fcmToken());
        token.setPlatform(request.platform());
        if (token.getCreatedAt() == null) {
            token.setCreatedAt(now);
        }
        token.setUpdatedAt(now);
        deviceTokenRepository.save(token);
    }

    /**
     * Удаляет FCM-токен пользователя.
     *
     * @param request данные для отписки
     */
    @Transactional
    public void unregister(UnregisterDeviceRequest request) {
        deviceTokenRepository.deleteByFcmToken(request.fcmToken());
    }
}
