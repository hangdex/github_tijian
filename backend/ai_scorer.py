"""
AI-powered repository scoring using DeepSeek API.
"""

import json
from openai import AsyncOpenAI


SCORING_PROMPT = """You are an expert code reviewer and project evaluator. Analyze the following GitHub repository information and provide a comprehensive quality score.

Repository Details:
- Name: {full_name}
- Description: {description}
- Stars: {stars}
- Forks: {forks}
- Open Issues: {open_issues}
- Language: {language}
- Topics: {topics}
- License: {license}
- Created: {created_at}
- Last Updated: {updated_at}
- Releases: {releases_count}
- Contributors: {contributors_count}
- Languages: {languages}

Please evaluate this project on the following dimensions (each scored 0-100):

1. **Code Quality** - Based on project structure, language choice, and description quality
2. **Community Health** - Based on contributors, issues, and activity
3. **Documentation** - Based on description completeness, license presence, readme quality
4. **Maintenance** - Based on update frequency, release cadence, activity level
5. **Popularity** - Based on stars, forks, and community engagement

Return ONLY a valid JSON object in this exact format (no markdown, no extra text):
{{
  "overall_score": 85,
  "summary": "A concise one-sentence evaluation of the project",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "scores": {{
    "code_quality": 80,
    "community_health": 85,
    "documentation": 75,
    "maintenance": 90,
    "popularity": 88
  }},
  "verdict": "recommended"
}}

Choose verdict from: "highly-recommended", "recommended", "neutral", "caution"
"""


class AIScorer:
    """AI-powered project scorer using DeepSeek."""

    def __init__(self, api_key: str, client: AsyncOpenAI = None):
        self.api_key = api_key
        self._client = client

    @property
    def client(self):
        if self._client is None:
            self._client = AsyncOpenAI(
                api_key=self.api_key,
                base_url="https://api.deepseek.com",
            )
        return self._client

    async def score(self, repo_info) -> dict:
        """Score a repository using AI analysis."""

        # Prepare language distribution string
        total_bytes = sum(repo_info.language_distribution.values()) or 1
        lang_str = ", ".join(
            f"{lang}: {bytes_count / total_bytes * 100:.1f}%"
            for lang, bytes_count in sorted(
                repo_info.language_distribution.items(),
                key=lambda x: x[1],
                reverse=True,
            )[:5]
        )

        prompt = SCORING_PROMPT.format(
            full_name=repo_info.full_name,
            description=repo_info.description or "No description",
            stars=repo_info.stars,
            forks=repo_info.forks,
            open_issues=repo_info.open_issues,
            language=repo_info.language or "Unknown",
            topics=", ".join(repo_info.topics[:10]) if repo_info.topics else "None",
            license=repo_info.license or "No license",
            created_at=repo_info.created_at,
            updated_at=repo_info.updated_at,
            releases_count=repo_info.releases_count,
            contributors_count=repo_info.contributors_count,
            languages=lang_str or "No language data",
        )

        response = await self.client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a code review expert. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=1000,
        )

        content = response.choices[0].message.content.strip()

        # Clean up markdown code fences if present
        if content.startswith("```"):
            lines = content.split("\n")
            # Remove first and last line (fences)
            content = "\n".join(lines[1:-1]).strip()

        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            # Try to extract JSON from the response
            import re
            match = re.search(r"\{[\s\S]*\}", content)
            if match:
                result = json.loads(match.group())
            else:
                # Fallback
                return {
                    "overall_score": 70,
                    "summary": f"AI analysis completed for {repo_info.full_name}",
                    "strengths": ["Project is publicly available on GitHub"],
                    "weaknesses": ["Unable to parse detailed AI analysis"],
                    "scores": {
                        "code_quality": 70,
                        "community_health": 70,
                        "documentation": 70,
                        "maintenance": 70,
                        "popularity": 70,
                    },
                    "verdict": "neutral",
                }

        return result
