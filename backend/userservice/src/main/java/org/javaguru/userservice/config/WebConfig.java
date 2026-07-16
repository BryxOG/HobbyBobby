package org.javaguru.userservice.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Глобальная конфигурация веб-слоя.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /**
     * Разрешает запросы с локального фронтенда HobbyBobby.
     *
     * @param registry реестр CORS-правил
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/userservice/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
