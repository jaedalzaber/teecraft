"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

const HeartIcon = ({ filled, onClick, className }) => (
  <svg
    onClick={onClick}
    className={`${className} cursor-pointer transition-transform duration-150 active:scale-90`}
    viewBox="0 0 24 24"
    fill={filled ? "#ec4899" : "none"} // pink if loved
    stroke={filled ? "#ec4899" : "#1f2937"} // gray border if not loved
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

const LoveButton = ({ productId }) => {
  const { isLoaded, user } = useUser(); // Clerk user info
  const [loveCount, setLoveCount] = useState(0);
  const [isLoved, setIsLoved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = `/api/products/${productId}/react`;

  // --- Fetch current love status ---
  const fetchStatus = useCallback(async () => {
    if (!productId) return;
    setIsLoading(true);

    try {
      const res = await axios.get(apiUrl);
      const { totalLoves, userLoved } = res.data;

      setLoveCount(totalLoves ?? 0);
      setIsLoved(userLoved ?? false);
    } catch (error) {
      console.error("Error fetching love status:", error.message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, productId]);

  useEffect(() => {
    if (isLoaded) fetchStatus(); // wait until user is loaded
  }, [fetchStatus, isLoaded]);

  // --- Toggle Love ---
  const handleLoveToggle = async () => {
    if (isLoading) return;
    if (!user) {
      alert("Please sign in to love products.");
      return;
    }

    const newLoved = !isLoved;
    setIsLoved(newLoved);
    setLoveCount((prev) => (newLoved ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await axios.post(apiUrl, {
        action: newLoved ? "love" : "unlove",
      });

      // Ensure UI syncs with backend counts
      setLoveCount(res.data.totalLoves ?? 0);
      setIsLoved(res.data.userLoved ?? newLoved);
    } catch (error) {
      console.error("Love toggle failed:", error.message);
      // revert on error
      setIsLoved(!newLoved);
      setLoveCount((prev) => (newLoved ? Math.max(0, prev - 1) : prev + 1));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-gray-200"></div>
        <div className="w-8 h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <HeartIcon
        filled={isLoved}
        onClick={handleLoveToggle}
        className="w-6 h-6"
      />
      <span className="text-sm font-medium text-gray-700">{loveCount}</span>
    </div>
  );
};

export default LoveButton;
