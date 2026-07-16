package org.javaguru.gateway;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:18080/realms/hobbybobby"
})
@AutoConfigureMockMvc
class GatewaySecurityTest {

    private static HttpServer downstream;

    private final MockMvc mockMvc;

    @Autowired
    GatewaySecurityTest(MockMvc mockMvc) {
        this.mockMvc = mockMvc;
    }

    @BeforeAll
    static void startDownstream() throws IOException {
        downstream = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        downstream.createContext("/eventservice/api/events/ping", GatewaySecurityTest::writeRequestSummary);
        downstream.setExecutor(Executors.newSingleThreadExecutor());
        downstream.start();
    }

    @AfterAll
    static void stopDownstream() {
        if (downstream != null) {
            downstream.stop(0);
        }
    }

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("gateway.routes.event-service-url", () -> "http://localhost:" + downstream.getAddress().getPort());
        registry.add("gateway.routes.user-service-url", () -> "http://localhost:" + downstream.getAddress().getPort());
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    void apiRequiresJwt() throws Exception {
        mockMvc.perform(get("/api/events/ping"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedRequestIsProxiedWithUserContextHeaders() throws Exception {
        mockMvc.perform(get("/api/events/ping")
                        .with(jwt()
                                .jwt(jwt -> jwt
                                        .subject("user-123")
                                        .claim("preferred_username", "demo")
                                        .claim("realm_access", Map.of("roles", List.of("USER")))
                                )
                                .authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("path=/eventservice/api/events/ping")))
                .andExpect(content().string(containsString("x-user-id=user-123")))
                .andExpect(content().string(containsString("x-user-name=demo")))
                .andExpect(content().string(containsString("x-user-roles=USER")));
    }

    private static void writeRequestSummary(HttpExchange exchange) throws IOException {
        String body = """
                path=%s
                x-user-id=%s
                x-user-name=%s
                x-user-roles=%s
                """.formatted(
                exchange.getRequestURI().getPath(),
                exchange.getRequestHeaders().getFirst("X-User-Id"),
                exchange.getRequestHeaders().getFirst("X-User-Name"),
                exchange.getRequestHeaders().getFirst("X-User-Roles")
        );
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(200, bytes.length);
        exchange.getResponseBody().write(bytes);
        exchange.close();
    }
}
