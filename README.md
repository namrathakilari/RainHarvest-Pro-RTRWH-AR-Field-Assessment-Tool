#  RainHarvest Pro — RTRWH & AR Field Assessment Tool

A mobile-first web application for **on-spot assessment of Rooftop Rainwater Harvesting (RTRWH) potential and Artificial Recharge (AR) feasibility**. Built for field officers, urban planners, and citizens to instantly evaluate water harvesting potential from any building site.

---

##  Features
- 4-Step Assessment Wizard — Location → Building → Soil/Site → Results
- GPS Auto-detection — Automatically captures field coordinates
- Smart Rainfall Lookup — State-wise annual rainfall fallback data
- Real-time Calculations — Harvest potential, tank sizing, and recharge feasibility
- Monthly Chart — Visual breakdown of monthly harvest potential
- Recharge Recommendation — Suggests Recharge Well, Pit, or Percolation Trench based on soil and surplus
- PDF Report Export — One-click downloadable field report
- Zero backend dependency — runs entirely in the browser
- Mobile-first UI — optimized for field use on any device

---

##  Calculation Methodology
Based on CPHEEO and CGWB standards:

Annual Harvest Potential (L) = Roof Area (m²) × Annual Rainfall (mm) × Runoff Coefficient × 0.85

| Roof Type  | Runoff Coefficient |
|------------|--------------------|
| RCC / Flat | 0.85               |
| GI Sheet   | 0.90               |
| Tiles      | 0.80               |
| Asbestos   | 0.70               |
| Thatch     | 0.50               |

- Tank Size = max(Roof Area × 500, 5000) litres
- Water Demand = Occupants × 135 L/day × 365 (CPHEEO urban standard)
- Recharge Feasible = Surplus > 0 AND Soil is Sandy or Loamy

---

##  Tech Stack
- React 18 + TypeScript
- Tailwind CSS
- Chart.js
- jsPDF
- Lucide React Icons
- Framer Motion (motion/react)
- Vite

---

##  Getting Started
```bash
git clone https://github.com/yourusername/rainharvest-pro
cd rainharvest-pro
npm install
npm run dev
```

Open http://localhost:5173

---

##  Build for Production
```bash
npm run build
```

Then drag the `dist/` folder to Netlify to deploy instantly.

---

##  Future Scope
- IMD real-time rainfall API integration
- District-level GIS map of all assessments
- Multi-language support (Hindi, Telugu, Tamil)
- PWA with full offline support
- Google Sheets data persistence for bulk field surveys
