package com.studymate.dto;

import jakarta.validation.constraints.*;

public class AuthDtos {
    public record RegisterRequest(
        @NotBlank @Size(max=100) String name,
        @NotBlank @Email @Size(max=150) String email,
        @NotBlank @Size(min=8, max=72) String password
    ) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record AuthResponse(String token, Long id, String name, String email, String role) {}
}
