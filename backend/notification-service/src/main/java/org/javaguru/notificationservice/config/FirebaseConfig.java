package org.javaguru.notificationservice.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

/**
 * Инициализация Firebase Admin SDK из service account.
 */
@Configuration
@ConditionalOnProperty(prefix = "app.firebase", name = "enabled", havingValue = "true", matchIfMissing = true)
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    /**
     * Создаёт FirebaseApp, если credentials заданы.
     *
     * @param properties настройки Firebase
     * @return инициализированное приложение или null
     * @throws IOException при ошибке чтения credentials
     */
    @Bean
    public FirebaseApp firebaseApp(FirebaseProperties properties) throws IOException {
        if (!properties.enabled()) {
            log.warn("Firebase отключён (app.firebase.enabled=false)");
            return null;
        }
        if (FirebaseApp.getApps().isEmpty()) {
            InputStream credentialsStream = openCredentialsStream(properties);
            if (credentialsStream == null) {
                log.warn(
                        "Firebase credentials не заданы — push не будет отправляться. "
                                + "Укажите FIREBASE_SERVICE_ACCOUNT_PATH или FIREBASE_SERVICE_ACCOUNT_JSON"
                );
                return null;
            }
            try (InputStream stream = credentialsStream) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(stream))
                        .build();
                FirebaseApp app = FirebaseApp.initializeApp(options);
                log.info("Firebase Admin SDK инициализирован");
                return app;
            }
        }
        return FirebaseApp.getInstance();
    }

    /**
     * Открывает поток credentials из файла или inline JSON.
     *
     * @param properties настройки Firebase
     * @return поток или null, если credentials не заданы
     * @throws IOException при ошибке чтения файла
     */
    private InputStream openCredentialsStream(FirebaseProperties properties) throws IOException {
        if (StringUtils.hasText(properties.serviceAccountJson())) {
            return new ByteArrayInputStream(properties.serviceAccountJson().getBytes(StandardCharsets.UTF_8));
        }
        if (StringUtils.hasText(properties.serviceAccountPath())) {
            return new FileInputStream(properties.serviceAccountPath());
        }
        return null;
    }
}
