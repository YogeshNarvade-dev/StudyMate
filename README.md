# StudyMate

StudyMate is a student-powered learning library: students find and download shared material, contribute their own study resources, and request what is still missing.

## Technology

- Java 21, Spring Boot 3.4.5, Spring MVC and Spring Data JPA
- Spring Security with JWT authentication and BCrypt password hashing
- MySQL 8
- React 18 and Vite
- Maven and Docker Compose

## Current features

- Public resource discovery, search, details and file downloads
- Authenticated uploads with contributor ownership and owner/admin deletion
- PDFs, PowerPoint, Word and EPUB files, plus links to externally hosted videos
- Resource categories for PDFs, question papers, presentations, books, courses and practice material
- Student resource requests, community upvotes and admin-managed request statuses
- Personal bookmarks and one-to-five-star resource ratings
- A study assistant that finds answers in uploaded PDFs, PowerPoint, Word and EPUB resources and cites the source material
- Student registration/login and administrator endpoints
- MySQL persistence and local file storage; video files are not hosted by StudyMate

## Run with Docker Compose

From this folder:

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8080/api
- MySQL: localhost:3307

Files are stored in the `uploads` Docker volume. For any shared or production environment, replace the development database password and `JWT_SECRET` in `docker-compose.yml` with private values.

## Run locally

Requirements: JDK 21, Maven 3.9+, Node.js 20+, npm and MySQL 8.

Create the database:

```sql
CREATE DATABASE studymate;
```

Start the backend from `backend/`:

```bash
mvn spring-boot:run
```

The local defaults use `root` / `rootpass` and `localhost:3307`, matching the StudyMate datasource configured in the backend IDE project. If your MySQL server uses other credentials or a different port, override them with `DB_URL`, `DB_USERNAME` and `DB_PASSWORD`. Docker Compose exposes its MySQL service on host port 3307; the backend container reaches it internally at `mysql:3306`. Other settings can use `JWT_SECRET`, `UPLOAD_DIR` or `CORS_ORIGINS`.

### Study assistant

StudyMate extracts searchable text from uploaded study files and shows the matching passages as citations. Existing files are indexed the first time the assistant is used. External video links and image-only scans do not provide searchable document text.

The assistant works without an AI API key by returning the closest matching passages. To get concise, synthesized answers, set `OPENAI_API_KEY` for the backend. When configured, the assistant sends only the selected excerpts and recent chat turns to the configured model endpoint. Set `ASSISTANT_MODEL` (default `gpt-4o-mini`) or `ASSISTANT_API_URL` to use another compatible model service. Keep the API key on the backend; never put it in the frontend.

Start the frontend from `frontend/`:

```bash
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8080`.

## API overview

All endpoints are under `/api`.

### Authentication

- `POST /auth/register` — `{ "name", "email", "password" }`
- `POST /auth/login` — `{ "email", "password" }`

### Resources

- `POST /assistant/ask` — authenticated resource-grounded question with cited source excerpts
- `GET /resources?query=&course=&semester=&subject=&category=&type=` — public discovery
- `GET /resources/{id}` and `GET /resources/{id}/download` — public details and downloads
- `POST /resources` — authenticated multipart upload with `title`, `description`, `course`, `semester`, `subject`, `category`, `type`, and either `file` or `externalUrl` for `EXTERNAL_VIDEO`
- `GET /resources/my` and `GET /resources/bookmarks` — authenticated personal library
- `POST` / `DELETE /resources/{id}/bookmark` — save or remove a bookmark
- `PUT /resources/{id}/rating` — `{ "rating": 1..5 }`; `DELETE` removes your rating
- `DELETE /resources/{id}` — owner or administrator

Resource `type` values: `PDF`, `EXTERNAL_VIDEO`, `QUESTION_PAPER`, `PRESENTATION`, `BOOK`, `COURSE`, `PRACTICE_MATERIAL`.

### Resource requests

- `GET /resource-requests?query=` — public request board
- `POST /resource-requests` — authenticated request with `title`, `description`, `course`, `semester`, and `subject`
- `PUT` / `DELETE /resource-requests/{id}/upvote` — authenticated community vote
- `PATCH /resource-requests/{id}/status` — administrator only; status values are `OPEN`, `IN_PROGRESS`, `FULFILLED`, `CANCELLED`

### Administration

- `GET /admin/stats`
- `GET /admin/users`

Register a student account, then grant administrator access directly in MySQL when needed:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Log in again to receive a token with the updated role.

## Configuration and deployment notes

Settings are in `backend/src/main/resources/application.yml`. The schema currently uses Hibernate `ddl-auto: update` for this starter project. Before production, add managed schema migrations, move uploads to private object storage, enable HTTPS, replace development secrets, add malware scanning and rate limits, and set up account recovery and audit logging.
