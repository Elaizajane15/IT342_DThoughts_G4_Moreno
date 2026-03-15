package com.dthoughts.g4.moreno.controller;

import com.dthoughts.g4.moreno.dto.AuthResponse;
import com.dthoughts.g4.moreno.dto.LoginRequest;
import com.dthoughts.g4.moreno.dto.RegisterRequest;
import com.dthoughts.g4.moreno.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(401).body(error);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request == null ? null : request.get("email");
            authService.requestPasswordReset(email);
            Map<String, Object> body = new HashMap<>();
            body.put("message", "If an account exists for this email, a reset code has been generated.");
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request == null ? null : request.get("token");
            String newPassword = request == null ? null : request.get("newPassword");
            authService.resetPassword(token, newPassword);
            Map<String, Object> body = new HashMap<>();
            body.put("message", "Password has been reset successfully.");
            return ResponseEntity.ok(body);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("message", e.getMessage());
            return ResponseEntity.status(400).body(error);
        }
    }
}
