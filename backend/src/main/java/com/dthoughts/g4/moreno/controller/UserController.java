package com.dthoughts.g4.moreno.controller;

import com.dthoughts.g4.moreno.dto.FollowStatusDto;
import com.dthoughts.g4.moreno.dto.PostDto;
import com.dthoughts.g4.moreno.dto.ToggleFollowRequest;
import com.dthoughts.g4.moreno.dto.UpdateUserRequest;
import com.dthoughts.g4.moreno.dto.UserDto;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.FollowRepository;
import com.dthoughts.g4.moreno.repository.PostLikeRepository;
import com.dthoughts.g4.moreno.repository.UserRepository;
import com.dthoughts.g4.moreno.service.FollowService;
import com.dthoughts.g4.moreno.service.PostInteractionService;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(originPatterns = {"http://localhost:*", "http://127.0.0.1:*"})
public class UserController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FollowService followService;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private PostLikeRepository postLikeRepository;

    @Autowired
    private PostInteractionService postInteractionService;

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initSchema() {
        ensureImageColumns();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        if (id == null) return ResponseEntity.badRequest().body(error("User id is required"));
        Optional<User> u = userRepository.findById(id);
        if (u.isEmpty()) return ResponseEntity.status(404).body(error("User not found"));
        return ResponseEntity.ok(toDtoWithStats(u.get()));
    }

    @GetMapping("/search")
    public ResponseEntity<?> search(@RequestParam(required = false) String q, @RequestParam(defaultValue = "25") int limit) {
        int size = Math.max(1, Math.min(limit, 50));
        String query = q == null ? "" : q.trim();

        List<UserDto> users;
        if (query.isBlank()) {
            users = userRepository
                    .findAll(PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "createdAt")))
                    .getContent()
                    .stream()
                    .map(UserDto::fromEntity)
                    .collect(Collectors.toList());
        } else {
            users = userRepository
                    .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                            query, query, query,
                            PageRequest.of(0, size, Sort.by(Sort.Direction.DESC, "createdAt"))
                    )
                    .getContent()
                    .stream()
                    .map(UserDto::fromEntity)
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@RequestParam String email) {
        String e = email == null ? null : email.trim();
        Optional<User> u = e == null || e.isBlank() ? Optional.empty() : userRepository.findByEmailIgnoreCase(e);
        if (u.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "User not found");
            return ResponseEntity.status(404).body(error);
        }
        return ResponseEntity.ok(toDtoWithStats(u.get()));
    }

    @GetMapping("/{id}/follow")
    public ResponseEntity<?> followStatus(@PathVariable Long id, @RequestParam(required = false) Long followerId) {
        try {
            FollowStatusDto dto = followService.getFollowStatus(followerId, id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PostMapping("/{id}/follow/toggle")
    public ResponseEntity<?> toggleFollow(@PathVariable Long id, @RequestBody ToggleFollowRequest request) {
        try {
            FollowStatusDto dto = followService.toggleFollow(request == null ? null : request.getFollowerId(), id);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/liked-posts")
    public ResponseEntity<?> likedPosts(@PathVariable Long id) {
        try {
            List<PostDto> posts = postInteractionService.listLikedPosts(id);
            return ResponseEntity.ok(posts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @GetMapping("/{id}/saved-posts")
    public ResponseEntity<?> savedPosts(@PathVariable Long id) {
        try {
            List<PostDto> posts = postInteractionService.listSavedPosts(id);
            return ResponseEntity.ok(posts);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam String email, @RequestParam("file") MultipartFile file) {
        try {
            if (email == null || email.isBlank()) throw new RuntimeException("Email is required");
            if (file == null || file.isEmpty()) throw new RuntimeException("file is required.");

            ensureImageColumns();

            Optional<User> u = userRepository.findByEmailIgnoreCase(email.trim());
            if (u.isEmpty()) return ResponseEntity.status(404).body(error("User not found"));

            User user = u.get();
            String path = storeImage(file, "avatars", "u" + user.getId() + "_avatar");
            user.setAvatarUrl(path);
            userRepository.save(user);
            return ResponseEntity.ok(toDtoWithStats(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PostMapping("/me/cover")
    public ResponseEntity<?> uploadCover(@RequestParam String email, @RequestParam("file") MultipartFile file) {
        try {
            if (email == null || email.isBlank()) throw new RuntimeException("Email is required");
            if (file == null || file.isEmpty()) throw new RuntimeException("file is required.");

            ensureImageColumns();

            Optional<User> u = userRepository.findByEmailIgnoreCase(email.trim());
            if (u.isEmpty()) return ResponseEntity.status(404).body(error("User not found"));

            User user = u.get();
            String path = storeImage(file, "covers", "u" + user.getId() + "_cover");
            user.setCoverImageUrl(path);
            userRepository.save(user);
            return ResponseEntity.ok(toDtoWithStats(user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(error(e.getMessage()));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateMe(@RequestBody UpdateUserRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "Email is required");
            return ResponseEntity.badRequest().body(error);
        }
        Optional<User> u = userRepository.findByEmailIgnoreCase(request.getEmail().trim());
        if (u.isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("message", "User not found");
            return ResponseEntity.status(404).body(error);
        }
        User user = u.get();
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getCoverImageUrl() != null) user.setCoverImageUrl(request.getCoverImageUrl());
        if (request.getBirthDate() != null && !request.getBirthDate().isBlank()) {
            try {
                user.setBirthDate(LocalDate.parse(request.getBirthDate()));
            } catch (Exception ignored) {}
        }
        userRepository.save(user);
        return ResponseEntity.ok(toDtoWithStats(user));
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

    private Map<String, String> error(String message) {
        Map<String, String> e = new HashMap<>();
        e.put("message", message == null ? "Request failed." : message);
        return e;
    }

    private String storeImage(MultipartFile file, String folderName, String filenamePrefix) {
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null) {
            int idx = original.lastIndexOf('.');
            if (idx >= 0 && idx < original.length() - 1) ext = original.substring(idx);
        }
        if (ext.length() > 12) ext = "";

        String filename = filenamePrefix + "_" + System.currentTimeMillis() + ext;
        Path uploadPath = Paths.get("uploads", folderName);
        try {
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(filename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file.");
        }
        return "/uploads/" + folderName + "/" + filename;
    }

    private void ensureImageColumns() {
        if (jdbcTemplate == null) return;

        ensureColumn("users", "avatar_url", "VARCHAR(500)");
        ensureColumn("users", "cover_image_url", "VARCHAR(500)");
    }

    private void ensureColumn(String table, String column, String ddlType) {
        try {
            Integer exists =
                    jdbcTemplate.queryForObject(
                            "SELECT COUNT(*) FROM information_schema.columns WHERE LOWER(table_name) = ? AND LOWER(column_name) = ?",
                            Integer.class,
                            table.toLowerCase(),
                            column.toLowerCase()
                    );
            if (exists != null && exists > 0) return;
        } catch (Exception ignored) {
        }

        try {
            jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN " + column + " " + ddlType);
        } catch (Exception e) {
            throw new RuntimeException(
                    "Database schema error: missing " + table + "." + column + " and cannot create it.",
                    e
            );
        }
    }
}
