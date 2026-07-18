package org.javaguru.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.rewritePath;
import static org.springframework.cloud.gateway.server.mvc.filter.BeforeFilterFunctions.uri;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.cloud.gateway.server.mvc.predicate.GatewayRequestPredicates.path;

@Configuration
class RouteConfiguration {

    @Bean
    RouterFunction<ServerResponse> gatewayRoutes(
            GatewayRouteProperties properties,
            UserContextBeforeFilter userContextBeforeFilter
    ) {
        return route("event-service")
                .route(
                        path(
                                "/api/events/**",
                                "/api/tags/**",
                                "/api/map/**",
                                "/api/chats/**"
                        ),
                        http()
                )
                .before(userContextBeforeFilter)
                .before(rewritePath("/api/(?<segment>.*)", "/eventservice/api/${segment}"))
                .before(uri(properties.eventServiceUrl()))
                .build()
                .and(route("user-service")
                        .route(path("/api/users/**"), http())
                        .before(userContextBeforeFilter)
                        .before(rewritePath("/api/(?<segment>.*)", "/userservice/api/${segment}"))
                        .before(uri(properties.userServiceUrl()))
                        .build());
    }
}
