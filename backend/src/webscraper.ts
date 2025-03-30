//import puppeteer from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getReviewSummaryPrompt } from "./prompt";
import dotenv from "dotenv"

dotenv.config();

const GEMINI_API: string = process.env.GEMINI_API || "";

puppeteer.use(StealthPlugin());

interface ReviewSummaryType {
    overall_sentiment: string;
    common_praises: string[];
    common_complaints: string[];
    summary: string;
}

async function getReviewSummary(link: string) {
    console.log(process.env.GEMINI_API);
    
    console.log(GEMINI_API);
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    let reviewCount = 0;

    if(!link.startsWith("https://")){
        link = "https://www.amazon.in" + link;
        console.log(link);    
    }

    await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    try{
        await page.goto(link, {waitUntil: "networkidle2"});

        if (page.url().includes("signin")) {
            console.log("Amazon is asking for sign-in. Cannot proceed.");
            await browser.close();
            return;
        }
        
        let allReviews: (string|undefined)[] = [];

        while(reviewCount < 50){
            const reviews = await page.$$eval('div[id*="review-card"]  span[class*="review-text-content"]', el =>
                el.map(rev => (rev as HTMLElement).textContent?.trim() || "")
            )

            allReviews.push(...reviews);
            reviewCount += reviews.length;

            console.log("ok");
            
            const nextPage = await page.$eval('.a-last',el=>el.getAttribute('href')?.trim()).catch(()=>null);

            if(nextPage){
                await page.goto(`https://amazon.in${nextPage}`, {waitUntil: "networkidle2"});
            }
            else{
                break;
            }
        }
        console.log("Reviews: ",allReviews);   
    }
    catch(error){
        console.log(error);
        
        console.log("Error loading summary");   
    }
    finally{
        await browser.close();
    }
}

async function aiCall(reviews: string[]) {
    const genAI = new GoogleGenerativeAI("AIzaSyBRtWxwfTSS_iPAa1mb7ZsP1dsLi0iUDug");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = getReviewSummaryPrompt(reviews);
    try{
        const result = await model.generateContent(prompt);
        const summary = result.response.text();
        return JSON.parse(summary.replace(/```json\n|\n```/g, "")) as ReviewSummaryType;
    }
    catch(error){
        console.log("Error Occured", error);
    }
}

export async function getDetails(productURL: string){
    const browser = await puppeteer.launch({
        args: [
            "--disable-setuid-sandbox",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
        executablePath: process.env.NODE_ENV === 'production'
        ? process.env.PUPPETEER_EXECUTABLE_PATH
        : puppeteer.executablePath(),
        headless: true,
    }); //opnes a browser
    const page = await browser.newPage(); //creates a new page in browser

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    
    //const productURL = "https://www.amazon.in/Xiaomi-inches-Vision-Google-L43MA-AUIN/dp/B0DBRL1SYQ/ref=sr_1_1_sspa?crid=2V4RAZRA2IHNW&dib=eyJ2IjoiMSJ9.Plzxr4Ip68fLl1AwpKjKO5IV_IjP3U_GkeCXHQNlerysLDVd7DHmRFVOdlpgU4bgmOci4Kd6HmxQwRy1tR4CMf7X0KvZHoSbRMgEtnGn9YHbBpi4O-QgCmRWo7wQRhHR6ZnZuzPUSASCQVPG_6pK9jDPULvP_TH_oGIn69fuYda1o2H-senLplBwz6UhDOXukVQ-Q-AYPGDwH35mLTKKMxb1j5z03oNLJ9whXMcfjTg.ad6EfkBc5K1n8ksq3o1rfDS2JnRZBHWQLqTrE1MkNGU&dib_tag=se&keywords=led&nsdOptOutParam=true&qid=1742767674&sprefix=led%2Caps%2C238&sr=8-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1"

    try {
        await page.goto(productURL, {
            waitUntil: "networkidle2",
            timeout: 30000
        });
    } catch (error) {
        console.error("Navigation failed:", error);
        await browser.close();
        throw new Error("Failed to navigate to product page");
    }

    type out = string | undefined;

    interface obj {
        Title: string,
        ProductName: out,
        CurrentPrice: out,
        OriginalPrice: string | null,
        Rating: out,
        ReviewCount: out,
        imageURL: (string|null)[],
        BankOffers: {
                        OfferName: string;
                        OfferDetail: string;
                    }[]
        AboutItem: string[],
        TechnicalDetails: string[]
        ManufacturersImages: (string)[]
        ReviewSummary?: ReviewSummaryType
    }

    const product = {} as obj;

    const title: string = await page.evaluate(() => document.title);
    product.Title = title;
    console.log("Title: ",title);

    const productName: out = await page.$eval('#title span', el => el.textContent?.trim());
    product.ProductName = productName;
    console.log("Product Name: ", productName);

    const currprice: out = await page.$eval('.a-price-whole', el => el.textContent?.trim());
    product.CurrentPrice = currprice;
    console.log("Current Price: ", currprice);

    const originalPrice: string | null = await page.$eval('.a-price.a-text-price .a-offscreen', (el: Element) =>
        el.textContent?.trim() || null
    );
    product.OriginalPrice = originalPrice;
    console.log("Original Price (MRP):", originalPrice);
        
    const rating: out = await page.$eval('.a-icon-alt', el => el.textContent?.trim());
    product.Rating = rating;
    console.log("Rating: ", rating);

    const reviewCount: out = await page.$eval('#acrCustomerReviewText', el => el.textContent?.trim());
    product.ReviewCount = reviewCount;
    console.log("Review Count: ",reviewCount);
    
    //#altImages img
    const imageUrls = await page.$$eval("#altImages img", (imgs: Element[]) => 
        imgs.map(img => (img as HTMLImageElement).getAttribute("src") || (img as HTMLImageElement).currentSrc)
    );

    const highResUrl: (string|null)[] = [];

    imageUrls.forEach(element => {
        if(!element.includes("icon")){
            const temp = element.replace(/_SS\d+_/, "_SX1000_");
            highResUrl.push(temp);
        }
    });
    console.log(highResUrl);
    product.imageURL = highResUrl;


    const bankOffers = async function getBankOffers(){
        const offers = await page.$$eval(".a-size-base.a-spacing-micro",(offers) =>
            offers.map(offer => (offer as HTMLElement).textContent?.trim() || "")
        );

        const details = await page.$$eval(".a-truncate-full.a-offscreen",(details) => 
            details.map(detail => (detail as HTMLElement).textContent?.trim() || "")
        );

        let combineDetails: {
            OfferName: string;
            OfferDetail: string;
        }[] = [];
        const length = Math.min(offers.length,details.length)
        for(let i=0; i<length; i++){
            combineDetails.push({
                OfferName: `${offers[i]}`,
                OfferDetail: `${details[i]}`
            })
        }
        return combineDetails;
    }
    
    const bankOffersData = await bankOffers();
    product.BankOffers = bankOffersData;
    console.log("Bank Offers: ",bankOffersData);

    const aboutItem = await page.$$eval(".a-spacing-mini > .a-list-item", (infos) => 
        infos.map(info => (info as HTMLElement).textContent?.trim() || "")
    );
    product.AboutItem = aboutItem;
    console.log("About Item: ",aboutItem);
    
    const TechnicalDetails = await page.$$eval("#productDetails_techSpec_section_1 .a-color-secondary.a-size-base.prodDetSectionEntry",(techDetails)=>
        techDetails.map(techDetail => (techDetail as HTMLElement).textContent?.trim())
    );

    const TechnicalDetailsInfo = await page.$$eval("#productDetails_techSpec_section_1 .a-size-base.prodDetAttrValue",(techDetails)=>
        techDetails.map(techDetail => (techDetail as HTMLElement).textContent?.trim())
    );

    let TechInfo: string[] = [];
    for(let i=0; i<TechnicalDetails.length; i++){
        TechInfo.push(
            `${TechnicalDetails[i]} : ${TechnicalDetailsInfo[i]}`
        )
    }
    product.TechnicalDetails = TechInfo;
    console.log("Technical Details: ",TechInfo);

    const manufactuerImgs = await page.$$eval('div[class*="aplus"], div[id*=aplus] img', //lookout for the divs having aplus in their class or id
        (images) => images.map(img => img.getAttribute('src') || img.getAttribute('data-src'))
    );

    const noscriptImages = await page.$$eval(
        'div[class*="aplus"], div[id*="aplus"] noscript',
        (noscripts) => noscripts.map(ns => {
            const temp = document.createElement("div");
            temp.innerHTML = ns.innerHTML;
            const img = temp.querySelector("img");
            return img ? img.getAttribute("src") : null;
        }).filter(Boolean)
    );
    
    // Merge both lists and remove duplicates
    const allManufacturerImages = new Set<string>();
    manufactuerImgs.filter(img => img?.includes('.jpg'))
    .forEach(img => allManufacturerImages.add(img ? img : ""));

    noscriptImages.filter(img => img?.includes(".jpg"))
    .forEach(img => allManufacturerImages.add(img? img : ""));

    product.ManufacturersImages = [...allManufacturerImages];

    console.log("Manufactures Images: ", allManufacturerImages);
    
    // const seeAllreviews = await page.$eval('.a-link-emphasis.a-text-bold',el => el.getAttribute('href')?.trim());

    // if(typeof(seeAllreviews) === "string"){
    //     const reviewSummay = await getReviewSummary(seeAllreviews);
    // }

    //div[id*="review-card"]  span[class*="review-text-content"]
    const reviews = await page.$$eval('.review .review-text', el =>
        el.map(rev => (rev as HTMLElement).textContent?.trim() || "")
    )
    product.ReviewSummary = await aiCall(reviews);
    console.log(product.ReviewSummary); 
    
    await browser.close(); //closes the headless browser

    return product;
}

