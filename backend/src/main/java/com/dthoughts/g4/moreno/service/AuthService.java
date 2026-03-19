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
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
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
    private static final long JWT_TTL_MINUTES = 60 * 24 * 7;

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

        String token = issueJwt(foundUser, "password");
        UserDto userDto = toDtoWithStats(foundUser);
        
        return new AuthResponse(token, userDto);
    }

    public void requestPasswordReset(String email) {
        String e = email == null ? null : email.trim();
        if (e == null || e.isBlank()) throw new RuntimeException("Email is required");

        Optional<User> existing = userRepository.findByEmailIgnoreCase(e);
        if (existing.isEmpty()) return;

        String token = generateResetToken();
        String tokenHash = sha256Hex(token);

        User user = existing.get();
        user.setPasswordResetTokenHash(tokenHash);
        user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_TTL_MINUTES));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    public void resetPassword(String token, String newPassword) {
        String t = token == null ? null : token.trim();
        if (t == null || t.isBlank()) throw new RuntimeException("Reset token is required");
        String p = newPassword;
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
        
        String token = issueJwt(savedUser, "password");
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

        String token = issueJwt(user, "google");
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

    private String issueJwt(User user, String provider) {
        Long userId = user == null ? null : user.getId();
        String email = user == null ? null : user.getEmail();
        long iatSeconds = System.currentTimeMillis() / 1000L;
        long expSeconds = Date.from(LocalDateTime.now().plusMinutes(JWT_TTL_MINUTES).atZone(ZoneId.systemDefault()).toInstant()).getTime() / 1000L;

        String headerJson = "{\"alg\":\"HS256\",\"typ\":\"JWT\"}";
        String payloadJson = "{"
                + "\"sub\":" + jsonString(userId == null ? "" : String.valueOf(userId)) + ","
                + "\"iat\":" + iatSeconds + ","
                + "\"exp\":" + expSeconds + ","
                + "\"email\":" + jsonString(email == null ? "" : email) + ","
                + "\"provider\":" + jsonString(provider == null ? "" : provider)
                + "}";

        String headerB64 = base64Url(headerJson.getBytes(StandardCharsets.UTF_8));
        String payloadB64 = base64Url(payloadJson.getBytes(StandardCharsets.UTF_8));
        String signingInput = headerB64 + "." + payloadB64;
        String sigB64 = base64Url(hmacSha256(jwtSecretBytes(), signingInput.getBytes(StandardCharsets.UTF_8)));
        return signingInput + "." + sigB64;
    }

    private static byte[] hmacSha256(byte[] secret, byte[] data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return mac.doFinal(data);
        } catch (Exception e) {
            throw new RuntimeException("Failed to create JWT");
        }
    }

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes == null ? new byte[0] : bytes);
    }

    private static String jsonString(String value) {
        String v = value == null ? "" : value;
        StringBuilder sb = new StringBuilder(v.length() + 2);
        sb.append('"');
        for (int i = 0; i < v.length(); i++) {
            char c = v.charAt(i);
            switch (c) {
                case '\\' -> sb.append("\\\\");
                case '"' -> sb.append("\\\"");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        sb.append('"');
        return sb.toString();
    }

    private byte[] jwtSecretBytes() {
        String fromProp = System.getProperty("APP_JWT_SECRET");
        String fromEnv = System.getenv("APP_JWT_SECRET");
        String s = (fromProp != null && !fromProp.isBlank()) ? fromProp : fromEnv;
        if (s == null || s.isBlank()) s = "dev-secret-change-me-dev-secret-change-me";

        byte[] raw = s.getBytes(StandardCharsets.UTF_8);
        if (raw.length >= 32) return raw;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return md.digest(raw);
        } catch (Exception e) {
            return (s + "................................").substring(0, 32).getBytes(StandardCharsets.UTF_8);
        }
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
