# CSS Cleanup Report

Generated: 2026-05-01T02:02:09.062Z

## Recommended cleanup strategy

Do not bulk-delete CSS classes automatically.

Recommended order:

```text
1. Remove exact duplicate blocks.
2. Remove duplicate declarations inside same block.
3. Remove empty CSS blocks.
4. Review unused class candidates manually.
5. Only then extract small isolated CSS components.
```

## CSS file sizes

```text
> toddum2@1.0.0 check:sizes
> node scripts/check-large-files.mjs

Largest project files:

 3683 lines |   61.8 KB | css/main.css
  397 lines |    7.5 KB | css/table.css
  342 lines |    4.8 KB | css/mobile.css
  237 lines |    5.2 KB | js/settings/settings-events.js
  216 lines |    5.1 KB | js/settings/settings-layout-render.js
  189 lines |    4.6 KB | js/analytics/analytics-sections-render.js
  160 lines |    2.4 KB | css/modal.css
  156 lines |    3.4 KB | js/levering/levering-table-render.js
  142 lines |    4.3 KB | js/app/state-api.js
  141 lines |    3.1 KB | js/logs/log-render.js
  138 lines |    2.5 KB | js/logs/log-data.js
  130 lines |    3.1 KB | js/settings/settings-customers-render.js
  124 lines |    2.7 KB | js/table/context-menu.js
  115 lines |    2.7 KB | js/products/packaging-normalize-utils.js
  111 lines |    2.5 KB | js/analytics/analytics-stats-utils.js
  110 lines |    2.8 KB | js/modal/product-modal-events.js
  109 lines |    2.4 KB | js/customers/customer-utils.js
  102 lines |    2.1 KB | js/week/week.js
  101 lines |    1.5 KB | js/orders/order-state-utils.js
  101 lines |    2.2 KB | js/table/table-cell-render.js
  100 lines |    2.3 KB | js/modal/product-modal-render.js
   99 lines |    2.6 KB | js/products/product-packaging-actions.js
   96 lines |    2.6 KB | js/rapport/rapport-data.js
   90 lines |    2.4 KB | js/levering/levering-data.js
   89 lines |    1.9 KB | js/modal/product-modal-data.js
```

## CSS audit

```text
> toddum2@1.0.0 check:css
> node scripts/check-css-audit.mjs


CSS group summary:

  316 declarations |   701 est. lines | settings
  298 declarations |   796 est. lines | layout-base
  256 declarations |   599 est. lines | levering
  252 declarations |   570 est. lines | rapport
  243 declarations |   492 est. lines | buttons-forms
  175 declarations |   389 est. lines | analytics
  149 declarations |   391 est. lines | table
   82 declarations |   165 est. lines | tabs
   66 declarations |   138 est. lines | modal
   48 declarations |   140 est. lines | logg

Best extraction candidates from css/main.css:


settings: 301 declarations in css/main.css
  - css/main.css:101 |   3 decl | .settings-grid
  - css/main.css:107 |   4 decl | .settings-card
  - css/main.css:114 |   1 decl | .settings-card h3
  - css/main.css:118 |   3 decl | .settings-form
  - css/main.css:124 |   5 decl | .settings-form input
  - css/main.css:132 |   5 decl | .settings-form button,
.settings-item button
  - css/main.css:141 |   1 decl | .settings-form button:hover,
.settings-item button:hover
  - css/main.css:146 |   3 decl | .settings-list
  - css/main.css:152 |   8 decl | .settings-item
  - css/main.css:163 |   1 decl | .settings-item span
  - css/main.css:167 |   1 decl | .settings-item button
  - css/main.css:176 |   1 decl | .settings-grid

rapport: 238 declarations in css/main.css
  - css/main.css:502 |   4 decl | .rapport-header
  - css/main.css:509 |   1 decl | .rapport-header h2
  - css/main.css:513 |   4 decl | .rapport-summary-grid
  - css/main.css:520 |   4 decl | .rapport-card
  - css/main.css:527 |   4 decl | .rapport-card span
  - css/main.css:534 |   1 decl | .rapport-card strong
  - css/main.css:538 |   5 decl | .rapport-section
  - css/main.css:546 |   1 decl | .rapport-section h3
  - css/main.css:550 |   3 decl | .rapport-products
  - css/main.css:556 |   4 decl | .rapport-product-card
  - css/main.css:563 |   5 decl | .rapport-product-header
  - css/main.css:571 |   2 decl | .rapport-product-header h4

layout-base: 223 declarations in css/main.css
  - css/main.css:1 |   1 decl | *
  - css/main.css:3 |  11 decl | :root
  - css/main.css:17 |   4 decl | body
  - css/main.css:24 |   1 decl | .app
  - css/main.css:28 |   1 decl | .app-header
  - css/main.css:32 |   3 decl | .app-header h1
  - css/main.css:114 |   1 decl | .settings-card h3
  - css/main.css:173 |   1 decl | .app
  - css/main.css:228 |   1 decl | .analytics-section h3
  - css/main.css:267 |  10 decl | /* ===== DARK THEME ===== */
html[data-theme='dark']
  - css/main.css:281 |   2 decl | /* фон */
html[data-theme='dark'] body
  - css/main.css:287 |   2 decl | /* картки */
html[data-theme='dark'] .tab-panel,
html[data-theme='dark'] .settings-card,
html[data-theme='dark'] .analy…

levering: 220 declarations in css/main.css
  - css/main.css:1755 |   3 decl | /* ===== LEVERING ===== */

.levering-panel
  - css/main.css:1763 |   8 decl | .levering-hero
  - css/main.css:1774 |   2 decl | .levering-hero h2
  - css/main.css:1779 |   3 decl | .levering-hero p
  - css/main.css:1785 |   6 decl | .levering-summary
  - css/main.css:1794 |   4 decl | .levering-summary span
  - css/main.css:1801 |   1 decl | .levering-summary strong
  - css/main.css:1805 |   3 decl | .levering-days
  - css/main.css:1811 |   4 decl | .levering-day-card
  - css/main.css:1818 |   5 decl | .levering-day-header
  - css/main.css:1826 |   2 decl | .levering-day-header h3
  - css/main.css:1831 |   2 decl | .levering-day-header span

analytics: 174 declarations in css/main.css
  - css/main.css:185 |   2 decl | .analytics-week
  - css/main.css:190 |   4 decl | .analytics-grid
  - css/main.css:197 |   4 decl | .analytics-card
  - css/main.css:204 |   3 decl | .analytics-card strong
  - css/main.css:210 |   2 decl | .analytics-label
  - css/main.css:215 |   3 decl | .analytics-sections
  - css/main.css:221 |   4 decl | .analytics-section
  - css/main.css:228 |   1 decl | .analytics-section h3
  - css/main.css:232 |   3 decl | .analytics-list
  - css/main.css:238 |   7 decl | .analytics-row
  - css/main.css:248 |   1 decl | .analytics-row span
  - css/main.css:254 |   1 decl | .analytics-grid

buttons-forms: 146 declarations in css/main.css
  - css/main.css:124 |   5 decl | .settings-form input
  - css/main.css:132 |   5 decl | .settings-form button,
.settings-item button
  - css/main.css:141 |   1 decl | .settings-form button:hover,
.settings-item button:hover
  - css/main.css:167 |   1 decl | .settings-item button
  - css/main.css:340 |   1 decl | html[data-theme='dark'] .context-menu button:hover
  - css/main.css:344 |   3 decl | /* inputs */
html[data-theme='dark'] input
  - css/main.css:351 |   6 decl | /* toggle button */
.theme-toggle
  - css/main.css:374 |   3 decl | html[data-theme='dark'] .settings-form button,
html[data-theme='dark'] .settings-item button,
html[data-theme='dark'] .…
  - css/main.css:383 |   1 decl | html[data-theme='dark'] .settings-form button:hover,
html[data-theme='dark'] .settings-item button:hover,
html[data-the…
  - css/main.css:398 |   2 decl | html[data-theme='dark'] .remove-row-btn,
html[data-theme='dark'] .secondary-btn
  - css/main.css:404 |   2 decl | html[data-theme='dark'] .primary-btn
  - css/main.css:452 |   7 decl | .settings-form select

tabs: 59 declarations in css/main.css
  - css/main.css:38 |   3 decl | .tabs
  - css/main.css:64 |   5 decl | .tab-panel
  - css/main.css:72 |   4 decl | .top-bar
  - css/main.css:287 |   2 decl | /* картки */
html[data-theme='dark'] .tab-panel,
html[data-theme='dark'] .settings-card,
html[data-theme='dark'] .analy…
  - css/main.css:662 |   1 decl | .tabs
  - css/main.css:2072 |   5 decl | /* ===== WEEK NAVIGATION BUTTONS ===== */

.top-bar
  - css/main.css:2152 |   3 decl | .top-bar
  - css/main.css:2468 |   5 decl | /* ===== ACTIVE TAB HIGHLIGHT ===== */

.tabs .tab.active
  - css/main.css:2478 |   7 decl | .tabs .tab.active::after
  - css/main.css:2488 |   2 decl | .tabs .tab
  - css/main.css:2497 |   1 decl | .tabs .tab:hover
  - css/main.css:2501 |   3 decl | /* ===== TABS ROW WITH THEME BUTTON ===== */

.tabs-row

logg: 10 declarations in css/main.css
  - css/main.css:670 |   6 decl | /* moved to css/logg.css: /* ===== LOGG ===== */
.logg-header */

/* moved to css/logg.css: .logg-header h2 */

/* move…
  - css/main.css:716 |   1 decl | .logg-header
  - css/main.css:719 |   1 decl | .logg-item-main
  - css/main.css:723 |   1 decl | .logg-meta
  - css/main.css:727 |   1 decl | .logg-details

table: 8 declarations in css/main.css
  - css/main.css:306 |   1 decl | /* таблиця */
html[data-theme='dark'] .main-table
  - css/main.css:311 |   1 decl | html[data-theme='dark'] .main-table th,
html[data-theme='dark'] .main-table td
  - css/main.css:316 |   1 decl | html[data-theme='dark'] .main-table thead th
  - css/main.css:320 |   1 decl | html[data-theme='dark'] .customer-cell
  - css/main.css:324 |   1 decl | /* hover */
html[data-theme='dark'] .editable-cell:hover
  - css/main.css:365 |   3 decl | /* ===== DARK THEME FIXES ===== */
html[data-theme='dark'] .settings-item,
html[data-theme='dark'] .analytics-row,
html…

modal: 1 declarations in css/main.css
  - css/main.css:329 |   1 decl | /* modal */
html[data-theme='dark'] .modal-content

Largest ungrouped blocks in css/main.css:

css/main.css:2082 |  13 decl | .week-btn
css/main.css:2115 |  12 decl | .week-label
css/main.css:1986 |  11 decl | .log-page-btn
css/main.css:2026 |  11 decl | .log-page-indicator
css/main.css:1940 |   9 decl | .move-customer-btn
css/main.css:2913 |   9 decl | .rr-total-card
css/main.css:2596 |   8 decl | .move-product-btn
css/main.css:44 |   7 decl | .tab
css/main.css:777 |   7 decl | .detail-log-badge
css/main.css:1044 |   7 decl | .pro-log-table th
css/main.css:1080 |   7 decl | .pro-log-badge
css/main.css:903 |   6 decl | .minimal-danger-btn
css/main.css:2003 |   6 decl | .log-page-btn span
css/main.css:3091 |   6 decl | .rr-empty-box
css/main.css:3189 |   6 decl | .rr-total-card
css/main.css:79 |   5 decl | .week-btn
css/main.css:758 |   5 decl | .detail-log-card-top
css/main.css:843 |   5 decl | .detail-log-note
css/main.css:932 |   5 decl | .minimal-log-top
css/main.css:957 |   5 decl | .minimal-log-change
css/main.css:1035 |   5 decl | .pro-log-table th,
.pro-log-table td
css/main.css:2889 |   5 decl | .rr-title-card
css/main.css:2978 |   5 decl | .rr-card-head
css/main.css:751 |   4 decl | .detail-log-card
css/main.css:787 |   4 decl | .detail-log-context
```

## CSS group audit

```text
> toddum2@1.0.0 check:css:groups
> node scripts/check-css-groups.mjs
```

## Potentially unused CSS classes

```text
> toddum2@1.0.0 check:css:unused
> node scripts/check-unused-css-classes.mjs


Potentially unused CSS classes:

css/logg.css:16  .logg-list
css/logg.css:22  .logg-item
css/logg.css:29  .logg-item-main
css/logg.css:36  .logg-action
css/logg.css:40  .logg-meta
css/logg.css:46  .logg-details
css/main.css:30  .app-header
css/main.css:99  .muted-text
css/main.css:103  .settings-grid
css/main.css:109  .settings-card
css/main.css:135  .settings-item
css/main.css:148  .settings-list
css/main.css:187  .analytics-week
css/main.css:192  .analytics-grid
css/main.css:212  .analytics-label
css/main.css:234  .analytics-list
css/main.css:240  .analytics-row
css/main.css:433  .idle
css/main.css:450  .fixed-item
css/main.css:464  .fixed-label
css/main.css:475  .packaging-add-form
css/main.css:482  .packaging-item-main
css/main.css:488  .packaging-item-sub
css/main.css:515  .rapport-summary-grid
css/main.css:540  .rapport-section
css/main.css:552  .rapport-products
css/main.css:558  .rapport-product-card
css/main.css:565  .rapport-product-header
css/main.css:578  .rapport-package-list
css/main.css:584  .rapport-package-row
css/main.css:594  .rapport-detail-scroll
css/main.css:600  .rapport-detail-table
css/main.css:676  .logg-list
css/main.css:678  .logg-item
css/main.css:680  .logg-item-main
css/main.css:682  .logg-action
css/main.css:684  .logg-meta
css/main.css:686  .logg-details
css/main.css:695  .danger-btn
css/main.css:735  .detail-log-header
css/main.css:747  .detail-log-list
css/main.css:753  .detail-log-card
css/main.css:760  .detail-log-card-top
css/main.css:768  .detail-log-action
css/main.css:773  .detail-log-time
css/main.css:779  .detail-log-badge
css/main.css:789  .detail-log-context
css/main.css:796  .detail-log-context-item
css/main.css:814  .detail-log-change
css/main.css:821  .detail-log-arrow
css/main.css:845  .detail-log-note
css/main.css:886  .minimal-log-header
css/main.css:905  .minimal-danger-btn
css/main.css:923  .minimal-log-list
css/main.css:929  .minimal-log-item
css/main.css:934  .minimal-log-top
css/main.css:952  .minimal-log-context
css/main.css:959  .minimal-log-change
css/main.css:1004  .pro-log-header
css/main.css:1023  .pro-log-table-wrap
css/main.css:1030  .pro-log-table
css/main.css:1064  .pro-log-muted
css/main.css:1069  .pro-log-before
css/main.css:1075  .pro-log-after
css/main.css:1082  .pro-log-badge
css/main.css:1152  .rapport-panel
css/main.css:1180  .rapport-total-weight
css/main.css:1232  .rapport-section-header
css/main.css:1257  .rapport-production-table
css/main.css:1294  .rapport-summary-list
css/main.css:1303  .rapport-summary-row
css/main.css:1473  .settings-list-row
css/main.css:1759  .levering-panel
css/main.css:1787  .levering-summary
css/main.css:1807  .levering-days
css/main.css:1813  .levering-day-card
css/main.css:1820  .levering-day-header
css/main.css:1838  .levering-list
css/main.css:1847  .levering-card
css/main.css:1863  .levering-card-main
css/main.css:1869  .levering-order-number
css/main.css:1888  .levering-meta
css/main.css:1896  .levering-products
css/main.css:1902  .levering-product-row
css/main.css:1964  .log-pagination
css/main.css:1974  .log-pagination-info
css/main.css:1981  .log-pagination-nav
css/main.css:1988  .log-page-btn
css/main.css:2028  .log-page-indicator
css/main.css:2220  .delivery-number
css/main.css:2227  .delivery-subtext
css/main.css:2233  .delivery-items-cell
css/main.css:2240  .delivery-check-cell
css/main.css:2348  .delivery-group-header
css/main.css:2414  .delivery-address-link
css/main.css:2424  .delivery-items-list
css/main.css:2430  .delivery-item-line
css/main.css:2443  .levering-week-nav
css/main.css:2668  .rapport-top
css/main.css:2675  .rapport-title-block
css/main.css:2699  .rapport-total-card
css/main.css:2722  .rapport-kpis
css/main.css:2739  .rapport-grid
css/main.css:2752  .rapport-card-full
css/main.css:2787  .production-item-top
css/main.css:2802  .production-item-body
css/main.css:2807  .product-summary-table-wrap
css/main.css:2808  .rapport-detail-wrap
css/main.css:2814  .product-summary-table
css/main.css:2815  .improved
css/main.css:2844  .group-row
css/main.css:2849  .subtotal-row
css/main.css:2878  .rr-view
css/main.css:2884  .rr-top
css/main.css:2891  .rr-title-card
css/main.css:2915  .rr-total-card
css/main.css:2938  .rr-kpis
css/main.css:2944  .rr-kpi
css/main.css:2963  .rr-grid
css/main.css:2969  .rr-card
css/main.css:2976  .rr-card--full
css/main.css:2980  .rr-card-head
css/main.css:2998  .rr-production-list
css/main.css:3004  .rr-production-item
css/main.css:3011  .rr-production-top
css/main.css:3027  .rr-production-body
css/main.css:3032  .rr-table-wrap
css/main.css:3038  .rr-table
css/main.css:3063  .rr-table--summary
css/main.css:3068  .rr-table--detail
css/main.css:3075  .rr-subtotal-row
css/main.css:3080  .rr-group-row
css/main.css:3084  .rr-empty
css/main.css:3093  .rr-empty-box
css/main.css:3252  .rr-table-summary
css/main.css:3254  .rr-table-detail
css/main.css:3331  .rr-product-name-cell
css/mobile.css:17  .app-header
css/mobile.css:84  .rapport-total-weight
css/mobile.css:85  .levering-summary
css/mobile.css:99  .analytics-grid
css/mobile.css:104  .rapport-section
css/mobile.css:106  .levering-day-card
css/mobile.css:110  .rapport-section-header
css/mobile.css:112  .levering-day-header
css/mobile.css:142  .levering-card
css/mobile.css:146  .levering-product-row
css/mobile.css:151  .pro-log-header
css/mobile.css:156  .danger-btn
css/mobile.css:213  .row-action-column
css/mobile.css:214  .row-action-cell
css/mobile.css:219  .delete-row-btn
css/mobile.css:336  .pro-log-table-wrap
css/table.css:227  .empty-table-message

Note:
This is an audit only. Do not delete all of these blindly.
Some classes may be created dynamically or used by browser states/media rules.
```
