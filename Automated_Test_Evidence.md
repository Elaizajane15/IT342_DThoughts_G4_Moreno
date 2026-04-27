# Automated Test Evidence

This document contains logs and evidence from the automated tests run on the refactored Vertical Slice Architecture for the DThoughts project.

## 1. Backend (Spring Boot) Automated Tests
**Command Executed:** `mvn test`
**Result:** PASSED

```log
[INFO] Scanning for projects...
[INFO] 
[INFO] -------------------< com.dthoughts.g4:moreno >--------------------
[INFO] Building moreno 0.0.1-SNAPSHOT
[INFO]   from pom.xml
[INFO] --------------------------------[ jar ]---------------------------------
[INFO] 
...
2026-04-27T12:00:23.384+08:00  INFO 29612 --- [moreno] [           main] j.LocalContainerEntityManagerFactoryBean : Initialized JPA EntityManagerFactory for persistence unit 'default'
2026-04-27T12:00:27.340+08:00  INFO 29612 --- [moreno] [           main] c.d.g4.moreno.MorenoApplicationTests     : Started MorenoApplicationTests in 11.517 seconds (process running for 14.194)
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 14.42 s -- in com.dthoughts.g4.moreno.MorenoApplicationTests
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  25.146 s
[INFO] Finished at: 2026-04-27T12:00:30+08:00
```
*Note: Validates that the Spring Application Context successfully loads with all the new package configurations and JPA entity scans correctly resolving.*

## 2. Mobile (Android/Kotlin) Automated Tests
**Command Executed:** `./gradlew test`
**Result:** PASSED

```log
> Task :app:compileReleaseKotlin
w: file:///C:/Users/Elaiza%20Jane/Downloads/IT342_DThoughts_G4_Moreno/Mobile/app/src/main/java/com/example/dthoughts/post/CreatePostActivity.kt:69:17 Variable 'title' is never used

> Task :app:compileReleaseJavaWithJavac
> Task :app:processReleaseJavaRes
> Task :app:bundleReleaseClassesToCompileJar
> Task :app:bundleReleaseClassesToRuntimeJar
> Task :app:compileReleaseUnitTestKotlin
> Task :app:compileReleaseUnitTestJavaWithJavac NO-SOURCE
> Task :app:processReleaseUnitTestJavaRes
> Task :app:testReleaseUnitTest
> Task :app:test

BUILD SUCCESSFUL in 1m 21s
52 actionable tasks: 37 executed, 15 up-to-date
```
*Note: Validates that Android unit tests run cleanly and no package resolution errors occurred during the test suite build after moving to `auth/`, `post/`, `core/`, etc.*

## 3. Web (React) Automated Tests
**Command Executed:** `npm test`
**Result:** N/A (No tests defined in `package.json` for the current template).
The Web Application has been manually verified by executing `npm run build` which successfully bundled the components via Vite without any path alias (`@/`) resolution errors.
