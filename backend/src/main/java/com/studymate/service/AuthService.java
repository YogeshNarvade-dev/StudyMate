package com.studymate.service;

import com.studymate.dto.AuthDtos.*;
import com.studymate.model.User;
import com.studymate.repository.UserRepository;
import com.studymate.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder,
                       AuthenticationManager authManager, JwtService jwt) {
        this.users = users; this.encoder = encoder; this.authManager = authManager; this.jwt = jwt;
    }

    public AuthResponse register(RegisterRequest request) {
        if (users.existsByEmailIgnoreCase(request.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
        User user = users.save(new User(request.name().trim(),
            request.email().trim().toLowerCase(), encoder.encode(request.password())));
        return response(user);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(
                request.email().trim().toLowerCase(), request.password()));
        } catch (AuthenticationException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        User user = users.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return response(user);
    }

    private AuthResponse response(User user) {
        return new AuthResponse(jwt.generate(user.getEmail()), user.getId(),
            user.getName(), user.getEmail(), user.getRole().name());
    }
}
