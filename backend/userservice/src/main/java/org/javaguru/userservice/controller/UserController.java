package org.javaguru.userservice.controller;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.javaguru.userservice.dto.CreateUserRequest;
import org.javaguru.userservice.dto.InterestResponse;
import org.javaguru.userservice.dto.SetUserInterestsRequest;
import org.javaguru.userservice.dto.UserRequest;
import org.javaguru.userservice.dto.UserResponse;
import org.javaguru.userservice.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * REST API для управления пользователями.
 */
@RestController
@RequestMapping("userservice/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * Возвращает список всех пользователей.
     *
     * @return список пользователей
     */
    @GetMapping
    public List<UserResponse> findAll() {
        return userService.findAll();
    }

    /**
     * Возвращает пользователя по email (упрощённый вход без пароля).
     *
     * @param email адрес электронной почты
     * @return данные пользователя
     */
    @GetMapping("/by-email")
    public UserResponse findByEmail(@RequestParam String email) {
        return userService.findByEmail(email);
    }

    /**
     * Возвращает пользователей по списку идентификаторов.
     *
     * @param ids идентификаторы пользователей (повторы и отсутствующие id игнорируются)
     * @return список найденных пользователей
     */
    @GetMapping("/by-ids")
    public List<UserResponse> findByIds(@RequestParam List<Long> ids) {
        return userService.findByIds(ids);
    }

    /**
     * Возвращает пользователя по идентификатору.
     *
     * @param id идентификатор пользователя
     * @return данные пользователя
     */
    @GetMapping("/{id}")
    public UserResponse findById(@PathVariable Long id) {
        return userService.findById(id);
    }

    @GetMapping("/{id}/interests")
    public List<InterestResponse> findInterests(@PathVariable Long id) {
        return userService.findInterests(id);
    }

    /**
     * Заменяет список интересов пользователя.
     *
     * @param id      идентификатор пользователя
     * @param request идентификаторы интересов
     * @return обновлённый пользователь
     */
    @PutMapping("/{id}/interests")
    public UserResponse setInterests(
            @PathVariable Long id,
            @Valid @RequestBody SetUserInterestsRequest request
    ) {
        return userService.setInterests(id, request.interestIds());
    }

    /**
     * Создаёт нового пользователя с интересами.
     *
     * @param request входные данные
     * @return созданный пользователь
     */
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(created.id())
                .toUri();
        return ResponseEntity.created(location).body(created);
    }

    /**
     * Обновляет существующего пользователя.
     *
     * @param id      идентификатор пользователя
     * @param request входные данные
     * @return обновлённые данные
     */
    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserRequest request) {
        return userService.update(id, request);
    }

    /**
     * Удаляет пользователя.
     *
     * @param id идентификатор пользователя
     * @return пустой ответ 204
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
