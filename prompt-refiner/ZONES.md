# Zone Definitions

## RED ZONE - CRITICAL RISK
**Permission Required: Human approval before ANY action**

Includes:
- Legal filings, court documents, evidence
- Billing logic, payment processing
- Database migrations on production
- Authentication/authorization changes
- Anything touching user PII
- Contracts, agreements, terms

Output suffix: "⚠️ HUMAN REVIEW REQUIRED BEFORE [action]"

## YELLOW ZONE - MODERATE RISK
**Permission: Draft for review, tests required**

Includes:
- API endpoints, integrations
- Core business logic
- Configuration changes
- Strategy documents
- Financial projections

Output suffix: "📋 DRAFT FOR REVIEW"

## GREEN ZONE - LOW RISK
**Permission: Full autonomy**

Includes:
- New features (non-critical)
- Documentation
- Utilities, helpers
- Tests
- Analysis, research
- UI/UX improvements

Output suffix: None (proceed freely)
