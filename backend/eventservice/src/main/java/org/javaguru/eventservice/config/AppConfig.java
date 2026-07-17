package org.javaguru.eventservice.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Общая конфигурация приложения.
 */
@Configuration
@EnableConfigurationProperties({UserServiceProperties.class, ChatProperties.class, EventNotificationProperties.class})
public class AppConfig implements WebMvcConfigurer {

    /**
     * HTTP-клиент для вызовов UserService.
     *
     * @return RestClient без базового URL
     */
    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

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
