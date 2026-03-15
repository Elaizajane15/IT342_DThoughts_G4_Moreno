package com.dthoughts.g4.moreno;

import com.dthoughts.g4.moreno.entity.Post;
import com.dthoughts.g4.moreno.entity.TrendingTopic;
import com.dthoughts.g4.moreno.entity.User;
import com.dthoughts.g4.moreno.repository.PostRepository;
import com.dthoughts.g4.moreno.repository.TrendingTopicRepository;
import com.dthoughts.g4.moreno.repository.UserRepository;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class MorenoApplication {

	public static void main(String[] args) {
		loadLocalEnvIfPresent();
		SpringApplication.run(MorenoApplication.class, args);
	}

	@Bean
	CommandLineRunner seedData(UserRepository userRepository, TrendingTopicRepository trendingTopicRepository, PostRepository postRepository) {
		return (args) -> {
			seedUsers(userRepository);
			seedPosts(userRepository, postRepository);
			seedTrendingTopics(trendingTopicRepository);
		};
	}

	private void seedUsers(UserRepository userRepository) {
		seedUser(
				userRepository,
				"karla.manalo@example.com",
				"Password123!",
				"Karla",
				"Manalo",
				"https://i.pravatar.cc/300?img=5",
				"https://picsum.photos/seed/karla-cover/1200/400",
				"Gratitude first. Consistency always.",
				LocalDate.of(2001, 7, 14)
		);
		seedUser(
				userRepository,
				"ben.cruz@example.com",
				"Password123!",
				"Ben",
				"Cruz",
				"https://i.pravatar.cc/300?img=12",
				"https://picsum.photos/seed/ben-cover/1200/400",
				"Stoicism, philosophy, and small daily improvements.",
				LocalDate.of(2000, 3, 2)
		);
		seedUser(
				userRepository,
				"lena.park@example.com",
				"Password123!",
				"Lena",
				"Park",
				"https://i.pravatar.cc/300?img=32",
				"https://picsum.photos/seed/lena-cover/1200/400",
				"Mindfulness, wellness, and calm routines.",
				LocalDate.of(2002, 11, 20)
		);
		seedUser(
				userRepository,
				"jay.santos@example.com",
				"Password123!",
				"Jay",
				"Santos",
				"https://i.pravatar.cc/300?img=24",
				"https://picsum.photos/seed/jay-cover/1200/400",
				"Fitness habits and productivity experiments.",
				LocalDate.of(1999, 9, 9)
		);
		seedUser(
				userRepository,
				"mia.reyes@example.com",
				"Password123!",
				"Mia",
				"Reyes",
				"https://i.pravatar.cc/300?img=47",
				"https://picsum.photos/seed/mia-cover/1200/400",
				"Creative journaling and self-reflection.",
				LocalDate.of(2001, 1, 28)
		);
	}

	private void seedUser(
			UserRepository userRepository,
			String email,
			String password,
			String firstName,
			String lastName,
			String avatarUrl,
			String coverImageUrl,
			String bio,
			LocalDate birthDate
	) {
		if (userRepository.existsByEmailIgnoreCase(email)) return;
		User u = new User(email, password, firstName, lastName);
		u.setAvatarUrl(avatarUrl);
		u.setCoverImageUrl(coverImageUrl);
		u.setBio(bio);
		u.setBirthDate(birthDate);
		userRepository.save(u);
	}

	private void seedPosts(UserRepository userRepository, PostRepository postRepository) {
		seedPostsForUser(userRepository, postRepository, "karla.manalo@example.com", List.of(
				"Today I’m grateful for small wins.",
				"Morning journaling keeps me grounded.",
				"One kind message can change a day.",
				"Progress over perfection, always.",
				"Rest is part of the routine."
		));
		seedPostsForUser(userRepository, postRepository, "ben.cruz@example.com", List.of(
				"Control what you can, accept what you can’t.",
				"Discomfort is the price of growth.",
				"Read, reflect, repeat.",
				"Be strict with your goals, gentle with yourself.",
				"Do the right thing, even when unnoticed."
		));
		seedPostsForUser(userRepository, postRepository, "lena.park@example.com", List.of(
				"Breathe in calm, breathe out tension.",
				"Slow mornings feel like a reset button.",
				"Mindfulness starts with noticing.",
				"Less noise, more presence.",
				"Today I choose peace over pressure."
		));
		seedPostsForUser(userRepository, postRepository, "jay.santos@example.com", List.of(
				"Workout done. Energy up.",
				"Discipline beats motivation most days.",
				"Small habits compound fast.",
				"One focused hour is worth three distracted ones.",
				"Consistency is my superpower."
		));
		seedPostsForUser(userRepository, postRepository, "mia.reyes@example.com", List.of(
				"I’m learning to trust my own voice.",
				"Writing clears the fog in my head.",
				"Today’s mood: curious and hopeful.",
				"Creativity needs space, not stress.",
				"Being honest with myself feels freeing."
		));
	}

	private void seedPostsForUser(UserRepository userRepository, PostRepository postRepository, String email, List<String> contents) {
		Optional<User> uOpt = userRepository.findByEmailIgnoreCase(email);
		if (uOpt.isEmpty()) return;
		User u = uOpt.get();
		Long userId = u.getId();
		if (userId == null) return;
		if (postRepository.countByUserId(userId) >= contents.size()) return;

		for (String content : contents) {
			postRepository.save(new Post(u, content));
		}
	}

	private void seedTrendingTopics(TrendingTopicRepository trendingTopicRepository) {
		seedTrendingTopic(trendingTopicRepository, 1, "Morning Routine", "142 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 2, "Gratitude Journal", "98 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 3, "Mindfulness", "76 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 4, "Self Reflection", "61 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 5, "Deep Work", "55 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 6, "Digital Detox", "49 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 7, "Sleep Hygiene", "44 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 8, "Fitness Habits", "39 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 9, "Goal Setting", "33 thoughts today");
		seedTrendingTopic(trendingTopicRepository, 10, "Anxiety Management", "28 thoughts today");
	}

	private void seedTrendingTopic(TrendingTopicRepository trendingTopicRepository, int rank, String name, String subtitle) {
		if (trendingTopicRepository.existsByNameIgnoreCase(name)) return;
		trendingTopicRepository.save(new TrendingTopic(name, subtitle, rank));
	}

	private static void loadLocalEnvIfPresent() {
		List<Path> candidates = List.of(
				Paths.get(".env.local"),
				Paths.get("backend", ".env.local")
		);

		for (Path path : candidates) {
			if (!Files.exists(path)) {
				continue;
			}

			try {
				for (String line : Files.readAllLines(path)) {
					String trimmed = line.trim();
					if (trimmed.isEmpty() || trimmed.startsWith("#")) {
						continue;
					}

					int equalsIndex = trimmed.indexOf('=');
					if (equalsIndex <= 0) {
						continue;
					}

					String key = trimmed.substring(0, equalsIndex).trim();
					String value = trimmed.substring(equalsIndex + 1).trim();
					value = stripOptionalQuotes(value);

					if (key.isEmpty()) {
						continue;
					}

					if (System.getProperty(key) != null) {
						continue;
					}
					if (System.getenv(key) != null) {
						continue;
					}

					System.setProperty(key, value);
				}
			} catch (IOException ignored) {
			}

			break;
		}
	}

	private static String stripOptionalQuotes(String value) {
		if (value == null || value.length() < 2) {
			return value;
		}
		char first = value.charAt(0);
		char last = value.charAt(value.length() - 1);
		if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
			return value.substring(1, value.length() - 1);
		}
		return value;
	}

}
