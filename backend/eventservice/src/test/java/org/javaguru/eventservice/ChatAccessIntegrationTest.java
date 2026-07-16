package org.javaguru.eventservice;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Интеграционные тесты доступа к чату.
 */
@SpringBootTest
@AutoConfigureMockMvc
class ChatAccessIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    /**
     * Участник после join читает историю сообщений.
     *
     * @throws Exception ошибка MVC
     */
    @Test
    void participantCanReadMessagesAfterJoin() throws Exception {
        mockMvc.perform(post("/eventservice/api/events/e-cycling-1/join")
                        .header("X-User-Id", "2"))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/eventservice/api/chats/e-cycling-1/messages")
                        .header("X-User-Id", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThan(0)));
    }

    /**
     * Пользователь без участия получает 403.
     *
     * @throws Exception ошибка MVC
     */
    @Test
    void outsiderGetsForbidden() throws Exception {
        mockMvc.perform(get("/eventservice/api/chats/e-cycling-1/messages")
                        .header("X-User-Id", "3"))
                .andExpect(status().isForbidden());
    }
}
