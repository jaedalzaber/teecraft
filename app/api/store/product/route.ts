import { getAuth } from "@clerk/nextjs/server";
import { authSeller } from "@/middlewares/authSeller"
import { NextResponse } from "next/server";
import { handleUpload } from "@/configs/imageKit";
import prisma from "@/lib/prisma";

export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json(
                { error: 'not authorized' },
                { status: 401 }
            )
        }

        const formData = await request.formData()
        const name = formData.get("name")
        const description = formData.get("description")
        const mrp = Number(formData.get("mrp"))
        const price = Number(formData.get("price"))
        const category = formData.get("category")
        const images = formData.get("images")

        if (!name || !description || !mrp || !price || images.length < 1) {
            return NextResponse.json({ error: 'missing product details' }, { status: 400 })
        }

        const imagesUrl = await Promise.all(images.map(async (image) => {
            const imageData = handleUpload(image)
            return imageData
        }))

        await prisma.product.create({
            data: {
                name, description,
                mrp,
                price,
                category,
                images: imagesUrl,
                storeId
            }
        })

        return NextResponse.json({ message: "Product added successfully" })

    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: error.code || error.message }, { status: 400 })
    }
}

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const storeId = await authSeller(userId)

        if (!storeId) {
            return NextResponse.json(
                { error: 'not authorized' },
                { status: 401 }
            )
        }

        const products = await prisma.product.findMany({
             where: { storeId }
        })

        return NextResponse.json({products})

    } catch (error) {

    }
}