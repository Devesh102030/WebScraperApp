import express, { Request, Response } from "express";
import cors from "cors";
import { getDetails } from "./webscraper";

const app = express();

app.use(express.json());
app.use(cors());

app.post("/api/products", async (req: Request, res: Response) => {
    const { productLink } = req.body;

    if (!productLink) {
        res.status(404).json({ msg: "Product not found" });
        return;
    }

    try {
        const response = await getDetails(productLink);
        res.status(200).json({ msg: response });
        return;
    } catch (error) {
        console.log(error);      
        res.status(500).json({ msg: "Error fetching product details"});
        return
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
