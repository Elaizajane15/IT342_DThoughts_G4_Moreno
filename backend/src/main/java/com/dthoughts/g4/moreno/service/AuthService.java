package com.dthoughts.g4.moreno.service;

import com.dthoughts.g4.moreno.dto.AuthResponse;
import com.dthoughts.g4.moreno.dto.LoginRequest;
import com.dthoughts.g4.moreno.dto.RegisterRequest;
import com.dthoughts.g4.moreno.dto.UserDto;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.FollowRepository;
import com.dthoughts.g4.moreno.repository.PostLikeRepository;
import com.dthoughts.g4.moreno.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.oauth2.core.user.OAuth2User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private PostLikeRepository postLikeRepository;

    private static final int RESET_TOKEN_BYTES = 32;
    private static final long RESET_TOKEN_TTL_MINUTES = 15;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthResponse login(LoginRequest request) {
        if (request == null) throw new RuntimeException("Request is required");
        String email = request.getEmail() == null ? null : request.getEmail().trim();
        if (email == null || email.isBlank()) throw new RuntimeException("Email is required");
        Optional<User> user = userRepository.findByEmailIgnoreCase(email);
        
        if (user.isEmpty()) {
            throw new RuntimeException("User not found");
        }

        User foundUser = user.get();
        String password = request.getPassword() == null ? "" : request.getPassword();
        if (!foundUser.getPassword().equals(password)) {
            throw new RuntimeException("Invalid credentials");
        }

        String token = "token_" + UUID.randomUUID().toString();
        UserDto userDto = toDtoWithStats(foundUser);
        
        return new AuthResponse(token, userDto);
    }

    public String requestPasswordReset(String email) {
        String e = email == null ? null : email.trim();
        if (e == null || e.isBlank()) throw new RuntimeException("Email is required");

        Optional<User> existing = userRepository.findByEmailIgnoreCase(e);
        if (existing.isEmpty()) return null;

        String token = generateResetToken();
        String tokenHash = sha256Hex(token);

        User user = existing.get();
        user.setPasswordResetTokenHash(tokenHash);
        user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_TTL_MINUTES));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return token;
    }

    public void resetPassword(String token, String newPassword) {
        String t = token == null ? null : token.trim();
        if (t == null || t.isBlank()) throw new RuntimeException("Reset token is required");
        String p = newPassword == null ? null : newPassword;
        if (p == null || p.isBlank()) throw new RuntimeException("New password is required");

        String tokenHash = sha256Hex(t);
        Optional<User> existing = userRepository.findByPasswordResetTokenHash(tokenHash);
        if (existing.isEmpty()) throw new RuntimeException("Invalid or expired reset token");

        User user = existing.get();
        LocalDateTime expiresAt = user.getPasswordResetExpiresAt();
        if (expiresAt == null || expiresAt.isBefore(LocalDateTime.now())) {
            user.setPasswordResetTokenHash(null);
            user.setPasswordResetExpiresAt(null);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
            throw new RuntimeException("Invalid or expired reset token");
        }

        user.setPassword(p);
        user.setPasswordResetTokenHash(null);
        user.setPasswordResetExpiresAt(null);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public AuthResponse register(RegisterRequest request) {
        if (request == null) throw new RuntimeException("Request is required");
        String email = request.getEmail() == null ? null : request.getEmail().trim();
        if (email == null || email.isBlank()) throw new RuntimeException("Email is required");
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new RuntimeException("Email already exists");
        }

        User newUser = new User(
            email,
            request.getPassword(),
            request.getFirstName(),
            request.getLastName()
        );

        User savedUser = userRepository.save(newUser);
        
        String token = "token_" + UUID.randomUUID().toString();
        UserDto userDto = toDtoWithStats(savedUser);
        
        return new AuthResponse(token, userDto);
    }

    public AuthResponse loginWithGoogle(OAuth2User oauth2User) {
        String rawEmail = stringAttr(oauth2User, "email");
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new RuntimeException("Google account email is not available");
        }
        final String email = rawEmail.trim();

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

        Optional<User> existing = userRepository.findByEmailIgnoreCase(email);
        User user = existing.orElseGet(() -> userRepository.save(new User(
                email,
                UUID.randomUUID().toString(),
                resolvedFirstName,
                resolvedLastName
        )));

        String token = "token_" + UUID.randomUUID();
        UserDto userDto = toDtoWithStats(user);
        return new AuthResponse(token, userDto);
    }

    public AuthResponse authenticateWithGoogleOAuth2User(OAuth2User oauth2User) {
        return loginWithGoogle(oauth2User);
    }

    private static String stringAttr(OAuth2User oauth2User, String key) {
        Object v = oauth2User.getAttributes().get(key);
        return v == null ? null : String.valueOf(v);
    }

    private UserDto toDtoWithStats(User user) {
        UserDto dto = UserDto.fromEntity(user);
        Long id = user.getId();
        long followerCount = id == null ? 0 : followRepository.countByFollowingId(id);
        long followingCount = id == null ? 0 : followRepository.countByFollowerId(id);
        long totalLikes = id == null ? 0 : postLikeRepository.countByPostUserId(id);
        dto.setFollowerCount(followerCount);
        dto.setFollowingCount(followingCount);
        dto.setTotalLikes(totalLikes);
        return dto;
    }

    private String generateResetToken() {
        byte[] b = new byte[RESET_TOKEN_BYTES];
        secureRandom.nextBytes(b);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest((input == null ? "" : input).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte d : digest) {
                sb.append(String.format("%02x", d));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate reset token");
        }
    }
}
