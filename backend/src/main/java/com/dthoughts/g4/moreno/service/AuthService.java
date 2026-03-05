package com.dthoughts.g4.moreno.service;

import com.dthoughts.g4.moreno.dto.AuthResponse;
import com.dthoughts.g4.moreno.dto.LoginRequest;
import com.dthoughts.g4.moreno.dto.RegisterRequest;
import com.dthoughts.g4.moreno.dto.UserDto;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    public AuthResponse login(LoginRequest request) {
        Optional<User> user = userRepository.findByEmail(request.getEmail());
        
        if (user.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User foundUser = user.get();
        if (!foundUser.getPassword().equals(request.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = "token_" + UUID.randomUUID().toString();
        UserDto userDto = UserDto.fromEntity(foundUser);
        
        return new AuthResponse(token, userDto);
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User newUser = new User(
            request.getEmail(),
            request.getPassword(),
            request.getFirstName(),
            request.getLastName()
        );

        User savedUser = userRepository.save(newUser);
        
        String token = "token_" + UUID.randomUUID().toString();
        UserDto userDto = UserDto.fromEntity(savedUser);
        
        return new AuthResponse(token, userDto);
    }
}
