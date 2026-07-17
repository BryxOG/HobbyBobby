package org.javaguru.notificationservice.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.AndroidConfig;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Notification;
import java.util.List;
import java.util.Map;
import org.javaguru.notificationservice.entity.DeviceToken;
import org.javaguru.notificationservice.repository.DeviceTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Отправка push-уведомлений через Firebase Cloud Messaging.
 */
@Service
public class FcmPushService {

    private static final Logger log = LoggerFactory.getLogger(FcmPushService.class);

    private final DeviceTokenRepository deviceTokenRepository;
    private final FirebaseApp firebaseApp;

    /**
     * Создаёт сервис отправки push.
     *
     * @param deviceTokenRepository репозиторий токенов
     * @param firebaseApp           Firebase app (может отсутствовать в dev)
     */
    @Autowired
    public FcmPushService(
            DeviceTokenRepository deviceTokenRepository,
            @Autowired(required = false) FirebaseApp firebaseApp
    ) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.firebaseApp = firebaseApp;
    }

    /**
     * Отправляет push всем устройствам указанных пользователей.
     *
     * @param recipientUserIds идентификаторы получателей
     * @param title            заголовок уведомления
     * @param body             текст уведомления
     * @param data             дополнительные данные для клиента
     */
    public void pushToUsers(List<Long> recipientUserIds, String title, String body, Map<String, String> data) {
        if (recipientUserIds == null || recipientUserIds.isEmpty()) {
            return;
        }
        if (firebaseApp == null) {
            log.warn("Firebase не инициализирован — push пропущен: {}", title);
            return;
        }
        FirebaseMessaging messaging = FirebaseMessaging.getInstance(firebaseApp);
        for (Long userId : recipientUserIds) {
            List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
            for (DeviceToken deviceToken : tokens) {
                sendToToken(messaging, deviceToken, title, body, data);
            }
        }
    }

    /**
     * Отправляет одно сообщение на конкретный токен.
     *
     * @param messaging   клиент Firebase Messaging
     * @param deviceToken зарегистрированное устройство
     * @param title       заголовок
     * @param body        текст
     * @param data        data payload
     */
    private void sendToToken(
            FirebaseMessaging messaging,
            DeviceToken deviceToken,
            String title,
            String body,
            Map<String, String> data
    ) {
        Message.Builder builder = Message.builder()
                .setToken(deviceToken.getFcmToken())
                .setNotification(Notification.builder().setTitle(title).setBody(body).build())
                .setAndroidConfig(AndroidConfig.builder()
                        .setPriority(AndroidConfig.Priority.HIGH)
                        .build());
        data.forEach(builder::putData);
        try {
            String messageId = messaging.send(builder.build());
            log.debug("FCM отправлен userId={} messageId={}", deviceToken.getUserId(), messageId);
        } catch (FirebaseMessagingException exception) {
            if (isInvalidToken(exception)) {
                log.info("Удаляем протухший FCM-токен userId={}", deviceToken.getUserId());
                deviceTokenRepository.delete(deviceToken);
                return;
            }
            log.error("Ошибка FCM userId={}", deviceToken.getUserId(), exception);
        }
    }

    /**
     * Проверяет, что токен больше недействителен.
     *
     * @param exception исключение Firebase
     * @return true, если токен нужно удалить
     */
    private boolean isInvalidToken(FirebaseMessagingException exception) {
        MessagingErrorCode code = exception.getMessagingErrorCode();
        return code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT;
    }
}
