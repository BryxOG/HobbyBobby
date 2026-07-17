package org.javaguru.notificationservice.repository;

import java.util.List;
import java.util.Optional;
import org.javaguru.notificationservice.entity.DevicePlatform;
import org.javaguru.notificationservice.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Репозиторий FCM-токенов устройств.
 */
public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {

    /**
     * Возвращает все токены пользователя.
     *
     * @param userId идентификатор пользователя
     * @return список токенов
     */
    List<DeviceToken> findByUserId(Long userId);

    /**
     * Возвращает токен пользователя на платформе.
     *
     * @param userId   идентификатор пользователя
     * @param platform платформа
     * @return токен, если зарегистрирован
     */
    Optional<DeviceToken> findByUserIdAndPlatform(Long userId, DevicePlatform platform);

    /**
     * Удаляет токен по значению FCM.
     *
     * @param fcmToken значение токена
     */
    void deleteByFcmToken(String fcmToken);
}
