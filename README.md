# DataProfiler Pro - Power Query Data Profiling & EDA Suite

A high-performance, 100% client-side web application inspired by Microsoft Power BI's **Power Query Editor** data profiling features, equipped with a comprehensive **Exploratory Data Analysis (EDA) Suite**.

No database or server required — works directly in any modern web browser and deploys effortlessly to **GitHub Pages**, Vercel, Netlify, or any static hosting provider.

---

## 🌟 Key Features

1. **Power Query-Style Data Profiling**:
   - **Column Quality**: Visual progress indicators for **Valid** (green), **Error** (red), and **Empty / Null** (gray) values.
   - **Column Distribution**: Real-time **Distinct** count, **Unique** count, and micro sparkline histograms.
   - **Column Profile Inspector**: Deep statistical drill-down (Mean, Median, StdDev, Zero counts for numeric fields; Min/Max/Avg length for text; Frequency distributions; 1-click clipboard copy).
   - **Scope Toggle**: Switch instantly between scanning the **First 1,000 rows** (instant preview) or the **Entire dataset**.

2. **Exploratory Data Analysis (EDA) Suite**:
   - **Dataset Health & Overview**: Total records, column types, completeness score, in-memory footprint.
   - **Pearson Correlation Heatmap**: Interactive matrix of numeric correlations with significance badges.
   - **Missing Data Topology**: Missingness distribution across all attributes and rows.
   - **Bivariate & Visual Chart Suite**:
     - Auto-detection: Scatter plot with trendline ($y = mx + b$) for numeric-numeric pairs.
     - Column & Bar Charts for categorical attributes (Sum, Mean, Count, Median, Max, Min).
     - **Axis Sorting**: Sort by Metric Value (Pareto) or Category Name (A-Z), in Descending or Ascending order.
     - Interactive click-to-inspect bar details.

3. **Universal Data Import**:
   - Local file upload: `.csv`, `.tsv`, `.xlsx`, `.xls`, `.json`.
   - Public Google Sheets URL parsing (`https://docs.google.com/spreadsheets/d/...`).
   - Sample datasets included (Superstore Sales, Customer Churn, Employee HR).

---

## 🚀 How to Publish to GitHub Pages

This repository is already configured with `base: './'`, cross-platform `404.html` SPA routing, and GitHub Actions CI/CD. You can publish using either **Method 1** (recommended) or **Method 2**.

### Method 1: Automated GitHub Actions (Recommended)

1. Push this repository to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of DataProfiler Pro"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

2. On GitHub, navigate to your repository:
   - Click **Settings** (bánh răng cài đặt).
   - In the left sidebar, click **Pages**.
   - Under **Build and deployment** > **Source**, choose **GitHub Actions**.

3. **That's it!** The workflow in `.github/workflows/deploy.yml` will automatically build the app and publish it. Your live site will be ready at:
   ```
   https://<your-username>.github.io/<your-repo-name>/
   ```

---

### Method 2: Manual CLI Deploy (`gh-pages`)

If you prefer deploying directly from your terminal:

1. Ensure your repository has a remote configured:
   ```bash
   git remote -v
   ```

2. Run the deploy command:
   ```bash
   npm run deploy
   ```
   *(This automatically runs `npm run build` and pushes the `dist` folder to the `gh-pages` branch).*

3. On GitHub, go to **Settings** > **Pages** and verify **Source** is set to **Deploy from a branch** (`gh-pages` / `root`).

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start local development server (port 3000)
npm run dev

# 3. Build for production (outputs to dist/)
npm run build

# 4. Preview production build locally
npm run preview
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 8 (with relative asset paths `base: './'`)
- **Styling**: Tailwind CSS v4 (Light & Dark theme support)
- **Data Engines**: PapaParse (CSV/TSV), SheetJS `xlsx` (Excel)
- **Icons**: Lucide React
- **Animations**: Motion
