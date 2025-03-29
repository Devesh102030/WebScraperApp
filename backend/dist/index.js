"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const webscraper_1 = require("./webscraper");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.post("/api/products", async (req, res) => {
    const { productLink } = req.body;
    if (!productLink) {
        res.status(404).json({ msg: "Product not found" });
        return;
    }
    try {
        const response = await (0, webscraper_1.getDetails)(productLink);
        res.status(200).json({ msg: response });
        return;
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error fetching product details" });
        return;
    }
});
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
