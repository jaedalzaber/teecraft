import { config } from './../../../../middleware';
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = getAuth(request)
        const formData = await request.formData()

        console.log("From route")
        console.log(formData)

        const name = formData.get("name")
        const username = formData.get("username")
        const description = formData.get("description")
        const email = formData.get("email")
        const contact = formData.get("contact")
        const address = formData.get("address")
        const image = formData.get("image")

        console.log("image")
        console.log(image)

        if (!name || !username || !description || !email ||
            !contact || !address || !image) {
            console.log('data missing')
            return NextResponse.json(
                { error: "missing store info" },
                { status: 400 }
            )
        }

        const store = (await prisma.$queryRaw`
            SELECT * FROM "Store"
            WHERE "userId" = ${userId}
            LIMIT 1;
        `)[0];

        console.log('store: ')
        console.log(store)

        if (store) {
            console.log("store exits")
            return NextResponse.json(
                { error: "store already exists" },
                { status: 409 }
            )
        }

        const existingUsername = (await prisma.$queryRaw`
            SELECT * FROM "Store"
            WHERE "username" = ${String(username)}
            LIMIT 1;
        `)[0];

        if (existingUsername) {
            return NextResponse.json(
                { error: "username already taken" },
                { status: 400 }
            );
        }


        let createdStore;

        // Call the ImageKit SDK upload function with the required parameters and callbacks.
        try {

            console.log("to create")
            createdStore = await prisma.store.create({
                data: {
                    name: String(name),
                    username: String(username),
                    description: String(description),
                    email: String(email),
                    contact: String(contact),
                    address: String(address),
                    logo: String(image),
                    userId: userId,
                },
            });

            console.log("store created:")
            console.log(createdStore)

            await prisma.user.update({
                where: { id: userId },
                data: { store: { connect: { id: createdStore.id } } }
            })

            return NextResponse.json({ message: "applied, waiting for approval" })

        } catch (error) {
            console.error(error.message)
            return NextResponse.json({ message: error.code || error.message }, { status: 400 })
        }

    } catch (error) {
        console.error(error)
        return NextResponse.json({ message: error.code || error.message }, { status: 400 })
    }
}

export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const store = (await prisma.$queryRaw`
            SELECT * FROM "Store"
            WHERE "userId" = ${userId}
            LIMIT 1;
        `)[0];

        if (store) {
            return NextResponse.json(
                { status: store.status }
            )
        }

        return NextResponse.json({ status: "not registered" })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: error.code || error.message }, { status: 400 })
    }
}