"""
GitHub Repo Health Check — Backend API
FastAPI application with GitHub analysis and AI scoring.
"""

import os
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from github_api import GitHubAPIClient
from ai_scorer import AIScorer

# Load .env file for local development
load_dotenv()

app = FastAPI(title="GitHub Repo Health Check", version="1.0.0")

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys — set via environment variables
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")

scorer = AIScorer(api_key=DEEPSEEK_API_KEY)


class AnalyzeRequest(BaseModel):
    url: str


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze_repo(request: AnalyzeRequest):
    """Analyze a GitHub repository and return metrics + AI score."""
    url = request.url.strip()
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    gh_headers = {
        "User-Agent": "GitHub-Repo-Health-Check/1.0",
        "Accept": "application/vnd.github.v3+json",
    }
    if GITHUB_TOKEN:
        gh_headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    async with httpx.AsyncClient(
        headers=gh_headers,
        timeout=30.0,
        trust_env=False,
        follow_redirects=True,
    ) as client:
        gh_client = GitHubAPIClient(client)

        try:
            repo_info = await gh_client.analyze_repo(url)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise HTTPException(
                    status_code=404,
                    detail="Repository not found. Please check the URL.",
                )
            elif e.response.status_code == 403:
                raise HTTPException(
                    status_code=429,
                    detail="GitHub API rate limit exceeded. Please try again later.",
                )
            raise HTTPException(
                status_code=502,
                detail=f"GitHub API error: {e.response.status_code}",
            )
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to analyze repository: {str(e)}",
            )

    # AI scoring
    try:
        ai_score = await scorer.score(repo_info)
    except Exception as e:
        # If AI scoring fails, provide a fallback
        ai_score = {
            "overall_score": 70,
            "summary": f"Basic analysis for {repo_info.full_name}",
            "strengths": ["Project is publicly available on GitHub"],
            "weaknesses": ["AI analysis temporarily unavailable"],
            "scores": {
                "code_quality": 70,
                "community_health": 70,
                "documentation": 70,
                "maintenance": 70,
                "popularity": 70,
            },
            "verdict": "neutral",
        }

    # Build response with all repo data
    # Calculate language percentages
    total_bytes = sum(repo_info.language_distribution.values()) or 1
    languages = [
        {"name": lang, "bytes": bytes_count, "percentage": round(bytes_count / total_bytes * 100, 2)}
        for lang, bytes_count in sorted(
            repo_info.language_distribution.items(),
            key=lambda x: x[1],
            reverse=True,
        )
    ]

    # Process commit activity for weekly chart
    weekly_commits = []
    for week in repo_info.commit_activity:
        weekly_commits.append({
            "week": week.get("week", 0),
            "total": week.get("total", 0),
            "days": week.get("days", [0] * 7),
        })

    return {
        "repo": {
            "owner": repo_info.owner,
            "name": repo_info.name,
            "full_name": repo_info.full_name,
            "description": repo_info.description,
            "url": repo_info.url,
            "stars": repo_info.stars,
            "forks": repo_info.forks,
            "open_issues": repo_info.open_issues,
            "watchers": repo_info.watchers,
            "language": repo_info.language,
            "topics": repo_info.topics,
            "created_at": repo_info.created_at,
            "updated_at": repo_info.updated_at,
            "pushed_at": repo_info.pushed_at,
            "license": repo_info.license,
            "default_branch": repo_info.default_branch,
            "size_kb": repo_info.size_kb,
            "has_wiki": repo_info.has_wiki,
            "has_issues": repo_info.has_issues,
            "has_projects": repo_info.has_projects,
            "has_discussions": repo_info.has_discussions,
            "archived": repo_info.archived,
            "homepage": repo_info.homepage,
            "contributors_count": repo_info.contributors_count,
            "releases_count": repo_info.releases_count,
        },
        "languages": languages,
        "commit_activity": weekly_commits,
        "ai_score": ai_score,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
