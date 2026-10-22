# AI Never Sleep

AI Never Sleep is an AI intelligence aggregation platform designed to collect, organize, and surface updates from across the artificial intelligence ecosystem. It brings AI news, research papers, models, developer tools, and emerging technologies into one centralized platform, reducing the need to manually monitor multiple sources.

## Architecture

```text
AI Data Sources
  ├─ GDELT
  ├─ RSS Feeds
  ├─ arXiv Research Papers
  └─ Hugging Face
        |
        v
Data Collection Pipeline
        |
        ├─ Fetch and Normalize
        ├─ Validate and Deduplicate
        ├─ Categorize and Process
        └─ Handle Source Failures
                |
                v
          SQLite Database
                |
                v
          Backend API
                |
                v
          Web Dashboard
```

The platform uses a centralized collection pipeline to gather information from multiple sources and normalize incoming records into a consistent structure. SQLite provides persistent storage for collected content. Optional paid API integrations can be configured when credentials are available, while supported free sources remain usable without paid API keys.

## Stack

- React.js, JavaScript, CSS
- Node.js and Express.js
- SQLite
- GDELT, RSS feeds, arXiv, Hugging Face
- REST APIs
- dotenv for environment configuration
- npm and Git

## Core Features

- AI news aggregation from multiple supported sources.
- Research discovery through arXiv and related research feeds.
- AI model and ecosystem updates from supported sources, including Hugging Face.
- Content normalization and duplicate detection.
- Category-based organization of collected information.
- Search and filtering across available content.
- Persistent storage using SQLite.
- Configurable data collection and refresh intervals.
- Graceful handling of unavailable sources and failed requests.
- Optional integrations that can be disabled when API credentials are absent.

## Platform Sections

| Section | Description |
| --- | --- |
| News | AI industry developments and announcements |
| Research | Research papers and technical publications |
| Models | Model releases and updates from supported sources |
| Tools | AI applications and developer tools |
| Companies | AI company and industry developments, where available |
| Agents | AI agent developments and frameworks, where available |

The available sections depend on the data sources and integrations implemented in the application.

## Data Collection

The collection pipeline is responsible for retrieving and processing information from configured sources.

1. Fetch records from APIs, RSS feeds, and research repositories.
2. Normalize titles, descriptions, URLs, publication dates, and source metadata.
3. Validate incoming records and handle incomplete data.
4. Detect duplicate content to reduce repeated entries.
5. Categorize and store processed records in SQLite.
6. Expose collected information to the application through the backend API.
7. Handle source failures independently so one unavailable integration does not necessarily interrupt the entire pipeline.

Collection frequency and source availability depend on the configured implementation and the limits of each provider.

## Database

SQLite is used as the primary persistent database for collected information.

The database stores normalized content and associated metadata to support retrieval, filtering, duplicate detection, and application queries. Its lightweight setup makes it suitable for local development and a small-scale deployment.

## Configuration

External integrations are configured through environment variables. API credentials should remain on the server and must not be exposed through frontend environment variables or committed to version control.

Paid API integrations are optional where supported. When their credentials are absent, the corresponding integrations should remain inactive while available free-source integrations continue operating.

## Local Setup

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd ai-never-sleep
```

Replace `<YOUR_REPOSITORY_URL>` with the actual repository URL.

### 2. Install dependencies

```bash
npm install
```

If the frontend and backend have separate package manifests, install dependencies in the appropriate directories or use the configured workspace scripts.

### 3. Configure environment variables

Create a local `.env` file based on the project's environment-variable template.

```env
PORT=5000

# Optional integrations
GNEWS_API_KEY=
NEWSAPI_API_KEY=
```

Use only the variable names supported by the actual implementation. The example above is illustrative and should be adjusted to match the repository configuration.

Do not commit real API keys or other secrets.

### 4. Start the application

Use the scripts defined in the project's `package.json`. For example:

```bash
npm run dev
```

If the frontend and backend run as separate applications, start each using its corresponding development command.

## Reliability and Security

- Keep API credentials in server-side environment variables.
- Validate external data before persisting it.
- Handle rate limits, timeouts, malformed responses, and unavailable sources.
- Prevent duplicate records from unnecessarily cluttering the feed.
- Keep optional integrations disabled when their required credentials are missing.
- Preserve original source URLs for attribution and further reading.
- Exclude local environment files and sensitive credentials from version control.

## Development Commands

Use the commands supported by the repository's configured npm scripts.

```bash
npm run dev
npm run build
npm run start
```

The availability and behavior of these commands depend on the project's `package.json` configuration.

## Deployment

Deploy the frontend to a suitable static hosting platform and the backend to a Node.js-compatible hosting environment, if the application uses a separate client and server.

Before deployment:

- Configure production environment variables.
- Ensure SQLite storage is persistent in the selected hosting environment.
- Configure source API credentials where required.
- Verify that scheduled collection continues running in the deployment environment.
- Test duplicate detection, error handling, and data retrieval.
- Confirm that original source links and publication metadata are preserved.

SQLite persistence and background collection require particular attention on ephemeral hosting platforms, where local files or scheduled processes may not survive restarts.

## Current Scope

AI Never Sleep focuses on collecting, normalizing, organizing, and presenting AI-related information from supported external sources. The platform is designed to reduce fragmented information discovery and provide a single place to follow developments across AI news, research, models, and tools.

Optional integrations, additional categories, automated summaries, personalized feeds, and notification systems can be extended as the project evolves.

## Future Improvements

- Personalized content feeds and saved articles.
- Semantic search across collected information.
- Related-story clustering and improved duplicate detection.
- AI-assisted summaries and topic extraction.
- Configurable notifications for important developments.
- Source-health monitoring and collection analytics.
- Advanced filtering by topic, source, and publication date.

## Project Goal

Build a centralized AI intelligence platform that makes it easier for developers, students, researchers, and AI enthusiasts to discover relevant developments without manually monitoring numerous sources.

**AI Never Sleep — Stay informed about an ecosystem that never stops evolving.**
