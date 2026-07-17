package org.javaguru.eventservice.exception;

/**
 * Доступ к ресурсу запрещён.
 */
public class ForbiddenException extends RuntimeException {

    /**
     * Создаёт исключение с сообщением.
     *
     * @param message описание ошибки
     */
    public ForbiddenException(String message) {
        super(message);
    }
}
