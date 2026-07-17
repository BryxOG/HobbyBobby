package org.javaguru.notificationservice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Общая конфигурация приложения.
 */
@Configuration
@EnableConfigurationProperties({NotificationProperties.class, FirebaseProperties.class})
public class AppConfig implements WebMvcConfigurer {

    /**
     * Разрешает запросы с фронтенда в dev-режиме.
     *
     * @param registry реестр CORS
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
