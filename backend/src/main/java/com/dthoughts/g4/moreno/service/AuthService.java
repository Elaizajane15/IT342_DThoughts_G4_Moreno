package com.dthoughts.g4.moreno.service;

import com.dthoughts.g4.moreno.dto.AuthResponse;
import com.dthoughts.g4.moreno.dto.LoginRequest;
import com.dthoughts.g4.moreno.dto.RegisterRequest;
import com.dthoughts.g4.moreno.dto.UserDto;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.oauth2.core.user.OAuth2User;
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

    public AuthResponse loginWithGoogle(OAuth2User oauth2User) {
        String email = stringAttr(oauth2User, "email");
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Google account email is not available");
        }

        String firstName = stringAttr(oauth2User, "given_name");
        String lastName = stringAttr(oauth2User, "family_name");
        if ((firstName == null || firstName.isBlank()) && (lastName == null || lastName.isBlank())) {
            String name = stringAttr(oauth2User, "name");
            if (name != null && !name.isBlank()) {
                String[] parts = name.trim().split("\\s+", 2);
                firstName = parts[0];
                lastName = parts.length > 1 ? parts[1] : "User";
            } else {
                firstName = "Google";
                lastName = "User";
            }
        }

        final String resolvedFirstName = (firstName == null || firstName.isBlank()) ? "Google" : firstName;
        final String resolvedLastName = (lastName == null || lastName.isBlank()) ? "User" : lastName;

        Optional<User> existing = userRepository.findByEmail(email);
        User user = existing.orElseGet(() -> userRepository.save(new User(
                email,
                UUID.randomUUID().toString(),
                resolvedFirstName,
                resolvedLastName
        )));

        String token = "token_" + UUID.randomUUID();
        UserDto userDto = UserDto.fromEntity(user);
        return new AuthResponse(token, userDto);
    }

    public AuthResponse authenticateWithGoogleOAuth2User(OAuth2User oauth2User) {
        return loginWithGoogle(oauth2User);
    }

    private static String stringAttr(OAuth2User oauth2User, String key) {
        Object v = oauth2User.getAttributes().get(key);
        return v == null ? null : String.valueOf(v);
    }
}
