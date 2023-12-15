'use server';

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { StateInvoice, StateCustomer } from "./definitions";
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: "Please select a customer."
    }),
    amount: z.coerce
        .number()
        .gt(0, { message: "Please enter an amount greater than $0." }),
    status: z.enum(["pending", "paid"], {
        invalid_type_error: "Please select an invoice status.",
    }),
    date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: StateInvoice, formData: FormData) {
    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into the database
    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
        // If a database error occurs, return a more specific error.
        return {
            message: 'Database Error: Failed to Create Invoice.',
        };
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, prevState: StateInvoice, formData: FormData) {
    // Validate form using Zod
    const validatedFields = UpdateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Update Invoice.',
        };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;

    // Update data into the database
    try {
        await sql`
          UPDATE invoices
          SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
          WHERE id = ${id}
        `;
    } catch (error) {
        return { message: 'Database Error: Failed to Update Invoice.' };
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath("/dashboard/invoices");
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Invoice.' };
    }
}

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

const FormCustomerSchema = z.object({
    id: z.string()
        .trim()
        .uuid(),
    name: z.string({
        required_error: "Name is required",
        invalid_type_error: "Name must be a string",
    })
        .trim()
        .min(3, { message: "Must be 2 or more characters long" })
        .max(20, { message: "Must be 20 or fewer characters long" }),
    email: z.string({
        required_error: "Email is required",
        invalid_type_error: "Email must be a string"
    })
        .trim()
        .email({ message: "Invalid email address" }),
    image: z.string({
        required_error: "URL Image is required",
        invalid_type_error: "URL Image must be a string"
    })
        .trim()
        .url({ message: "Invalid url" })
})

const CreateCustomer = FormCustomerSchema.omit({ id: true, image: true });

export async function createCustomer(prevState: StateCustomer, formData: FormData) {
    //Validate form using Zod
    const validateFields = CreateCustomer.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        // image: formData.get("image"),
    });

    //If form validation fails, return errors early. Otherwise, continue.
    if (!validateFields.success) {
        return {
            errors: validateFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Add Customer"
        };
    }

    //Prepare data for insertion into the database
    const { name, email } = validateFields.data;
    const id = crypto.randomUUID();

    //Insert data into the database
    try {
        await sql`
        INSERT INTO customers (id, name, email)
        VALUES (${id}, ${name}, ${email})
        ON CONFLICT (id) DO NOTHING;
        `
    } catch (error) {
        // If a database error occurs, return a more specific error.
        return {
            message: 'Database Error: Failed to Add Customer.',
        };
    }

    //Revalidate the cache for the customers page and redirect the user.
    revalidatePath("/dashboard/customers");
    redirect("/dashboard/customers");
}

const UpdateCustomer = FormCustomerSchema.omit({ id: true, image: true});

export async function updateCustomer(id: string, prevState: StateCustomer, formData: FormData) {
    //Validate form using Zod
    const validatedFields = UpdateCustomer.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        // image: formData.get("image"),
    });

    //If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Add Customer"
        };
    }

    const {name, email} = validatedFields.data;

    // Update data into the database
    try {
        await sql`
          UPDATE customers
          SET name = ${name}, email = ${email}
          WHERE id = ${id}
        `;
    } catch (error) {
        return { message: 'Database Error: Failed to Update Invoice.' };
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/customers');
    redirect('/dashboard/customers');
}