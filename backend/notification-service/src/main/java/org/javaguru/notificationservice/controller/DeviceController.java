package org.javaguru.notificationservice.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.javaguru.notificationservice.dto.RegisterDeviceRequest;
import org.javaguru.notificationservice.dto.UnregisterDeviceRequest;
import org.javaguru.notificationservice.service.DeviceTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API регистрации FCM-токенов устройств.
 */
@RestController
@RequestMapping("notificationservice/api/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceTokenService deviceTokenService;

    /**
     * Регистрирует FCM-токен устройства пользователя.
     *
     * @param request данные устройства
     */
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(@Valid @RequestBody RegisterDeviceRequest request) {
        deviceTokenService.register(request);
    }

    /**
     * Удаляет FCM-токен устройства.
     *
     * @param request данные для отписки
     */
    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(@Valid @RequestBody UnregisterDeviceRequest request) {
        deviceTokenService.unregister(request);
    }
}
