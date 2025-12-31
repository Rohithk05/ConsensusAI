# Changelog

## [1.1.0] - 2025-12-22

### ✨ Highlights
This release transforms ConsensusAI into a more enterprise-ready decision support platform with enhanced comparison capabilities and executive reporting.

### 🚀 New Features
- **Scenario Comparison Mode**: 
  - Users can now clone a primary decision scenario and run a "Challenger" scenario side-by-side.
  - Split-view workspace allows for direct comparison of negotiation velocity and outcomes.
- **Decision Confidence Score**: 
  - Real-time confidence metric (0-100) based on consensus rounds, risk profile, and quality index.
  - Displayed prominently in the negotiation workspace.
- **Executive Decision Summary**: 
  - Automatically generated one-page report.
  - Includes strategic rationale, key trade-offs made, and outstanding risk assessments.
  - Copy-to-clipboard functionality for easy reporting.

### 🎨 UX/UI Improvements
- **Wizard-Style Scenario Builder**: 
  - Refactored the single-page form into a guided 3-step wizard (Overview -> Constraints -> Priorities).
  - Reduced cognitive load and improved progress visibility.
- **Dashboard Layout**: 
  - Cleaner header with clear "End Session" and "Compare" actions.
  - Improved spacing and typography using the "Inter" and "Outfit" premium font stack.
- **Visual Polish**: 
  - Added confidence score indicators (Green/Yellow/Red).
  - Smoother transitions between tabs and modes.

### 🔧 Technical Updates
- Updated `ConsensusEngine` to support confidence scoring logic.
- Refactored `DashboardPage` to support multi-scenario state management.
- Enhanced TS interfaces to support scenario cloning.
