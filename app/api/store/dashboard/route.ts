import prisma from "@/lib/prisma"
import { authSeller } from "@/middlewares/authSeller"
import { getAuth } from "@clerk/nextjs/dist/types/server"
import { NextResponse } from "next/server"

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = String(await authSeller(userId))

        const orders = await prisma.order.findMany({ where: { storeId }})

        const products = await prisma.product.findMany({ where: {storeId}})

        const ratings = await prisma.rating.findMany({
            where: { productId: {in: products.map(product => product.id)}}
        })

        const dashboardData = {
            ratings,
            totalOrders: orders.length,
            totalEarnings: Math.round(orders.reduce((acc, order) => acc + order.total, 0)),
            totalProducts: products.length
        }
        

        return NextResponse.json({ dashboardData })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message}, { status: 400})
    }
}