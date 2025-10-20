'use client'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Title from './Title'
import ProductCard from './ProductCard'
import { useSelector } from 'react-redux'

const BestSelling = () => {
  const displayQuantity = 8
  const products = useSelector((state) => state.product.list)
  const [loveCounts, setLoveCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLoveCounts = async () => {
      if (!products?.length) return

      try {
        // Fetch love count for all products in parallel
        const results = await Promise.all(
          products.map((product) =>
            axios
              .get(`/api/products/${product.id}/react`)
              .then((res) => ({
                id: product.id,
                loves: res.data.totalLoves ?? 0,
              }))
              .catch(() => ({ id: product.id, loves: 0 }))
          )
        )

        // Convert array -> object map for quick access
        const counts = {}
        results.forEach((r) => {
          counts[r.id] = r.loves
        })

        setLoveCounts(counts)
      } catch (error) {
        console.error('Error fetching love counts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchLoveCounts()
  }, [products])

  // Sort products by their total loves (default 0 if missing)
  const sortedProducts = [...products].sort(
    (a, b) => (loveCounts[b.id] || 0) - (loveCounts[a.id] || 0)
  )

  return (
    <div className="px-6 my-30 max-w-6xl mx-auto">
      <Title
        title="Most Popular"
        description={`Showing ${
          sortedProducts.length < displayQuantity
            ? sortedProducts.length
            : displayQuantity
        } of ${sortedProducts.length} products`}
        href="/shop"
      />

      {loading ? (
        <div className="mt-12 text-center text-gray-500 animate-pulse">
          Loading best sellers...
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-2 sm:flex flex-wrap gap-6 xl:gap-12">
          {sortedProducts
            .slice(0, displayQuantity)
            .map((product, index) => (
              <ProductCard key={index} product={product} />
            ))}
        </div>
      )}
    </div>
  )
}

export default BestSelling
