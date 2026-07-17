package org.javaguru.eventservice;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Интеграционные тесты участия в ивенте.
 */
@SpringBootTest
@AutoConfigureMockMvc
class EventMembershipIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Проверяет, что join добавляет участника без ошибки 500.
     *
     * @throws Exception ошибка MVC
     */
    @Test
    void joinAddsParticipantToCyclingEvent() throws Exception {
        mockMvc.perform(post("/eventservice/api/events/e-cycling-1/join")
                        .header("X-User-Id", "2"))
                .andExpect(status().isOk());
    }

    /**
     * Повторный join идемпотентен.
     *
     * @throws Exception ошибка MVC
     */
    @Test
    void joinIsIdempotent() throws Exception {
        mockMvc.perform(post("/eventservice/api/events/e-cycling-1/join")
                        .header("X-User-Id", "2"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/eventservice/api/events/e-cycling-1/join")
                        .header("X-User-Id", "2"))
                .andExpect(status().isOk());
    }
}
