const { fetchPageHtml } = require("../scraper/websiteScraper");
const { parseHtml } = require("../scraper/htmlParser");

const { auditHomepage } = require("./homepageAudit");
const { auditProduct } = require("./productAudit");
const { auditCollection } = require("./collectionAudit");
const { auditCart } = require("./cartAudit");

const { calculateScores } = require("./scoreCalculator");
const { prioritizeIssues } = require("./recommendationEngine");

const AUDITORS = {
    homepage: auditHomepage,
    product: auditProduct,
    collection: auditCollection,
    cart: auditCart
};

/**
 * ----------------------------------------
 * Default Theme File Mapping
 * ----------------------------------------
 */

const DEFAULT_FILE_TARGETS = {

    seo: "layout/theme.liquid",

    performance: "layout/theme.liquid",

    accessibility: "layout/theme.liquid",

    mobile: "layout/theme.liquid",

    trust: "sections/main-product.liquid",

    ui: "sections/main-product.liquid",

    cart: "sections/main-cart.liquid",

    cro: "sections/main-product.liquid"

};

/**
 * ----------------------------------------
 * Business Metrics
 * ----------------------------------------
 */

function calculateBusinessMetrics(issues) {

    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    let quickWins = 0;

    issues.forEach(issue => {

        switch ((issue.severity || "").toLowerCase()) {

            case "critical":
                critical++;
                break;

            case "high":
                high++;
                break;

            case "medium":
                medium++;
                break;

            default:
                low++;
        }

        if (
            issue.difficulty === "Easy" ||
            issue.quick_win
        ) {
            quickWins++;
        }

    });

    const estimatedConversionGain =
        Math.min(
            35,
            critical * 5 +
            high * 3 +
            medium * 1
        );

    const revenueImpact =
        critical > 3
            ? "High"
            : high > 3
                ? "Medium"
                : "Low";

    return {

        totalIssues: issues.length,

        criticalIssues: critical,

        highIssues: high,

        mediumIssues: medium,

        lowIssues: low,

        quickWins,

        estimatedConversionGain,

        revenueImpact

    };

}

/**
 * ----------------------------------------
 * Normalize Every Issue
 * ----------------------------------------
 */

function enrichIssue(issue, pageType, fileTargetMap) {

    const category =
        (issue.category || "general")
            .toLowerCase();

    return {

        ...issue,

        category,

        page_type: pageType,

        priority_rank: 999,

        quick_win:
            issue.difficulty === "Easy",

        status:
            issue.status || "open",

        confidence:
            issue.confidence || 90,

        file_target:
            issue.file_target ||
            fileTargetMap[category] ||
            DEFAULT_FILE_TARGETS[category] ||
            "layout/theme.liquid"

    };

}

/**
 * ----------------------------------------
 * MAIN AUDIT
 * ----------------------------------------
 */

async function runAudit({

    url,

    pageType = "homepage",

    fileTargetMap = {}

}) {

    const html =
        await fetchPageHtml(url);

    const parsed =
        parseHtml(html);

    const auditor =
        AUDITORS[pageType] ||
        auditHomepage;

    let issues =
        auditor(parsed);

    issues =
        issues.map(issue =>
            enrichIssue(
                issue,
                pageType,
                fileTargetMap
            )
        );

    issues =
        prioritizeIssues(
            issues
        );

    const metrics =
        calculateBusinessMetrics(
            issues
        );

    const {
        overallScore,
        categoryScores
    } =
        calculateScores(
            issues
        );

            return {

        overallScore,

        categoryScores,

        businessMetrics: metrics,

        websiteSummary: {

            pagesAudited: 1,

            totalIssues: metrics.totalIssues,

            criticalIssues: metrics.criticalIssues,

            highIssues: metrics.highIssues,

            mediumIssues: metrics.mediumIssues,

            lowIssues: metrics.lowIssues,

            quickWins: metrics.quickWins,

            estimatedConversionGain:
                metrics.estimatedConversionGain + "%",

            estimatedRevenueImpact:
                metrics.revenueImpact

        },

        issues,

        pageType,

        url,

        rawFindings: {

            pageTitle:
                parsed.title,

            metaDescription:
                parsed.metaDescription,

            h1Count:
                parsed.h1Count,

            images:
                parsed.images.length,

            buttons:
                parsed.buttons.length,

            forms:
                parsed.forms,

            scripts:
                parsed.scripts.length,

            bodyLength:
                parsed.bodyTextLength

        }

    };

}

/**
 * ----------------------------------------
 * WEBSITE AUDIT (Future Ready)
 * ----------------------------------------
 */

async function runWebsiteAudit({

    homepage,

    productPages = [],

    collectionPages = [],

    cartPage,

    fileTargetMap = {}

}) {

    const reports = [];

    if (homepage) {

        reports.push(

            await runAudit({

                url: homepage,

                pageType: "homepage",

                fileTargetMap

            })

        );

    }

    for (const url of productPages) {

        reports.push(

            await runAudit({

                url,

                pageType: "product",

                fileTargetMap

            })

        );

    }

    for (const url of collectionPages) {

        reports.push(

            await runAudit({

                url,

                pageType: "collection",

                fileTargetMap

            })

        );

    }

    if (cartPage) {

        reports.push(

            await runAudit({

                url: cartPage,

                pageType: "cart",

                fileTargetMap

            })

        );

    }

    const allIssues =
        reports.flatMap(r => r.issues);

    const {

        overallScore,

        categoryScores

    } = calculateScores(allIssues);

    const businessMetrics =
        calculateBusinessMetrics(allIssues);

    return {

        overallScore,

        categoryScores,

        businessMetrics,

        pagesAudited:
            reports.length,

        reports,

        issues:
            allIssues

    };

}

module.exports = {

    runAudit,

    runWebsiteAudit

};