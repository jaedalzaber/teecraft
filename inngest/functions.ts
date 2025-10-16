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

// {
//   "name": "clerk/user.created",
//   "data": {
//     "email":"alzaberjaed@gmail.com",
//     "name":"älzaber",
//     "image":""
//   }
// }

// Inngest Function to update user data in database
export const syncUserUpdation = inngest.createFunction(
  { id: "sync-user-update" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.update({
      where: { id: data.id },
      data: {
        email: data.email_addresses[0].email_address,
        name: `${data.first_name} ${data.last_name}`,
        image: data.image_url,
      },
    });
  }
);

// Inngest Function to delete user from database
export const syncUserDeletion = inngest.createFunction(
  { id: "sync-user-delete" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { data } = event;
    await prisma.user.delete({
      where: { id: data.id },
    });
  }
);
