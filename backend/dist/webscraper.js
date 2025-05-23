"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDetails = getDetails;
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const generative_ai_1 = require("@google/generative-ai");
const prompt_1 = require("./prompt");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const GEMINI_API = process.env.GEMINI_API || "";
puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
async function aiCall(reviews) {
    const genAI = new generative_ai_1.GoogleGenerativeAI("AIzaSyBRtWxwfTSS_iPAa1mb7ZsP1dsLi0iUDug");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = (0, prompt_1.getReviewSummaryPrompt)(reviews);
    try {
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text().replace(/```json\n|\n```/g, ""));
    }
    catch (error) {
        return null;
    }
}
async function getDetails(productURL) {
    const browser = await puppeteer_extra_1.default.launch({
        headless: true,
        dumpio: true, // Logs browser output
        args: ['--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    try {
        await page.goto(productURL, { waitUntil: "domcontentloaded", timeout: 60000 });
    }
    catch (error) {
        await browser.close();
        throw new Error("Failed to navigate to product page");
    }
    const product = {};
    product.Title = await page.title();
    console.log(product.Title);
    await page.waitForSelector('#titleSection > #title > #productTitle', { timeout: 10000 }).catch(() => null);
    const productName = page.$eval('#titleSection > #title > #productTitle', (el) => (el.textContent?.trim()));
    await page.waitForSelector('.a-price.aok-align-center.priceToPay .a-price-whole', { timeout: 10000 }).catch(() => null);
    const priceElement = await page.$('.a-price.aok-align-center.priceToPay .a-price-whole');
    product.CurrentPrice = priceElement ? await page.evaluate(el => el.textContent?.trim(), priceElement) : "Not Available";
    await page.waitForSelector('.a-price.a-text-price .a-offscreen', { timeout: 10000 }).catch(() => null);
    const originalPriceElement = await page.$('.a-price.a-text-price .a-offscreen');
    product.OriginalPrice = originalPriceElement ? await page.evaluate(el => el.textContent?.trim(), originalPriceElement) : null;
    await page.waitForSelector('.a-icon-alt', { timeout: 10000 }).catch(() => null);
    const ratingElement = await page.$('.a-icon-alt');
    product.Rating = ratingElement ? await page.evaluate(el => el.textContent?.trim(), ratingElement) : "Not Available";
    await page.waitForSelector('#acrCustomerReviewText', { timeout: 10000 }).catch(() => null);
    const reviewCountElement = await page.$('#acrCustomerReviewText');
    product.ReviewCount = reviewCountElement ? await page.evaluate(el => el.textContent?.trim(), reviewCountElement) : "Not Available";
    const imageUrls = await page.$$eval("#altImages img", (imgs) => imgs.map(img => img.getAttribute("src") || img.currentSrc));
    const highResUrl = [];
    const targetDimensions = "400,400";
    imageUrls.forEach(element => {
        if (!element.includes("icon")) {
            const temp = element.replace(/_SS\d+_/, "_SS400_").replace(/_SX\d+_SY\d+_/, "_SX400_SY400_").replace(/CR,0,0,\d+,\d+_/, `CR,0,0,${targetDimensions}_`);
            highResUrl.push(temp);
        }
    });
    product.imageURL = highResUrl;
    await page.waitForSelector(".a-spacing-mini > .a-list-item", { timeout: 10000 }).catch(() => null);
    const aboutItem = await page.$$eval(".a-spacing-mini > .a-list-item", infos => infos.map(info => info.textContent?.trim() || ""));
    product.AboutItem = aboutItem;
    await page.waitForSelector("#productDetails_techSpec_section_1 .a-color-secondary.a-size-base.prodDetSectionEntry", { timeout: 10000 }).catch(() => null);
    const technicalDetails = await page.$$eval("#productDetails_techSpec_section_1 .a-color-secondary.a-size-base.prodDetSectionEntry", techDetails => techDetails.map(td => td.textContent?.trim()));
    await page.waitForSelector("#productDetails_techSpec_section_1 .a-size-base.prodDetAttrValue", { timeout: 10000 }).catch(() => null);
    const technicalDetailsInfo = await page.$$eval("#productDetails_techSpec_section_1 .a-size-base.prodDetAttrValue", techDetails => techDetails.map(td => td.textContent?.trim()));
    product.TechnicalDetails = technicalDetails.map((detail, i) => `${detail} : ${technicalDetailsInfo[i]}`);
    await page.waitForSelector('div[class*="aplus"], div[id*=aplus] img', { timeout: 10000 }).catch(() => null);
    const manufactuerImgs = await page.$$eval('div[class*="aplus"], div[id*=aplus] img', //lookout for the divs having aplus in their class or id
    (images) => images.map(img => img.getAttribute('src') || img.getAttribute('data-src')));
    const noscriptImages = await page.$$eval('div[class*="aplus"], div[id*="aplus"] noscript', (noscripts) => noscripts.map(ns => {
        const temp = document.createElement("div");
        temp.innerHTML = ns.innerHTML;
        const img = temp.querySelector("img");
        return img ? img.getAttribute("src") : null;
    }).filter(Boolean));
    const allManufacturerImages = new Set();
    manufactuerImgs.filter(img => img?.includes('.jpg'))
        .filter(img => img?.includes('aplus'))
        .forEach(img => allManufacturerImages.add(img ? img : ""));
    noscriptImages.filter(img => img?.includes(".jpg"))
        .filter(img => img?.includes('aplus'))
        .forEach(img => allManufacturerImages.add(img ? img : ""));
    product.ManufacturersImages = [...allManufacturerImages];
    await page.waitForSelector('.review .review-text', { timeout: 10000 }).catch(() => null);
    const reviews = await page.$$eval('.review .review-text', el => el.map(rev => rev.textContent?.trim() || ""));
    product.ReviewSummary = await aiCall(reviews);
    await browser.close();
    return product;
}
