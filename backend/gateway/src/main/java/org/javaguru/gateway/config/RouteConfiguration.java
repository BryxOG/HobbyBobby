package org.javaguru.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.stripPrefix;
import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.cloud.gateway.server.mvc.predicate.GatewayRequestPredicates.path;

@Configuration
class RouteConfiguration {

    @Bean
    RouterFunction<ServerResponse> gatewayRoutes(GatewayRouteProperties properties) {
        return route("event-service")
                .route(path("/api/events/**", "/api/tags/**", "/api/map/**"), http())
                .before(uri(properties.eventServiceUrl()))
                .before(stripPrefix(1))
                .build()
                .and(route("user-service")
                        .route(path("/api/users/**", "/api/chats/**"), http())
                        .before(uri(properties.userServiceUrl()))
                        .before(stripPrefix(1))
                        .build());
    }
}
