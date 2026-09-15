import { z } from 'zod';
import { PRODUCT_BADGES, PRODUCT_STATUSES } from '@/server/models/Product';
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/server/models/Order';
import { USER_ROLES, USER_STATUSES } from '@/server/models/User';
import { UPLOAD_TARGETS } from '@/server/cloudinary';
import { SHIPPING_COUNTRIES } from '@/utils/shipping';

/** Request schemas for the API routes (zod). Field errors reach the UI as `{ 'name.en': 'message' }`. */

const text = (max = 5000) => z.string().trim().max(max).default('');

const localized = ({ required = false, max = 5000 } = {}) =>
  z.object({
    en: required ? z.string().trim().min(1, 'English text is required').max(max) : text(max),
    sv: text(max),
    el: text(max),
  });

const objectId = (message) => z.string().regex(/^[a-f\d]{24}$/i, message);

const imageUrl = z
  .string()
  .trim()
  .min(1)
  .refine((value) => value.startsWith('/') || value.startsWith('https://'), 'Invalid image URL');

export const imageInput = z.object({
  url: imageUrl,
  publicId: z.string().trim().default(''),
  alt: z.string().trim().max(200).default(''),
});

export const productInput = z
  .object({
    name: localized({ required: true, max: 160 }),
    sku: text(60),
    // Optional: an empty value leaves the product uncategorised.
    category: z
      .union([objectId('Choose a valid category'), z.literal(''), z.null()])
      .transform((value) => value || null)
      .default(null),
    description: localized({ max: 4000 }),
    images: z.array(imageInput).max(12, 'Up to 12 images per product'),
    variants: z
      .array(
        z.object({
          key: z
            .string()
            .trim()
            .min(1)
            .max(40)
            .regex(/^[a-z0-9-]+$/i, 'Letters, numbers and hyphens only'),
          label: localized({ required: true, max: 60 }),
          price: z.coerce.number({ message: 'Enter a price' }).min(0, 'Price cannot be negative').max(1_000_000),
          stock: z.coerce
            .number({ message: 'Enter a quantity' })
            .int('Whole numbers only')
            .min(0, 'Cannot be negative')
            .max(100_000),
          image: z.string().trim().default(''),
        })
      )
      .min(1, 'Add at least one size')
      .max(12)
      .refine((variants) => new Set(variants.map((v) => v.key.toLowerCase())).size === variants.length, {
        message: 'Each size needs a different label',
      }),
    defaultVariant: z.string().trim().default(''),
    badge: z.enum(PRODUCT_BADGES).default(''),
    featured: z.boolean().default(false),
    status: z.enum(PRODUCT_STATUSES).default('active'),
  })
  .strip();

/** Quick toggles from the product list. Stock is edited per size in the product form. */
export const productFlagsInput = z
  .object({
    featured: z.boolean().optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
  })
  .strip()
  .refine((flags) => flags.featured !== undefined || flags.status !== undefined, 'Nothing to update');

export const categoryInput = z
  .object({
    name: localized({ required: true, max: 80 }),
    description: localized({ max: 240 }),
    image: imageInput.nullable().default(null),
    sortOrder: z.coerce.number().int().min(0).max(999).default(0),
    active: z.boolean().default(true),
  })
  .strip();

export const orderStatusInput = z.object({
  status: z.enum(ORDER_STATUSES),
  note: text(500),
});

export const paymentStatusInput = z.object({ paymentStatus: z.enum(PAYMENT_STATUSES) });

export const adminNoteInput = z.object({ adminNote: text(2000) });

const password = z.string().min(8, 'Password must be at least 8 characters').max(200);

/** The ID token (JWT) returned by the Sign in with Google button. */
export const googleCredentialInput = z.object({ credential: z.string().min(20).max(5000) });

export const credentialsInput = z.object({
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required').max(200),
  remember: z.boolean().optional().default(false),
});

export const registerInput = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  password,
});

export const adminUserInput = registerInput.extend({ role: z.enum(USER_ROLES).default('admin') });

export const userRoleInput = z.object({ role: z.enum(USER_ROLES) });
export const userStatusInput = z.object({ status: z.enum(USER_STATUSES) });

const requiredText = (max, message) => z.string().trim().min(1, message).max(max);

/**
 * Checkout request: the cart, the customer's contact details and delivery address (also the billing
 * address at Klarna), the delivery country (sets the shipping fee), an optional note and the
 * storefront page to return to.
 */
export const checkoutInput = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(10000),
      })
    )
    .min(1, 'Your cart is empty')
    .max(50),
  firstName: requiredText(100, 'First name is required'),
  lastName: requiredText(100, 'Last name is required'),
  email: z.email('Enter a valid email address').trim().toLowerCase(),
  phone: z.string().trim().min(5, 'Enter a valid phone number').max(30),
  street: requiredText(200, 'Street address is required'),
  street2: text(200),
  postalCode: requiredText(20, 'Postal code is required'),
  city: requiredText(100, 'City is required'),
  country: z.enum(SHIPPING_COUNTRIES).default('SE'),
  note: text(1000),
  locale: z.string().max(5).default('en'),
  returnPath: z.string().max(200).default(''),
});

const klarnaReference = z.string().regex(/^[A-Za-z0-9-]{8,100}$/, 'Invalid payment reference');

/** The Klarna payment session and the authorization token from Klarna's widget. */
export const confirmPaymentInput = z.object({ sessionId: klarnaReference, authorizationToken: klarnaReference });

/** Klarna's authorization callback. */
export const klarnaAuthorizationInput = z.object({ session_id: klarnaReference, authorization_token: klarnaReference });

/** Klarna's notification about an order it was reviewing (only the field we use). */
export const klarnaNotificationInput = z.object({ order_id: klarnaReference });

export const uploadSignatureInput = z.object({ target: z.enum(UPLOAD_TARGETS) });
