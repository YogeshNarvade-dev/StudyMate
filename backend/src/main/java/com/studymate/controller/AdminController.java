package com.studymate.controller;

import com.studymate.repository.UserRepository;
import com.studymate.service.ResourceService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final ResourceService resources;
    private final UserRepository users;
    public AdminController(ResourceService resources, UserRepository users) {
        this.resources = resources; this.users = users;
    }
    @GetMapping("/stats")
    public Map<String, Long> stats() {
        return Map.of("totalResources", resources.count(), "totalUsers", resources.countUsers());
    }
    @GetMapping("/users")
    public Object users() {
        return users.findAll().stream().map(u -> Map.of(
            "id", u.getId(), "name", u.getName(), "email", u.getEmail(),
            "role", u.getRole().name(), "createdAt", u.getCreatedAt())).toList();
    }
}
