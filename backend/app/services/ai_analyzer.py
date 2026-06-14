"""
Groq AI service for accessibility issue analysis and recommendations.
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("Groq package not installed. Using template-based explanations.")





def _build_prompt(issue: Dict[str, Any]) -> str:
    return f"""You are an expert web accessibility consultant specializing in WCAG 2.1 compliance.

Analyze this accessibility violation and provide:
1. A clear, developer-friendly explanation of why this is a problem and who it impacts
2. A specific, actionable recommendation to fix it
3. A code example showing the before (failing) and after (passing) states

Issue details:
- Rule: {issue.get('rawId', 'unknown')}
- Description: {issue.get('description', '')}
- Severity: {issue.get('severity', 'moderate')}
- WCAG Guideline: {issue.get('wcag', 'N/A')}
- Category: {issue.get('category', 'General')}
- Failing HTML element: {issue.get('element', 'N/A')}

Respond in JSON format with these exact keys:
{{
  "aiExplanation": "2-3 sentence explanation targeting developers, explaining the user impact",
  "recommendation": "Specific, actionable fix recommendation",
  "codeExample": "HTML/CSS code showing before and after fix"
}}"""


async def analyze_issue_with_ai(issue: Dict[str, Any], api_key: str, model: str = "llama-3.1-70b-versatile") -> Dict[str, str]:
    """Use Groq to analyze accessibility issue and generate recommendations."""
    
    if not GROQ_AVAILABLE or not api_key:
        return _get_template_response(issue)

    try:
        client = AsyncGroq(api_key=api_key)
        
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert web accessibility engineer. Always respond with valid JSON only, no markdown."
                },
                {
                    "role": "user",
                    "content": _build_prompt(issue)
                }
            ],
            max_tokens=600,
            temperature=0.3,
        )

        content = response.choices[0].message.content.strip()
        
        # Clean JSON from markdown if present
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        
        import json
        result = json.loads(content)
        return {
            "aiExplanation": result.get("aiExplanation", ""),
            "recommendation": result.get("recommendation", ""),
            "codeExample": result.get("codeExample", ""),
        }
        
    except Exception as e:
        logger.error(f"Groq AI analysis failed: {e}")
        return _get_template_response(issue)


def _get_template_response(issue: Dict[str, Any]) -> Dict[str, str]:
    """Return empty template when AI is unavailable."""
    return {
        "aiExplanation": "",
        "recommendation": "",
        "codeExample": "",
    }


async def generate_executive_summary(audit_data: Dict[str, Any], api_key: str, model: str) -> str:
    """Generate an AI executive summary for the audit."""
    if not GROQ_AVAILABLE or not api_key:
        return _get_template_summary(audit_data)

    try:
        client = AsyncGroq(api_key=api_key)
        
        prompt = f"""Write a concise executive summary for a web accessibility audit report.

Audit Data:
- URL: {audit_data.get('url')}
- Accessibility Score: {audit_data.get('score')}/100
- Critical Issues: {audit_data.get('critical_count', 0)}
- Serious Issues: {audit_data.get('serious_count', 0)}
- Moderate Issues: {audit_data.get('moderate_count', 0)}
- Passed Checks: {audit_data.get('passes_count', 0)}
- Pages Scanned: {audit_data.get('pages_crawled', 1)}

Write 2-3 paragraphs suitable for a non-technical executive audience. Include:
1. Overall accessibility posture assessment
2. Key risks and compliance implications
3. Top recommendations and expected impact"""

        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.5,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        return _get_template_summary(audit_data)


def _get_template_summary(audit_data: Dict[str, Any]) -> str:
    return ""
