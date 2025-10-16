import prisma from "@/lib/prisma";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

// Inngest Function to save user data to a database
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-create" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const user = event.data; // Clerk's user object

    // Extract basic info
    const { id, first_name, last_name, primary_email_address_id } = user;

    // Find the primary email address
    const primaryEmailObj = user.email_addresses?.find(
      (e: any) => e.id === primary_email_address_id
    );

    const email = primaryEmailObj?.email_address ?? null;

    // Create the user record in your Prisma database
    await prisma.user.create({
      data: {
        id,
        email,
        name: first_name + " " + last_name,
        image: user.image_url ?? null,
      },
    });
  }
);

export const syncUserUpdation = inngest.createFunction(
  { id: "sync-user-update" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const user = event.data;
    const { id, first_name, last_name, primary_email_address_id } = user;

    const primaryEmailObj = user.email_addresses?.find(
      (e: any) => e.id === primary_email_address_id
    );

    const email = primaryEmailObj?.email_address ?? null;

    await prisma.user.update({
      where: { id },
      data: {
        email,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        image: user.image_url ?? null,
      },
    });
  }
);

export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-delete" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data; // directly access id
    if (!id) return;

    await prisma.user.delete({
      where: { id },
    });
  }
);