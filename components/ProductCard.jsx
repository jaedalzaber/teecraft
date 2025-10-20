"use client";
import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";

const ProductCard = ({ product }) => {
  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";
  const [loved, setLoved] = useState(false);
  const [totalLoves, setTotalLoves] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch love count & user love status
  useEffect(() => {
    const fetchLoveCount = async () => {
      try {
        const res = await axios.get(`/api/products/${product.id}/react`);
        setTotalLoves(res.data.totalLoves ?? 0);
        setLoved(res.data.userLoved ?? false);
      } catch (error) {
        console.error("Error fetching love count:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoveCount();
  }, [product.id]);

  // Toggle love
  const handleLoveToggle = async (e) => {
    e.preventDefault(); // prevent navigation
    if (loading) return; // prevent spam before loaded

    try {
      // Optimistic UI update
      const newLoved = !loved;
      setLoved(newLoved);
      setTotalLoves((prev) => prev + (newLoved ? 1 : -1));

      // Update backend
      await axios.post(`/api/products/${product.id}/react`, {
        action: newLoved ? "love" : "unlove",
      });
    } catch (error) {
      console.error("Error updating love:", error);
      // Rollback on failure
      setLoved(loved);
      setTotalLoves((prev) => prev + (loved ? 1 : -1));
    }
  };

  const firstImage = (product.images && product.images[0]) || "/placeholder.png";

  return (
    <Link href={`/product/${product.id}`} className="group max-xl:mx-auto">
      <div className="relative bg-[#cecece] h-50 sm:w-60 sm:h-68 rounded-lg flex items-center justify-center">
        {/* Heart button */}
        <button
          onClick={handleLoveToggle}
          className="absolute top-3 right-3 z-10 p-1 rounded-full bg-white/70 hover:bg-white shadow transition"
          aria-label={loved ? "Unlove product" : "Love product"}
        >
          <Heart
            size={20}
            fill={loved ? "#FF4D6D" : "none"}
            stroke={loved ? "#FF4D6D" : "#555"}
            className={`transition-transform duration-200 ${
              loved ? "scale-110" : "scale-100"
            }`}
          />
        </button>

        <Image
          width={800}
          height={800}
          className="max-h-60 sm:max-h-70 w-auto group-hover:scale-115 transition duration-300"
          src={firstImage}
          alt={product.name || "Product Image"}
        />
      </div>

      <div className="flex justify-between gap-3 text-sm text-slate-800 pt-2 max-w-60">
        <div>
          <p className="truncate">{product.name}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {totalLoves} {totalLoves === 1 ? "love" : "loves"}
          </p>
        </div>
        <p>
          {currency}
          {product.price}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
