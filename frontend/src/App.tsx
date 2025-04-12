import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, IndianRupee, Percent, AlertCircle } from 'lucide-react';
import axios from "axios";
import './index.css'

interface ReviewSummaryType {
  overall_sentiment: string;
  common_praises: string[];
  common_complaints: string[];
  summary: string;
}

function App() {
  type out = string | undefined;

  interface obj {
    Title: string;
    ProductName: out;
    CurrentPrice: out;
    OriginalPrice: string | null;
    Rating: out;
    ReviewCount: out;
    imageURL: (string | null)[];
    BankOffers?: { OfferName: string; OfferDetail: string }[];
    AboutItem?: string[];
    TechnicalDetails?: string[];
    ManufacturersImages: string[];
    ReviewSummary?: ReviewSummaryType;
  }

  const [productLink, setProductLink] = useState<string>("");
  const [productDetails, setProductDetails] = useState<obj | null>(null);
  const [button, setButton] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const data = { productLink };

  async function getDetails() {
    try {
      setButton(true);
      const response = await axios.post("http://localhost:3000/api/products", data);
      const result: obj = response.data.msg;
      setProductDetails(result);
      setButton(false);
      console.log(result);
    } catch (error) {
      console.error("Error fetching details:", error);
      setButton(false);
    }
  }

  return (
    <div className="container">
      <div className="content">
        {/* Header */}
        <div className="header">
          <h1>Amazon Product Scraper</h1>
          <p>Enter any Amazon product URL to get detailed information, including prices, reviews, and AI-generated insights.</p>
        </div>

        {/* Input Section */}
        <div className="input-section">
          <div className="input-wrapper">
            <input
              type="url"
              placeholder="Paste Amazon product URL here"
              value={productLink}
              onChange={(e) => setProductLink(e.target.value)}
              className="search-bar"
            />
            {/* <Search size={20} /> */}
          </div>
          <button
            onClick={getDetails}
            disabled={button}
            className="submit-button"
          >
            {button ? "Fetching Details..." : "Get Details"}
          </button>
        </div>

        {/* Results Section */}
        {productDetails && !button && (
          <div className="results">
            {/* Product Name */}
            <h2 className="product-title">
              {productDetails.ProductName || productDetails.Title || "No name available"}
            </h2>

            {/* Image Slider */}
            {productDetails.imageURL?.length ? (
              <div className="slider-container">
                <div 
                  className="slider"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {productDetails.imageURL.map((url, index) => (
                    url && (
                      <div key={index} className="slide">
                        <img 
                          src={url} 
                          alt={`Product view ${index + 1}`}
                        />
                      </div>
                    )
                  ))}
                </div>
                
                <button 
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + productDetails.imageURL.length) % productDetails.imageURL.length)}
                  className="slider-nav prev"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % productDetails.imageURL.length)}
                  className="slider-nav next"
                >
                  <ChevronRight size={24} />
                </button>

                <div className="slider-dots">
                  {productDetails.imageURL.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      className={`dot ${index === currentSlide ? 'active' : ''}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-image">
                <AlertCircle size={24} />
                <p>No Product Images Available</p>
              </div>
            )}

            {/* Product Details Grid */}
            <div className="details-grid">
              <div className="detail-card">
                <div className="detail-card-header">
                  <Star className="text-yellow-400" size={20} />
                  <h3>Rating</h3>
                </div>
                <p className="value">{productDetails.Rating || "No rating available"}</p>
                <p className="subvalue">{productDetails.ReviewCount || "No reviews yet"}</p>
              </div>

              <div className="detail-card">
                <div className="detail-card-header">
                  <IndianRupee className="text-green-600" size={20} />
                  <h3>Price</h3>
                </div>
                <p className="value">₹{productDetails.CurrentPrice || "Not available"}</p>
                <p className="subvalue">{productDetails.OriginalPrice || "Not available"}</p>
              </div>
            </div>

            {/* Bank Offers */}
            {productDetails.BankOffers?.length  && (
              <div className="offers-section">
                <div className="detail-card-header">
                  <Percent className="text-purple-600" size={20} />
                  <h3 className="section-header">Bank Offers</h3>
                </div>
                <div className="offers-list">
                  {productDetails.BankOffers.map((offer, index) => (
                    <div key={index} className="offer-card">
                      <p className="title">{offer.OfferName}</p>
                      <p className="detail">{offer.OfferDetail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Review Summary */}
            {productDetails.ReviewSummary && (
              <div className="review-analysis">
                <h3 className="section-header">AI Review Analysis</h3>
                <div className="sentiment-card">
                  <p className="title">Overall Sentiment</p>
                  <p className="detail">{productDetails.ReviewSummary.overall_sentiment}</p>
                </div>
                
                <div className="details-grid" style={{ marginTop: '1rem' }}>
                  <div className="praises-card">
                    <p className="title">Common Praises</p>
                    <p className="detail">
                      {productDetails.ReviewSummary.common_praises?.join(", ")}
                    </p>
                  </div>
                  
                  <div className="complaints-card">
                    <p className="title">Common Complaints</p>
                    <p className="detail">
                      {productDetails.ReviewSummary.common_complaints?.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="summary-card" style={{ marginTop: '1rem' }}>
                  <p className="title">Summary</p>
                  <p className="detail">{productDetails.ReviewSummary.summary}</p>
                </div>
              </div>
            )}

            {/* About Item */}
            {productDetails.AboutItem && productDetails.AboutItem.length > 0 && (
              <div className="offers-section">
                <h3 className="section-header">About This Item</h3>
                <ul className="list">
                  {productDetails.AboutItem.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

          {/* Image Slider */}
            <div className="offers-section">
            <h3 className="section-header">From the Manufacturer</h3>
            {productDetails.ManufacturersImages?.length ? (
            
            <div className="slider-container">
              <div 
                className="slider"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {productDetails.ManufacturersImages.map((url, index) => (
                  url && (
                    <div key={index} className="slide">
                      <img 
                        src={url} 
                        alt={`Product view ${index + 1}`}
                      />
                    </div>
                  )
                ))}
              </div>
               
              <button 
                onClick={() => setCurrentSlide((prev) => (prev - 1 + productDetails.ManufacturersImages.length) % productDetails.ManufacturersImages.length)}
                className="slider-nav prev"
              >
              <ChevronLeft size={24} />
              </button>

              <button 
                onClick={() => setCurrentSlide((prev) => (prev + 1) % productDetails.ManufacturersImages.length)}
                className="slider-nav next"
              >
                <ChevronRight size={24} />
              </button>

              <div className="slider-dots">
                {productDetails.ManufacturersImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="no-image">
              <AlertCircle size={24} />
              <p>No Product Images Available</p>
            </div>
          )}
          </div> 

          {/* Technical Details */}
          {productDetails.TechnicalDetails && productDetails.TechnicalDetails.length > 0 && (
            <div className="offers-section">
              <h3 className="section-header">Technical Details</h3>
              <ul className="list">
                {productDetails.TechnicalDetails.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            </div>
          )}

          </div>
        )}
      </div>
    </div>
  );
}

export default App;