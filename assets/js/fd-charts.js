/* fd-charts.js — FightingData chart layer (ANALYTICS_BUILD_PLAN Phase 3).
   Owns the Chart.js theme (colors from fd.css tokens — CSS stays the single
   color authority) and the data loader. FD.loadFighter() is the ONE seam the
   Q4 premium gate re-points; chart code never builds URLs itself.
   Charts hydrate progressively: every number is ALSO server-rendered, so a
   fetch failure or no-JS leaves a fully readable page. */
(function () {
    'use strict';
    if (typeof Chart === 'undefined') return;

    var css = getComputedStyle(document.documentElement);
    function tok(n, fallback) {
        var v = css.getPropertyValue(n).trim();
        return v || fallback;
    }
    var C = {
        red: tok('--fd-red', '#d62828'),
        blue: tok('--fd-blue', '#1d4ed8'),
        ink: tok('--fd-ink', '#111'),
        muted: tok('--fd-muted', '#777'),
        faint: tok('--fd-faint', '#999'),
        border: tok('--fd-border', '#e2e2e2'),
        warn: tok('--fd-warn', '#c2410c')
    };

    Chart.defaults.font.family = tok('--fd-sans', "'Helvetica Neue', Helvetica, Arial, sans-serif");
    Chart.defaults.font.size = 11;
    Chart.defaults.color = C.muted;
    Chart.defaults.plugins.legend.display = false;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        Chart.defaults.animation = false;
    }

    function fetchJson(url) {
        return fetch(url).then(function (r) {
            if (!r.ok) throw new Error(url + ' -> ' + r.status);
            return r.json();
        });
    }

    var FD = {
        colors: C,
        // THE premium-gate seam: tier 'free' -> data.json, 'plus' -> plus.json
        loadFighter: function (slug, tier) {
            var file = tier === 'plus' ? 'plus.json' : 'data.json';
            return fetchJson('/fighters/' + slug + '/' + file);
        },
        loadBaselines: function () {
            return fetchJson('/assets/data/league_baselines.json');
        }
    };

    /* Career cumulative sig-strike curve vs league percentile envelope. */
    FD.curveChart = function (canvas, curve, env, grid) {
        function band(key, alpha, fillTo) {
            return {
                data: grid.map(function (g, i) {
                    return { x: g, y: env[key][i] };
                }).filter(function (p) { return p.y !== null; }),
                borderWidth: 0,
                pointRadius: 0,
                fill: fillTo,
                backgroundColor: 'rgba(17,17,17,' + alpha + ')',
                order: 10
            };
        }
        var fighterPts = curve.map(function (p) {
            return { x: p[0], y: p[1], meta: p };
        });
        var maxMin = Math.max(curve.length ? curve[curve.length - 1][0] : 0, 30) * 1.08;
        new Chart(canvas, {
            type: 'line',
            data: {
                datasets: [
                    band('p5', 0, false),
                    band('p25', 0.05, '-1'),
                    band('p50', 0.09, '-1'),
                    band('p75', 0.09, '-1'),
                    band('p95', 0.05, '-1'),
                    {   // league median reference line
                        data: grid.map(function (g, i) { return { x: g, y: env.p50[i] }; })
                                  .filter(function (p) { return p.y !== null; }),
                        borderColor: C.faint, borderDash: [5, 4], borderWidth: 1.5,
                        pointRadius: 0, fill: false, order: 5
                    },
                    {   // the fighter
                        data: fighterPts,
                        borderColor: C.red, borderWidth: 2.5,
                        pointRadius: 2.5, pointBackgroundColor: C.red,
                        fill: false, order: 1
                    }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', max: maxMin, grid: { color: C.border },
                         title: { display: true, text: 'Cumulative fight minutes', color: C.muted } },
                    y: { grid: { color: C.border },
                         title: { display: true, text: 'Cumulative sig. strikes landed', color: C.muted } }
                },
                plugins: {
                    tooltip: {
                        filter: function (item) { return item.dataset.order === 1; },
                        displayColors: false,
                        backgroundColor: C.ink, titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)',
                        callbacks: {
                            title: function (items) {
                                var m = items[0].raw.meta;
                                return m[5] + ' vs ' + m[4];
                            },
                            label: function (item) {
                                var m = item.raw.meta;
                                return [m[3] + ' · ' + m[6],
                                        m[1] + ' landed over ' + m[0] + ' min'];
                            }
                        }
                    }
                }
            }
        });
    };

    /* Target mix doughnut (head / body / leg shares of landed sig strikes). */
    FD.targetMix = function (canvas, mix) {
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Head', 'Body', 'Leg'],
                datasets: [{
                    data: [mix.head, mix.body, mix.leg],
                    backgroundColor: [C.red, 'rgba(17,17,17,0.55)', 'rgba(17,17,17,0.22)'],
                    borderColor: '#fff', borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '62%',
                plugins: {
                    legend: { display: true, position: 'bottom',
                              labels: { boxWidth: 10, boxHeight: 10, color: C.muted } },
                    tooltip: {
                        displayColors: false, backgroundColor: C.ink,
                        titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)',
                        callbacks: { label: function (i) { return i.parsed + '% of landed strikes'; } }
                    }
                }
            }
        });
    };

    /* Positional profile: % of fight time at distance / in control / controlled. */
    FD.positional = function (canvas, w) {
        new Chart(canvas, {
            type: 'bar',
            data: {
                labels: ['At distance', 'In control', 'Controlled'],
                datasets: [{
                    data: [w.pct_time_distance, w.pct_time_in_control, w.pct_time_controlled],
                    backgroundColor: [C.red, 'rgba(17,17,17,0.55)', 'rgba(17,17,17,0.22)'],
                    borderRadius: 3, barThickness: 18
                }]
            },
            options: {
                indexAxis: 'y', responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { min: 0, max: 100, grid: { color: C.border },
                         ticks: { callback: function (v) { return v + '%'; } } },
                    y: { grid: { display: false }, ticks: { color: C.ink } }
                },
                plugins: {
                    tooltip: {
                        displayColors: false, backgroundColor: C.ink,
                        titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)',
                        callbacks: { label: function (i) { return i.parsed.x.toFixed(1) + '% of fight time'; } }
                    }
                }
            }
        });
    };

    /* Dual career curves (comparison pages): fighter A red, B blue, league
       median dashed. Bands omitted — two fighter lines + median reads best. */
    FD.dualCurve = function (canvas, curveA, curveB, nameA, nameB, env, grid) {
        function fighterSet(curve, color) {
            return {
                data: curve.map(function (p) { return { x: p[0], y: p[1], meta: p }; }),
                borderColor: color, borderWidth: 2.5,
                pointRadius: 2, pointBackgroundColor: color,
                fill: false, order: 1
            };
        }
        var maxMin = Math.max(
            curveA.length ? curveA[curveA.length - 1][0] : 0,
            curveB.length ? curveB[curveB.length - 1][0] : 0, 30) * 1.08;
        new Chart(canvas, {
            type: 'line',
            data: {
                datasets: [
                    {
                        data: grid.map(function (g, i) { return { x: g, y: env.p50[i] }; })
                                  .filter(function (p) { return p.y !== null && p.x <= maxMin; }),
                        borderColor: C.faint, borderDash: [5, 4], borderWidth: 1.5,
                        pointRadius: 0, fill: false, order: 5
                    },
                    fighterSet(curveA, C.red),
                    fighterSet(curveB, C.blue)
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: { type: 'linear', max: maxMin, grid: { color: C.border },
                         title: { display: true, text: 'Cumulative fight minutes', color: C.muted } },
                    y: { grid: { color: C.border },
                         title: { display: true, text: 'Cumulative sig. strikes landed', color: C.muted } }
                },
                plugins: {
                    tooltip: {
                        filter: function (item) { return item.dataset.order === 1; },
                        displayColors: false,
                        backgroundColor: C.ink, titleColor: '#fff', bodyColor: 'rgba(255,255,255,0.8)',
                        callbacks: {
                            title: function (items) {
                                var m = items[0].raw.meta;
                                var who = items[0].datasetIndex === 1 ? nameA : nameB;
                                return who + ': ' + m[5] + ' vs ' + m[4];
                            },
                            label: function (item) {
                                var m = item.raw.meta;
                                return [m[3] + ' · ' + m[6],
                                        m[1] + ' landed over ' + m[0] + ' min'];
                            }
                        }
                    }
                }
            }
        });
    };

    /* Auto-hydrate a comparison page (div.fd-vs[data-slug-a][data-slug-b]). */
    function initVs(el) {
        var slugA = el.getAttribute('data-slug-a');
        var slugB = el.getAttribute('data-slug-b');
        var division = el.getAttribute('data-division') || '';
        Promise.all([FD.loadFighter(slugA), FD.loadFighter(slugB), FD.loadBaselines()])
            .then(function (res) {
                var a = res[0], b = res[1], base = res[2];
                var cv = el.querySelector('canvas[data-chart="dual-curve"]');
                if (cv && a.curve && b.curve && a.curve.length >= 2 && b.curve.length >= 2) {
                    var env = base.divisions[division] || base.global;
                    FD.dualCurve(cv, a.curve, b.curve,
                                 el.getAttribute('data-name-a') || 'Fighter A',
                                 el.getAttribute('data-name-b') || 'Fighter B',
                                 env, base.grid);
                } else if (cv) {
                    cv.closest('.fd-chart-card').style.display = 'none';
                }
            })
            .catch(function () {
                el.querySelectorAll('.fd-chart-card').forEach(function (c) { c.style.display = 'none'; });
            });
    }

    /* Auto-hydrate a fighter profile dashboard (div.fd-dash[data-slug]). */
    function initDash(el) {
        var slug = el.getAttribute('data-slug');
        var division = el.getAttribute('data-division') || '';
        Promise.all([FD.loadFighter(slug), FD.loadFighter(slug, 'plus'), FD.loadBaselines()])
            .then(function (res) {
                var free = res[0], plus = res[1], base = res[2];
                var cv = el.querySelector('canvas[data-chart="curve"]');
                if (cv && free.curve && free.curve.length >= 2) {
                    var env = base.divisions[division] || base.global;
                    FD.curveChart(cv, free.curve, env, base.grid);
                } else if (cv) {
                    cv.closest('.fd-chart-card').style.display = 'none';
                }
                var tm = el.querySelector('canvas[data-chart="target-mix"]');
                if (tm && plus.target_mix) FD.targetMix(tm, plus.target_mix);
                else if (tm) tm.closest('.fd-chart-card').style.display = 'none';
                var pos = el.querySelector('canvas[data-chart="positional"]');
                var w = plus.windows && plus.windows.career;
                if (pos && w && w.pct_time_distance !== null) FD.positional(pos, w);
                else if (pos) pos.closest('.fd-chart-card').style.display = 'none';
            })
            .catch(function () {
                // Data unavailable: hide chart shells, server-rendered numbers remain.
                el.querySelectorAll('.fd-chart-card').forEach(function (c) { c.style.display = 'none'; });
            });
    }

    window.FD = FD;
    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.fd-dash[data-slug]').forEach(initDash);
        document.querySelectorAll('.fd-vs[data-slug-a]').forEach(initVs);
    });
})();
