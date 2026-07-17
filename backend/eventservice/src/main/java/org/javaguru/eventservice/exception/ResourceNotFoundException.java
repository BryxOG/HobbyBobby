package org.javaguru.eventservice.exception;

/**
 * Ресурс не найден.
 */
public class ResourceNotFoundException extends RuntimeException {

    /**
     * Создаёт исключение с сообщением.
     *
     * @param message описание ошибки
     */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
