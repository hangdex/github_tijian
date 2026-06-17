"""
GitHub API client for fetching repository data.
Supports public repositories via GitHub REST API v3.
"""

import re
from typing import Optional
from dataclasses import dataclass, field


@dataclass
class RepoInfo:
    """Structured repository information."""
    owner: str = ""
    name: str = ""
    full_name: str = ""
    description: str = ""
    url: str = ""
    stars: int = 0
    forks: int = 0
    open_issues: int = 0
    watchers: int = 0
    language: str = ""
    topics: list = field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""
    pushed_at: str = ""
    license: str = ""
    default_branch: str = ""
    size_kb: int = 0
    has_wiki: bool = False
    has_issues: bool = False
    has_projects: bool = False
    has_discussions: bool = False
    archived: bool = False
    is_template: bool = False
    homepage: str = ""
    language_distribution: dict = field(default_factory=dict)
    contributors_count: int = 0
    releases_count: int = 0
    commit_activity: list = field(default_factory=list)


def parse_github_url(url: str) -> Optional[tuple[str, str]]:
    """Parse a GitHub URL and extract owner/repo.

    Supports:
    - https://github.com/owner/repo
    - https://github.com/owner/repo.git
    - https://github.com/owner/repo/tree/branch/...
    - owner/repo
    """
    url = url.strip().rstrip("/")

    # Handle "owner/repo" shorthand
    short_match = re.match(r"^([\w.-]+)/([\w.-]+)$", url)
    if short_match:
        return short_match.group(1), short_match.group(2)

    # Handle full URLs
    match = re.match(
        r"https?://github\.com/([\w.-]+)/([\w.-]+?)(?:\.git)?(?:/.*)?$",
        url
    )
    if match:
        return match.group(1), match.group(2)

    return None


class GitHubAPIClient:
    """Async GitHub API client for fetching repository data."""

    BASE_URL = "https://api.github.com"

    def __init__(self, client):
        self.client = client  # httpx.AsyncClient

    async def get_repo(self, owner: str, repo: str) -> dict:
        """Fetch basic repository information."""
        url = f"{self.BASE_URL}/repos/{owner}/{repo}"
        resp = await self.client.get(url)
        resp.raise_for_status()
        return resp.json()

    async def get_languages(self, owner: str, repo: str) -> dict:
        """Fetch language distribution."""
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/languages"
        resp = await self.client.get(url)
        resp.raise_for_status()
        return resp.json()

    async def get_contributors(self, owner: str, repo: str) -> list:
        """Fetch contributors list."""
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/contributors?per_page=100"
        resp = await self.client.get(url)
        resp.raise_for_status()
        return resp.json()

    async def get_releases(self, owner: str, repo: str) -> list:
        """Fetch releases."""
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/releases?per_page=100"
        resp = await self.client.get(url)
        resp.raise_for_status()
        return resp.json()

    async def get_commit_activity(self, owner: str, repo: str) -> list:
        """Fetch commit activity (last year)."""
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/stats/commit_activity"
        resp = await self.client.get(url)
        # This endpoint may return 202 if data is being computed
        if resp.status_code == 202:
            return []
        resp.raise_for_status()
        return resp.json()

    async def get_readme(self, owner: str, repo: str) -> str:
        """Fetch README content."""
        url = f"{self.BASE_URL}/repos/{owner}/{repo}/readme"
        headers = {"Accept": "application/vnd.github.v3.raw"}
        resp = await self.client.get(url, headers=headers)
        if resp.status_code == 404:
            return ""
        resp.raise_for_status()
        return resp.text

    async def analyze_repo(self, url: str) -> RepoInfo:
        """Full repository analysis — fetch all relevant data."""
        parsed = parse_github_url(url)
        if not parsed:
            raise ValueError(f"Invalid GitHub URL: {url}")

        owner, repo = parsed

        # Fetch all data in parallel
        (
            repo_data,
            languages,
            contributors,
            releases,
            commit_activity,
            readme,
        ) = (
            await self.get_repo(owner, repo),
            await self.get_languages(owner, repo),
            await self.get_contributors(owner, repo),
            await self.get_releases(owner, repo),
            await self.get_commit_activity(owner, repo),
            await self.get_readme(owner, repo),
        )

        return RepoInfo(
            owner=owner,
            name=repo,
            full_name=repo_data.get("full_name", f"{owner}/{repo}"),
            description=repo_data.get("description") or "",
            url=repo_data.get("html_url", url),
            stars=repo_data.get("stargazers_count", 0),
            forks=repo_data.get("forks_count", 0),
            open_issues=repo_data.get("open_issues_count", 0),
            watchers=repo_data.get("subscribers_count", 0),
            language=repo_data.get("language") or "",
            topics=repo_data.get("topics", []),
            created_at=repo_data.get("created_at", ""),
            updated_at=repo_data.get("updated_at", ""),
            pushed_at=repo_data.get("pushed_at", ""),
            license=(repo_data.get("license") or {}).get("spdx_id", ""),
            default_branch=repo_data.get("default_branch", "main"),
            size_kb=repo_data.get("size", 0),
            has_wiki=repo_data.get("has_wiki", False),
            has_issues=repo_data.get("has_issues", False),
            has_projects=repo_data.get("has_projects", False),
            has_discussions=repo_data.get("has_discussions", False),
            archived=repo_data.get("archived", False),
            is_template=repo_data.get("is_template", False),
            homepage=repo_data.get("homepage") or "",
            language_distribution=languages,
            contributors_count=len(contributors),
            releases_count=len(releases),
            commit_activity=commit_activity,
        )
