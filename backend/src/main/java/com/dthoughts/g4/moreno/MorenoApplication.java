package com.dthoughts.g4.moreno;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class MorenoApplication {

	public static void main(String[] args) {
		loadLocalEnvIfPresent();
		SpringApplication.run(MorenoApplication.class, args);
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
