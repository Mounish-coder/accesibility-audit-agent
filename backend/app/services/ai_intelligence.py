"""
AI Issue Intelligence Layer — Groq-powered clustering, severity, and remediation.
"""
import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# ── Severity weights for score impact ──────────────────────────────────────
SEVERITY_WEIGHTS = {"critical": 10, "high": 7, "medium": 3, "low": 1}

# ── Category colors / meta ──────────────────────────────────────────────────
CATEGORY_META = {
    "Images & Media":       {"color": "blue",   "icon": "Image",       "wcag": "1.1.1"},
    "Forms & Inputs":       {"color": "purple",  "icon": "FormInput",   "wcag": "1.3.1"},
    "Color & Contrast":     {"color": "yellow",  "icon": "Palette",     "wcag": "1.4.3"},
    "Keyboard & Focus":     {"color": "cyan",    "icon": "Keyboard",    "wcag": "2.1.1"},
    "Page Structure":       {"color": "green",   "icon": "Layout",      "wcag": "1.3.2"},
    "Navigation & Links":   {"color": "orange",  "icon": "Navigation2", "wcag": "2.4.4"},
    "ARIA & Semantics":     {"color": "pink",    "icon": "Code2",       "wcag": "4.1.2"},
    "Language & Text":      {"color": "teal",    "icon": "Type",        "wcag": "3.1.1"},
    "Other":                {"color": "gray",    "icon": "AlertCircle", "wcag": "—"},
}


# ═══════════════════════════════════════════════════════════════════════════
# GROQ PROMPT BUILDERS
# ═══════════════════════════════════════════════════════════════════════════

def _cluster_prompt(issues: List[Dict]) -> str:
    issues_text = "\n".join(
        f"{i+1}. [{v.get('severity','moderate').upper()}] {v.get('description','')} "
        f"(rule: {v.get('rawId','')}, element: {v.get('element','')[:80]})"
        for i, v in enumerate(issues[:30])
    )
    return f"""You are a world-class web accessibility expert. 
Analyze these accessibility violations and cluster them into meaningful categories.

VIOLATIONS:
{issues_text}

Respond ONLY with valid JSON (no markdown, no explanation) in this exact structure:
{{
  "clusters": [
    {{
      "id": "cluster-1",
      "name": "Category Name",
      "severity": "critical|high|medium|low",
      "impact": "One sentence describing who is affected and how",
      "issueIndices": [0, 1, 2],
      "wcagGuideline": "WCAG X.X.X",
      "estimatedFixTime": "30 mins|2 hours|1 day",
      "priorityRank": 1
    }}
  ],
  "totalRiskScore": 67,
  "complianceLevel": "Non-compliant|Partially compliant|Mostly compliant|Compliant",
  "topPriority": "One sentence: what to fix first and why"
}}"""


def _explain_cluster_prompt(cluster_name: str, issues: List[Dict]) -> str:
    examples = "\n".join(
        f"- {v.get('description','')} | element: {v.get('element','')[:60]}"
        for v in issues[:5]
    )
    return f"""You are a web accessibility expert. Explain this cluster of accessibility issues clearly for a developer.

Cluster: "{cluster_name}"
Issues in this cluster:
{examples}

Respond ONLY with valid JSON:
{{
  "explanation": "2-3 sentence developer-friendly explanation of why these issues exist and who they harm",
  "userImpact": "Specific description of how real users with disabilities are affected",
  "recommendation": "Concise, actionable recommendation to fix the entire cluster",
  "codeExample": "HTML/CSS/JS showing the fix (before and after comments)",
  "effort": "low|medium|high",
  "tools": ["axe", "WAVE", "screen reader"]
}}"""


def _executive_summary_prompt(audit_data: Dict, clusters: List[Dict]) -> str:
    cluster_text = "\n".join(
        f"- {c['name']}: {c['severity'].upper()} severity, {len(c.get('issueIndices',[]))} issues"
        for c in clusters[:6]
    )
    return f"""Write a professional executive summary for a web accessibility audit report.

AUDIT DATA:
- URL: {audit_data.get('url')}
- Accessibility Score: {audit_data.get('score', 0)}/100
- Total Issues: {audit_data.get('total_issues', 0)}
- Critical Issues: {audit_data.get('critical', 0)}
- Risk Score: {audit_data.get('risk_score', 50)}/100
- Compliance: {audit_data.get('compliance', 'Unknown')}

ISSUE CLUSTERS:
{cluster_text}

Respond ONLY with valid JSON:
{{
  "headline": "One powerful headline summarizing the audit (max 12 words)",
  "summary": "3-sentence executive summary for non-technical stakeholders",
  "riskStatement": "1-sentence legal/business risk statement",
  "keyFindings": ["finding 1", "finding 2", "finding 3"],
  "quickWins": ["specific quick fix 1 (< 1 hour)", "quick fix 2", "quick fix 3"],
  "estimatedTotalFixTime": "X days / Y weeks",
  "projectedScoreAfterFix": 85,
  "complianceRoadmap": ["Step 1", "Step 2", "Step 3"]
}}"""


def _remediation_prompt(clusters: List[Dict]) -> str:
    cluster_text = "\n".join(
        f"{i+1}. {c['name']} [{c['severity'].upper()}] — {c.get('impact','')}"
        for i, c in enumerate(clusters[:6])
    )
    return f"""Create a prioritized remediation roadmap for these accessibility issue clusters.

CLUSTERS:
{cluster_text}

Respond ONLY with valid JSON:
{{
  "phases": [
    {{
      "phase": 1,
      "title": "Immediate Fixes (Week 1)",
      "description": "Focus description",
      "clusters": ["cluster names"],
      "expectedScoreGain": 15,
      "effort": "low|medium|high"
    }}
  ],
  "totalPhases": 3,
  "estimatedCompletion": "4-6 weeks",
  "expectedFinalScore": 88
}}"""


# ═══════════════════════════════════════════════════════════════════════════
# MOCK FALLBACK DATA
# ═══════════════════════════════════════════════════════════════════════════

def _mock_clusters(issues: List[Dict]) -> Dict:
    category_map = {}
    for i, issue in enumerate(issues):
        cat = issue.get("category", "Other")
        if cat not in category_map:
            category_map[cat] = []
        category_map[cat].append(i)

    severity_map = {"Images": "critical", "Forms": "critical", "Color": "high",
                    "Keyboard": "high", "Structure": "medium", "Navigation": "medium"}
    clusters = []
    for rank, (cat, indices) in enumerate(category_map.items(), 1):
        clusters.append({
            "id": f"cluster-{rank}",
            "name": _map_category_name(cat),
            "severity": severity_map.get(cat, "medium"),
            "impact": f"Affects users relying on assistive technologies for {cat.lower()} access.",
            "issueIndices": indices,
            "wcagGuideline": CATEGORY_META.get(_map_category_name(cat), CATEGORY_META["Other"])["wcag"],
            "estimatedFixTime": "2-4 hours",
            "priorityRank": rank,
        })
    return {
        "clusters": clusters,
        "totalRiskScore": 65,
        "complianceLevel": "Partially compliant",
        "topPriority": "Fix missing image alt text and form labels first — highest user impact with minimal effort.",
    }


def _map_category_name(raw: str) -> str:
    mapping = {
        "Images": "Images & Media", "Forms": "Forms & Inputs",
        "Color": "Color & Contrast", "Keyboard": "Keyboard & Focus",
        "Structure": "Page Structure", "Navigation": "Navigation & Links",
        "ARIA": "ARIA & Semantics", "Language": "Language & Text",
    }
    return mapping.get(raw, raw if raw in CATEGORY_META else "Other")


def _mock_cluster_explanation(cluster_name: str) -> Dict:
    return {
        "explanation": "",
        "userImpact": "",
        "recommendation": "",
        "codeExample": "",
        "effort": "",
        "tools": [],
    }


def _mock_executive_summary(audit_data: Dict, clusters: List[Dict]) -> Dict:
    score = audit_data.get("score", 0)
    if score >= 90:
        headline = "Excellent Accessibility Compliance"
        summary = "The website demonstrates a strong commitment to accessibility, with only minor issues detected."
        risk = "Low risk of accessibility-related legal action."
    elif score >= 70:
        headline = "Moderate Accessibility Compliance"
        summary = "The website is partially compliant but requires targeted improvements to meet WCAG standards."
        risk = "Moderate risk; some users may experience barriers."
    else:
        headline = "Critical Accessibility Action Required"
        summary = "Significant accessibility barriers detected that prevent users with disabilities from using the site."
        risk = "High risk of legal action and severe user exclusion."

    return {
        "headline": headline,
        "summary": summary,
        "riskStatement": risk,
        "keyFindings": [f"Detected {len(clusters)} primary issue clusters."] if clusters else ["No critical issues detected."],
        "quickWins": ["Add missing alt text to images", "Ensure proper contrast ratios", "Provide descriptive labels for forms"],
        "estimatedTotalFixTime": "2-4 weeks",
        "projectedScoreAfterFix": min(100, score + 20),
        "complianceRoadmap": [
            "Address critical navigational barriers",
            "Fix contrast and semantic HTML issues",
            "Conduct manual screen reader testing"
        ],
    }


def _mock_remediation(clusters: List[Dict]) -> Dict:
    return {
        "phases": [
            {
                "phase": 1,
                "title": "Immediate Fixes (Week 1)",
                "description": "Focus on high-impact, low-effort accessibility fixes.",
                "clusters": [c["name"] for c in clusters[:2]] if clusters else ["General structure"],
                "expectedScoreGain": 15,
                "effort": "medium"
            },
            {
                "phase": 2,
                "title": "Structural Improvements (Week 2-3)",
                "description": "Address complex semantic and navigational issues.",
                "clusters": [c["name"] for c in clusters[2:4]] if len(clusters) > 2 else ["Semantics"],
                "expectedScoreGain": 10,
                "effort": "high"
            }
        ],
        "totalPhases": 2,
        "estimatedCompletion": "3 weeks",
        "expectedFinalScore": 95,
    }


# ═══════════════════════════════════════════════════════════════════════════
# MAIN INTELLIGENCE ENGINE
# ═══════════════════════════════════════════════════════════════════════════

async def _call_groq(client, prompt: str, model: str) -> Optional[Dict]:
    try:
        resp = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a web accessibility expert. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1024,
            temperature=0.2,
        )
        content = resp.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content.strip())
    except Exception as e:
        logger.error(f"Groq call failed: {e}")
        return None


async def run_intelligence_analysis(
    issues: List[Dict],
    audit_data: Dict,
    api_key: str = "",
    model: str = "llama-3.1-70b-versatile",
) -> Dict:
    """
    Full AI intelligence pipeline:
    1. Cluster issues into categories
    2. Explain each cluster
    3. Generate executive summary
    4. Build remediation roadmap
    """
    use_ai = GROQ_AVAILABLE and bool(api_key)
    client = AsyncGroq(api_key=api_key) if use_ai else None

    # ── Step 1: Cluster ──────────────────────────────────────────────────
    cluster_data = None
    if use_ai:
        cluster_data = await _call_groq(client, _cluster_prompt(issues), model)
    if not cluster_data:
        cluster_data = _mock_clusters(issues)
    clusters = cluster_data.get("clusters", [])

    # ── Step 2: Explain each cluster ─────────────────────────────────────
    enriched_clusters = []
    for cluster in clusters:
        cluster_issues = [issues[i] for i in cluster.get("issueIndices", []) if i < len(issues)]
        explanation = None
        if use_ai:
            explanation = await _call_groq(client, _explain_cluster_prompt(cluster["name"], cluster_issues), model)
        if not explanation:
            explanation = _mock_cluster_explanation(cluster["name"])
        meta = CATEGORY_META.get(cluster["name"], CATEGORY_META["Other"])
        enriched_clusters.append({
            **cluster,
            "issues": cluster_issues,
            "color": meta["color"],
            "icon": meta["icon"],
            "explanation": explanation.get("explanation", ""),
            "userImpact": explanation.get("userImpact", ""),
            "recommendation": explanation.get("recommendation", ""),
            "codeExample": explanation.get("codeExample", ""),
            "effort": explanation.get("effort", "medium"),
            "tools": explanation.get("tools", []),
        })

    # ── Step 3: Executive summary ─────────────────────────────────────────
    summary_input = {
        **audit_data,
        "total_issues": len(issues),
        "risk_score": cluster_data.get("totalRiskScore", 65),
        "compliance": cluster_data.get("complianceLevel", "Partially compliant"),
    }
    exec_summary = None
    if use_ai:
        exec_summary = await _call_groq(client, _executive_summary_prompt(summary_input, clusters), model)
    if not exec_summary:
        exec_summary = _mock_executive_summary(summary_input, clusters)

    # ── Step 4: Remediation roadmap ────────────────────────────────────────
    roadmap = None
    if use_ai:
        roadmap = await _call_groq(client, _remediation_prompt(clusters), model)
    if not roadmap:
        roadmap = _mock_remediation(clusters)

    return {
        "powered_by_ai": use_ai,
        "clusters": enriched_clusters,
        "totalRiskScore": cluster_data.get("totalRiskScore", 65),
        "complianceLevel": cluster_data.get("complianceLevel", "Partially compliant"),
        "topPriority": cluster_data.get("topPriority", ""),
        "executiveSummary": exec_summary,
        "remediationRoadmap": roadmap,
        "totalClusters": len(enriched_clusters),
        "totalIssues": len(issues),
    }
